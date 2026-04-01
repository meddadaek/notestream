from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from groq import Groq
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import os
from dotenv import load_dotenv
import re
import json
from io import BytesIO

load_dotenv()

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"]
    }
})

# Your Groq API key — put this in a .env file locally
# On Railway, set it in the Variables tab
groq_api_key = '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'
client = Groq(api_key=groq_api_key)

# Supported languages for transcript fallback order
LANG_FALLBACKS = {
    'en': ['en', 'en-US', 'en-GB'],
    'fr': ['fr', 'fr-FR', 'en'],
    'ar': ['ar', 'ar-SA', 'en'],
    'es': ['es', 'es-ES', 'es-MX', 'en'],
    'de': ['de', 'de-DE', 'en'],
    'it': ['it', 'it-IT', 'en'],
    'pt': ['pt', 'pt-BR', 'pt-PT', 'en'],
    'ru': ['ru', 'ru-RU', 'en'],
    'ja': ['ja', 'en'],
    'zh': ['zh', 'zh-Hans', 'zh-Hant', 'en'],
    'ko': ['ko', 'en'],
    'tr': ['tr', 'tr-TR', 'en'],
}

LANG_NAMES = {
    'en': 'English', 'fr': 'French', 'ar': 'Arabic', 'es': 'Spanish',
    'de': 'German', 'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian',
    'ja': 'Japanese', 'zh': 'Chinese', 'ko': 'Korean', 'tr': 'Turkish',
}


def extract_video_id(url):
    patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([^&]+)',
        r'(?:https?://)?(?:www\.)?youtu\.be/([^?&]+)',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([^?&]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_transcript(video_id, lang='en'):
    try:
        ytt_api = YouTubeTranscriptApi()
        preferred_langs = LANG_FALLBACKS.get(lang, ['en'])

        # Try preferred languages in order
        transcript = None
        for l in preferred_langs:
            try:
                transcript = ytt_api.fetch(video_id, languages=[l])
                print(f"Transcript fetched in language: {l}")
                break
            except Exception:
                continue

        # If none worked, try fetching any available
        if transcript is None:
            transcript = ytt_api.fetch(video_id)
            print("Transcript fetched in default language")

        transcript_data = transcript.to_raw_data()
        text = " ".join([item['text'] for item in transcript_data])
        print(f"Transcript length: {len(text)} characters")
        return text

    except Exception as e:
        print(f"Transcript error: {e}")
        import traceback
        traceback.print_exc()
        return None


def summarize_transcript(transcript, lang='en'):
    try:
        max_chars = 6000
        truncated = transcript[:max_chars]
        lang_name = LANG_NAMES.get(lang, 'English')

        lang_instruction = ""
        if lang != 'en':
            lang_instruction = f" Write the notes in {lang_name}."

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a helpful assistant that creates clear, well-structured study notes from video transcripts. Create comprehensive notes with sections, bullet points, and key takeaways.{lang_instruction}"
                },
                {
                    "role": "user",
                    "content": f"Please create detailed study notes from this video transcript. Include:\n\n1. Title/Topic\n2. Main Concepts (with explanations)\n3. Key Points (bullet points)\n4. Important Details\n5. Summary/Takeaways\n\nTranscript:\n{truncated}"
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )

        notes = response.choices[0].message.content
        print(f"Notes generated: {len(notes)} characters")
        return notes

    except Exception as e:
        print(f"Error generating notes: {e}")
        import traceback
        traceback.print_exc()
        return f"Error generating notes: {str(e)}"


