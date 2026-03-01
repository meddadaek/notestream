<div align="center">

<!-- HEADER BANNER -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:020B18,50:0066FF,100:00D4FF&height=200&section=header&text=NoteStream&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=AI-Powered%20YouTube%20Study%20Notes%20%26%20Quiz%20Generator&descAlignY=58&descSize=18&animation=fadeIn"/>

<!-- BADGES -->
<p>
  <img src="https://img.shields.io/badge/Python-3.10+-00D4FF?style=for-the-badge&logo=python&logoColor=white&labelColor=020B18"/>
  <img src="https://img.shields.io/badge/Flask-3.0-0066FF?style=for-the-badge&logo=flask&logoColor=white&labelColor=020B18"/>
  <img src="https://img.shields.io/badge/Groq-LLaMA_3.3-00D4FF?style=for-the-badge&logo=meta&logoColor=white&labelColor=020B18"/>
  <img src="https://img.shields.io/badge/Railway-Deployed-0066FF?style=for-the-badge&logo=railway&logoColor=white&labelColor=020B18"/>
  <img src="https://img.shields.io/badge/License-MIT-00D4FF?style=for-the-badge&labelColor=020B18"/>
</p>

<p>
  <img src="https://img.shields.io/badge/Status-Live-00D4FF?style=flat-square&logo=circle&logoColor=white&labelColor=020B18"/>
  <img src="https://img.shields.io/badge/Free-No_Signup-0066FF?style=flat-square&labelColor=020B18"/>
  <img src="https://img.shields.io/badge/Languages-12+-00D4FF?style=flat-square&labelColor=020B18"/>
</p>

<br/>

### 🌐 **[notestream.up.railway.app](https://notestream.up.railway.app)**

<br/>

</div>

---

<div align="center">

## ✦ What is NoteStream?

</div>

> **NoteStream** transforms any YouTube video into structured AI study notes and interactive quizzes — in seconds. No more rewinding, no more manual note-taking. Just paste a link and let AI do the work.
⚠️ Currently live for 30 days.
<br/>

```
📺 YouTube Video  ──►  🤖 AI Processing  ──►  📝 Study Notes  ──►  🧠 Quiz
```

<br/>

---

## ✦ Features

<table>
<tr>
<td width="50%">

### 📝 AI Note Extraction
Powered by **LLaMA 3.3 70B** via Groq API. Extracts the full transcript and structures it into clean, organized study notes with sections, bullet points, and key takeaways.

</td>
<td width="50%">

### 🧠 Interactive Quiz Generator
Auto-generates **5 multiple choice questions** from your notes to test your understanding. Get instant feedback, see your score, and retake as many times as you want.

</td>
</tr>
<tr>
<td width="50%">

### 🌍 Multilingual Support
Process videos in **12 languages** — English, French, Arabic, Spanish, German, Italian, Portuguese, Russian, Japanese, Chinese, Korean, and Turkish.

</td>
<td width="50%">

### 📄 PDF Export
Download your notes as a **professionally formatted PDF** — ready for printing, sharing, or archiving. Clean layout with proper headings and bullet points.

</td>
</tr>
<tr>
<td width="50%">

### ⚡ Lightning Fast
Get full study notes in **under 30 seconds**. Groq's ultra-fast inference makes it feel instant compared to other AI tools.

</td>
<td width="50%">

### 🎨 Futuristic UI
Dark deep-ocean design with animated particle canvas, glowing orbs, and smooth micro-interactions. Built to feel like a real AI product.

</td>
</tr>
</table>

---

## ✦ Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5 · CSS3 · Vanilla JS · Canvas API |
| **Backend** | Python · Flask · Flask-CORS |
| **AI Model** | LLaMA 3.3 70B (via Groq API) |
| **Transcript** | youtube-transcript-api |
| **PDF Generation** | ReportLab |
| **Deployment** | Railway |
| **Font** | Syne + DM Mono (Google Fonts) |

</div>

---

## ✦ How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│   1. 📋  Paste YouTube URL + select language                     │
│                          │                                        │
│   2. 🔍  Flask extracts video ID                                 │
│                          │                                        │
│   3. 📜  youtube-transcript-api fetches captions                 │
│                          │                                        │
│   4. 🤖  Groq / LLaMA 3.3 70B generates structured notes        │
│                          │                                        │
│   5. 📝  Notes displayed with markdown formatting                │
│                          │                                        │
│   6. 🧠  Quiz generated from notes (5 MCQ questions)             │
│                          │                                        │
│   7. 📄  Optional: export as PDF                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✦ Getting Started

### Prerequisites

- Python 3.10+
- A [Groq API Key](https://console.groq.com) (free)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/meddadaek/notestream.git
cd notestream

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create your .env file
echo "GROQ_API_KEY=your_key_here" > .env

# 4. Run the app
python app.py
```

### Then open your browser at:
```
http://localhost:5000
```

---

## ✦ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key from [console.groq.com](https://console.groq.com) | ✅ Yes |

---

## ✦ Project Structure

```
notestream/
│
├── 🐍 app.py              # Flask backend — all API routes
├── 🌐 index.html          # Frontend UI
├── 🎨 style.css           # Futuristic dark UI styles
├── ⚡ script.js           # Frontend logic + quiz engine
│
├── 📦 requirements.txt    # Python dependencies
├── 🚀 Procfile            # Railway deployment config
├── 🔒 .gitignore          # Ignores .env and cache files
└── 📖 README.md           # You are here
```

---

## ✦ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the frontend |
| `POST` | `/api/extract-notes` | Extracts transcript + generates notes |
| `POST` | `/api/generate-quiz` | Generates quiz from notes |
| `POST` | `/api/download-pdf` | Returns notes as PDF file |
| `GET` | `/health` | Health check |

---

## ✦ Supported Languages

<div align="center">

🇬🇧 English · 🇫🇷 French · 🇩🇿 Arabic · 🇪🇸 Spanish · 🇩🇪 German · 🇮🇹 Italian

🇧🇷 Portuguese · 🇷🇺 Russian · 🇯🇵 Japanese · 🇨🇳 Chinese · 🇰🇷 Korean · 🇹🇷 Turkish

</div>

---

## ✦ Deployment

This project is deployed on **Railway**. To deploy your own instance:

```bash
# 1. Fork this repo
# 2. Go to railway.app → New Project → Deploy from GitHub
# 3. Select your fork
# 4. Add GROQ_API_KEY in the Variables tab
# 5. Generate a domain in Settings → Networking
```

---

## ✦ Author

<div align="center">

Built with 💙 by **AEK**

<p>
  <a href="https://github.com/meddadaek">
    <img src="https://img.shields.io/badge/GitHub-meddadaek-00D4FF?style=for-the-badge&logo=github&logoColor=white&labelColor=020B18"/>
  </a>
  &nbsp;
  <a href="https://www.instagram.com/_med_aek/">
    <img src="https://img.shields.io/badge/Instagram-_med__aek-0066FF?style=for-the-badge&logo=instagram&logoColor=white&labelColor=020B18"/>
  </a>
</p>

</div>

---

## ✦ License

```
MIT License — feel free to use, modify, and share.
```

---

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:00D4FF,50:0066FF,100:020B18&height=120&section=footer&animation=fadeIn"/>

</div>