def generate_quiz_from_notes(notes, lang='en'):
    """Generate multiple-choice quiz questions from notes using AI."""
    try:
        lang_name = LANG_NAMES.get(lang, 'English')
        lang_instruction = f" Generate the questions and answers in {lang_name}." if lang != 'en' else ""

        prompt = f"""Based on the following study notes, generate exactly 5 multiple-choice quiz questions to test understanding.

Return ONLY a valid JSON array with this exact structure (no other text):
[
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The exact correct option text"
  }}
]

Rules:
- Each question must have exactly 4 options
- The answer must be one of the 4 options verbatim
- Questions should test comprehension, not trivial recall
- Make distractors plausible but clearly wrong{lang_instruction}

Study Notes:
{notes[:4000]}"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a quiz generator. You only output valid JSON arrays. No markdown, no explanation, just the JSON array."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.5,
            max_tokens=1500
        )

        raw = response.choices[0].message.content.strip()

        # Clean up potential markdown fences
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        raw = raw.strip()

        questions = json.loads(raw)

        # Validate structure
        validated = []
        for q in questions:
            if (isinstance(q, dict) and
                'question' in q and 'options' in q and 'answer' in q and
                isinstance(q['options'], list) and len(q['options']) >= 2 and
                q['answer'] in q['options']):
                validated.append(q)

        print(f"Quiz generated: {len(validated)} questions")
        return validated

    except Exception as e:
        print(f"Quiz generation error: {e}")
        import traceback
        traceback.print_exc()
        return None


def create_pdf(notes, video_title="YouTube Video Notes"):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor='#1a3a5c',
        spaceAfter=30,
        alignment=TA_CENTER
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=15,
        textColor='#1e4a7a',
        spaceAfter=12,
        spaceBefore=16
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        alignment=TA_JUSTIFY,
        spaceAfter=10,
        leading=16
    )

    story = []
    story.append(Paragraph(video_title, title_style))
    story.append(Spacer(1, 20))

    for para in notes.split('\n'):
        if para.strip():
            clean = para.strip()
            is_heading = False

            if clean.startswith('#'):
                clean = clean.replace('#', '').strip()
                is_heading = True
            elif clean.startswith('**') and clean.endswith('**'):
                clean = clean.replace('**', '').strip()
                is_heading = True
            elif clean.isupper() and len(clean) > 3:
                is_heading = True

            clean = clean.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            clean = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', clean)
            clean = re.sub(r'\*(.*?)\*',     r'<i>\1</i>', clean)

            try:
                if is_heading:
                    story.append(Paragraph(clean, heading_style))
                else:
                    story.append(Paragraph(clean, body_style))
                story.append(Spacer(1, 4))
            except Exception:
                pass

    doc.build(story)
    buffer.seek(0)
    return buffer


# ========================================
# ROUTES
# ========================================

@app.route('/api/extract-notes', methods=['POST', 'OPTIONS'])
def generate_notes():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 204

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        youtube_url = data.get('url')
        lang = data.get('lang', 'en')

        if not youtube_url:
            return jsonify({'error': 'YouTube URL is required'}), 400

        print(f"\n=== New Request | lang={lang} ===")
        print(f"URL: {youtube_url}")

        video_id = extract_video_id(youtube_url)
        if not video_id:
            return jsonify({'error': 'Invalid YouTube URL. Could not extract video ID'}), 400

        transcript = get_transcript(video_id, lang)
        if not transcript:
            return jsonify({'error': 'Could not get transcript. Make sure the video has captions/subtitles enabled.'}), 400

        notes = summarize_transcript(transcript, lang)

        if notes.startswith('Error'):
            return jsonify({'error': notes}), 500

        return jsonify({'success': True, 'notes': notes, 'video_id': video_id, 'lang': lang})

    except Exception as e:
        print(f"Server error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-quiz', methods=['POST', 'OPTIONS'])
def generate_quiz():
    """Generate a multiple-choice quiz from provided notes."""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 204

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        notes = data.get('notes')
        lang  = data.get('lang', 'en')

        if not notes:
            return jsonify({'error': 'Notes are required'}), 400

        print(f"\n=== Quiz Generation | lang={lang} ===")

        questions = generate_quiz_from_notes(notes, lang)

        if not questions:
            return jsonify({'error': 'Failed to generate quiz questions'}), 500

        return jsonify({'success': True, 'questions': questions, 'count': len(questions)})

    except Exception as e:
        print(f"Quiz error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/download-pdf', methods=['POST', 'OPTIONS'])
def download_pdf():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 204

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        notes = data.get('notes')
        video_title = data.get('title', 'YouTube Video Notes')

        if not notes:
            return jsonify({'error': 'Notes are required'}), 400

        pdf_buffer = create_pdf(notes, video_title)

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{video_title.replace(" ", "_")}_notes.pdf'
        )

    except Exception as e:
        print(f"PDF error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/')
def index():
    return send_file('index.html')

@app.route('/style.css')
def serve_css():
    return send_file('style.css')

@app.route('/script.js')
def serve_js():
    return send_file('script.js')


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'NoteStream server is running'})


if __name__ == '__main__':
    print("\n=== NoteStream Server ===")
    print(f"Groq key: {groq_api_key[:10] if groq_api_key else 'NOT SET'}...")
    print("Running at http://localhost:5000\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
