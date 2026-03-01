// ========================================
// CONFIGURATION
// ========================================
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : '';

// ========================================
// DOM ELEMENTS
// ========================================
const youtubeUrlInput = document.getElementById('youtubeUrl');
const generateBtn     = document.getElementById('generateBtn');
const loadingSection  = document.getElementById('loadingSection');
const resultsSection  = document.getElementById('resultsSection');
const notesContent    = document.getElementById('notesContent');
const downloadPdfBtn  = document.getElementById('downloadPdfBtn');
const copyBtn         = document.getElementById('copyBtn');
const newNoteBtn      = document.getElementById('newNoteBtn');
const generateQuizBtn = document.getElementById('generateQuizBtn');
const loadingTitle    = document.getElementById('loadingTitle');
const loadingText     = document.getElementById('loadingText');
const progressFill    = document.getElementById('progressFill');
const timestamp       = document.getElementById('timestamp');
const toast           = document.getElementById('toast');
const toastMessage    = document.getElementById('toastMessage');
const langSelect      = document.getElementById('langSelect');
const quizContent     = document.getElementById('quizContent');
const quizSubmitRow   = document.getElementById('quizSubmitRow');
const submitQuizBtn   = document.getElementById('submitQuizBtn');
const retakeQuizBtn   = document.getElementById('retakeQuizBtn');
const quizBadge       = document.getElementById('quizBadge');
const quizScoreDisplay = document.getElementById('quizScoreDisplay');
const notesLangBadge  = document.getElementById('notesLangBadge');

// ========================================
// STATE
// ========================================
let currentNotes = '';
let currentVideoTitle = '';
let currentLang = 'en';
let quizQuestions = [];
let quizSubmitted = false;
let progressInterval = null;

// Language display names
const LANG_NAMES = {
    en: 'English', fr: 'French', ar: 'Arabic', es: 'Spanish',
    de: 'German', it: 'Italian', pt: 'Portuguese', ru: 'Russian',
    ja: 'Japanese', zh: 'Chinese', ko: 'Korean', tr: 'Turkish'
};

// ========================================
// PARTICLE CANVAS
// ========================================
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.4 + 0.05,
    }));

    function frame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 180, 255, ${p.alpha})`;
            ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 180, 255, ${0.08 * (1 - dist / 110)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(frame);
    }
    frame();
}

// ========================================
// EVENT LISTENERS
// ========================================
generateBtn.addEventListener('click', handleGenerateNotes);
youtubeUrlInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleGenerateNotes(); });
downloadPdfBtn.addEventListener('click', handleDownloadPdf);
copyBtn.addEventListener('click', handleCopyNotes);
newNoteBtn.addEventListener('click', handleNewNote);
generateQuizBtn.addEventListener('click', handleGenerateQuiz);
submitQuizBtn.addEventListener('click', handleSubmitQuiz);
retakeQuizBtn.addEventListener('click', handleRetakeQuiz);

// Tab switching — must remove 'hidden' class too since quizTab starts hidden
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.remove('active');
        t.classList.add('hidden');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const activeTab = document.getElementById(tabId + 'Tab');
    if (activeBtn) activeBtn.classList.add('active');
    if (activeTab) {
        activeTab.classList.remove('hidden');
        activeTab.classList.add('active');
    }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Nav smooth scroll
document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

// ========================================
// MAIN: GENERATE NOTES
// ========================================
async function handleGenerateNotes() {
    const url = youtubeUrlInput.value.trim();
    currentLang = langSelect ? langSelect.value : 'en';

    if (!url) { showToast('Please enter a YouTube URL', 'error'); return; }
    if (!isValidYouTubeUrl(url)) { showToast('Please enter a valid YouTube URL', 'error'); return; }

    generateBtn.disabled = true;
    generateBtn.querySelector('.btn-text').textContent = 'Processing...';

    showLoading();

    try {
        simulateProgress();

        const response = await fetch(`${API_BASE_URL}/api/extract-notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ url, lang: currentLang })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || `Server error: ${response.status}`);

        currentNotes = data.notes;
        currentVideoTitle = extractVideoTitle(url);
        quizQuestions = [];
        quizSubmitted = false;
        quizBadge.textContent = '0';

        // Reset quiz tab
        quizContent.innerHTML = `
            <div class="quiz-empty">
                <div class="quiz-empty-icon">?</div>
                <p>Click <strong>Generate Quiz</strong> in the Notes tab to create questions from your notes.</p>
            </div>`;
        quizSubmitRow.classList.add('hidden');
        retakeQuizBtn.classList.add('hidden');
        quizScoreDisplay.textContent = '';

        hideLoading();
        showResults(data.notes);

    } catch (err) {
        console.error(err);
        hideLoading();
        showToast(err.message || 'An error occurred. Please try again.', 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.querySelector('.btn-text').textContent = 'Generate';
    }
}

// ========================================
// QUIZ GENERATION
// ========================================
async function handleGenerateQuiz() {
    if (!currentNotes) {
        showToast('Generate notes first', 'error');
        return;
    }

    generateQuizBtn.disabled = true;
    generateQuizBtn.querySelector('span:last-child') && (generateQuizBtn.querySelector('span:last-child').textContent = '...');
    const origText = generateQuizBtn.querySelector('svg').nextSibling;

    // Switch to quiz tab (properly removes hidden class)
    switchTab('quiz');

    quizContent.innerHTML = `
        <div class="quiz-empty">
            <div class="quiz-empty-icon" style="animation: spin 1s linear infinite; font-size:1rem;">⟳</div>
            <p style="margin-top:8px">Generating questions from your notes…</p>
        </div>`;
    quizSubmitRow.classList.add('hidden');

    const finishQuiz = (questions, fromBackend) => {
        quizQuestions = questions;
        quizSubmitted = false;
        quizBadge.textContent = quizQuestions.length;
        quizScoreDisplay.textContent = `${quizQuestions.length} questions`;
        renderQuiz();
        quizSubmitRow.classList.remove('hidden');
        retakeQuizBtn.classList.add('hidden');
        const label = fromBackend ? 'AI-generated' : 'generated from notes';
        showToast(`Quiz ready! ${quizQuestions.length} questions ${label}`, 'success');
        generateQuizBtn.disabled = false;
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/generate-quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: currentNotes, lang: currentLang })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Backend error');
        if (!data.questions || data.questions.length === 0) throw new Error('Empty questions array');

        console.log('[Quiz] Backend returned', data.questions.length, 'questions');
        finishQuiz(data.questions, true);

    } catch (err) {
        console.warn('[Quiz] Backend failed, switching to client-side generator:', err.message);
        const fallbackQs = generateQuizClientSide(currentNotes);
        console.log('[Quiz] Client-side generated', fallbackQs.length, 'questions');
        finishQuiz(fallbackQs, false);
    }
}

// ========================================
// ROBUST CLIENT-SIDE QUIZ GENERATOR
// Always produces 5 questions from any notes text
// ========================================
function generateQuizClientSide(notes) {
    const questions = [];

    // --- Step 1: Extract key data from notes ---
    const headings   = extractHeadings(notes);
    const bulletPoints = extractBullets(notes);
    const sentences  = extractSentences(notes);
    const keyTerms   = extractKeyTerms(notes);

    // --- Strategy A: Heading-based "what is this about?" questions ---
    headings.slice(0, 3).forEach(h => {
        if (questions.length >= 5) return;
        const wrongs = headings.filter(x => x !== h).slice(0, 2);
        // pad wrongs if needed
        const pool = ['An unrelated concept', 'A counter-argument', 'Background history', 'A future prediction'];
        while (wrongs.length < 3) wrongs.push(pool[wrongs.length]);

        questions.push({
            question: `Which of the following is a main topic covered in the video?`,
            options: shuffle([h, ...wrongs.slice(0, 3)]),
            answer: h
        });
    });

    // --- Strategy B: Fill-in-the-blank from bullet points ---
    for (let i = 0; i < bulletPoints.length && questions.length < 5; i++) {
        const bp = bulletPoints[i];
        const words = bp.split(' ');
        if (words.length < 5) continue;

        const stopWords = new Set(['the','a','an','is','are','was','were','to','of','and','or','in','on','for','with','that','this','it','be','as','at','by','from','not','also','can','has','have','will']);
        const candidates = words
            .map((w, idx) => ({ word: w.replace(/[^a-zA-Z0-9]/g, ''), idx }))
            .filter(({ word }) => word.length > 3 && !stopWords.has(word.toLowerCase()));

        if (candidates.length === 0) continue;

        const pick = candidates[Math.floor(candidates.length / 2)];
        const answer = pick.word;
        const blanked = words.map((w, idx) => idx === pick.idx ? '______' : w).join(' ');

        // Build 3 distractors from other key terms
        const distractors = keyTerms
            .filter(t => t.toLowerCase() !== answer.toLowerCase())
            .slice(0, 3);

        // Always pad to 3 distractors with generic fallbacks
        const fallbackDistractors = ['None of the above', 'All of the above', 'Cannot be determined', 'Not mentioned'];
        while (distractors.length < 3) distractors.push(fallbackDistractors[distractors.length]);

        questions.push({
            question: `Fill in the blank: "${blanked}"`,
            options: shuffle([answer, ...distractors.slice(0, 3)]),
            answer
        });
    }

    // --- Strategy C: True/false-style from sentences ---
    for (let i = 0; i < sentences.length && questions.length < 5; i++) {
        const sent = sentences[i];
        if (sent.length < 30) continue;

        // Negate a key part of the sentence for the wrong answer
        const wrongVersion = negateOrAlter(sent);
        if (!wrongVersion) continue;

        questions.push({
            question: `Which statement is TRUE based on the video content?`,
            options: shuffle([
                sent,
                wrongVersion,
                'Neither statement was mentioned in the video',
                'Both statements are equally correct'
            ]),
            answer: sent
        });
    }

    // --- Strategy D: Term definition (guaranteed fallback) ---
    keyTerms.slice(0, 5 - questions.length).forEach(term => {
        if (questions.length >= 5) return;
        const wrongs = keyTerms.filter(t => t !== term).slice(0, 3);
        const pool = ['photosynthesis', 'entropy', 'iteration', 'recursion', 'abstraction'];
        while (wrongs.length < 3) wrongs.push(pool[wrongs.length % pool.length]);

        questions.push({
            question: `Which of the following terms is specifically discussed or defined in the video?`,
            options: shuffle([term, ...wrongs.slice(0, 3)]),
            answer: term
        });
    });

    // --- Ultimate fallback: always have at least 3 questions ---
    const genericFallbacks = [
        {
            question: 'What is the primary purpose of these notes?',
            options: ['To summarize the video content', 'To critique the video', 'To provide a counter-argument', 'To advertise a product'],
            answer: 'To summarize the video content'
        },
        {
            question: 'According to the notes, the content of the video is best described as:',
            options: ['Educational and informative', 'Purely entertainment', 'A fictional story', 'A news broadcast'],
            answer: 'Educational and informative'
        },
        {
            question: 'What format were these notes generated in?',
            options: ['AI-generated study notes', 'Manual transcript', 'User-written summary', 'Auto-captions only'],
            answer: 'AI-generated study notes'
        }
    ];

    genericFallbacks.forEach(q => {
        if (questions.length >= 5) return;
        questions.push(q);
    });

    return questions.slice(0, 5);
}

// --- Helpers for client-side quiz ---

function extractHeadings(notes) {
    return (notes.match(/^#{1,3}\s+(.+)$/gm) || [])
        .map(h => h.replace(/^#+\s+/, '').replace(/\*\*/g, '').trim())
        .filter(h => h.length > 3);
}

function extractBullets(notes) {
    return (notes.match(/^[\*\-]\s+(.+)$/gm) || [])
        .map(b => b.replace(/^[\*\-]\s+/, '').replace(/\*\*/g, '').trim())
        .filter(b => b.length > 20);
}

function extractSentences(notes) {
    // Remove markdown, split by period
    const clean = notes
        .replace(/^#+\s+.+$/gm, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '');
    return clean
        .split(/\.(?:\s|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 40 && s.length < 180 && /[a-zA-Z]{3,}/.test(s))
        .slice(0, 6);
}

function extractKeyTerms(notes) {
    // Find words that appear in headings or are capitalized mid-sentence (likely key terms)
    const headingWords = (notes.match(/^#{1,3}\s+(.+)$/gm) || [])
        .map(h => h.replace(/^#+\s+/, '').trim())
        .join(' ')
        .split(/\s+/)
        .filter(w => w.length > 4)
        .map(w => w.replace(/[^a-zA-Z0-9]/g, ''));

    // Also grab bold terms
    const boldTerms = (notes.match(/\*\*(.+?)\*\*/g) || [])
        .map(b => b.replace(/\*\*/g, '').trim())
        .filter(b => b.length > 3 && b.split(' ').length <= 3);

    const combined = [...new Set([...boldTerms, ...headingWords])].filter(Boolean);
    return combined.length > 0 ? combined : ['key concept', 'main idea', 'core principle', 'important detail', 'central theme'];
}

function negateOrAlter(sentence) {
    // Simple negation strategies
    const replacements = [
        [' always ', ' never '],
        [' increases ', ' decreases '],
        [' improves ', ' worsens '],
        [' is ', ' is not '],
        [' are ', ' are not '],
        [' can ', ' cannot '],
        [' helps ', ' hinders '],
        [' positive ', ' negative '],
        [' more ', ' less '],
        [' faster ', ' slower '],
    ];

    for (const [from, to] of replacements) {
        if (sentence.toLowerCase().includes(from.toLowerCase())) {
            return sentence.replace(new RegExp(from, 'i'), to);
        }
    }

    // Last resort: add "not" after first verb-like word
    const words = sentence.split(' ');
    if (words.length > 4) {
        const altered = [...words];
        altered.splice(2, 0, 'not');
        return altered.join(' ');
    }

    return null;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function renderQuiz() {
    quizContent.innerHTML = '';

    if (!quizQuestions || quizQuestions.length === 0) {
        quizContent.innerHTML = `<div class="quiz-empty"><div class="quiz-empty-icon">!</div><p>No questions could be generated. Please try again.</p></div>`;
        return;
    }

    quizQuestions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `question-${idx}`;

        const optionsHTML = q.options.map((opt, oi) => `
            <label class="option-label" id="opt-${idx}-${oi}">
                <input type="radio" name="q${idx}" value="${escapeHtml(opt)}" />
                <span class="option-indicator"></span>
                <span class="option-text">${escapeHtml(opt)}</span>
            </label>
        `).join('');

        card.innerHTML = `
            <div class="question-num">Question ${idx + 1} of ${quizQuestions.length}</div>
            <div class="question-text">${escapeHtml(q.question)}</div>
            <div class="question-options">${optionsHTML}</div>
            <div class="question-feedback" id="feedback-${idx}"></div>
        `;

        quizContent.appendChild(card);

        // Staggered safe animation — added after paint so card is visible first
        setTimeout(() => card.classList.add('card-appear'), idx * 60);
    });

    // Scroll quiz into view
    setTimeout(() => quizContent.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function handleSubmitQuiz() {
    if (quizSubmitted) return;
    quizSubmitted = true;

    let score = 0;

    quizQuestions.forEach((q, idx) => {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        const feedback = document.getElementById(`feedback-${idx}`);
        const card = document.getElementById(`question-${idx}`);
        const userAnswer = selected ? selected.value : null;
        const correct = q.answer;

        // Disable all options
        document.querySelectorAll(`input[name="q${idx}"]`).forEach(radio => {
            radio.disabled = true;
            const label = radio.closest('.option-label');
            label.classList.add('disabled');

            if (radio.value === correct) {
                label.classList.add('correct-opt');
            } else if (radio.checked) {
                label.classList.add('wrong-opt');
            }
        });

        if (userAnswer === correct) {
            score++;
            card.classList.add('correct-card');
            feedback.className = 'question-feedback show correct';
            feedback.textContent = '✓ Correct!';
        } else {
            card.classList.add('wrong-card');
            feedback.className = 'question-feedback show wrong';
            feedback.textContent = userAnswer
                ? `✗ Incorrect. The correct answer is: ${correct}`
                : `✗ No answer selected. Correct: ${correct}`;
        }
    });

    // Show result banner
    const pct = Math.round((score / quizQuestions.length) * 100);
    const msg = pct === 100 ? '🎉 Perfect score!' : pct >= 70 ? '👍 Great job!' : pct >= 40 ? '📚 Keep studying!' : '💪 Review the notes and try again!';

    const banner = document.createElement('div');
    banner.className = 'quiz-result-banner';
    banner.innerHTML = `
        <div class="quiz-result-score">${score}/${quizQuestions.length}</div>
        <div class="quiz-result-label">${pct}% correct</div>
        <div class="quiz-result-msg">${msg}</div>
    `;
    quizContent.insertBefore(banner, quizContent.firstChild);

    quizScoreDisplay.textContent = `Score: ${score}/${quizQuestions.length}`;
    submitQuizBtn.textContent = 'Submitted';
    submitQuizBtn.disabled = true;
    retakeQuizBtn.classList.remove('hidden');

    quizContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleRetakeQuiz() {
    quizSubmitted = false;
    quizScoreDisplay.textContent = `${quizQuestions.length} questions`;
    submitQuizBtn.textContent = 'Submit Answers';
    submitQuizBtn.disabled = false;
    renderQuiz();
    quizSubmitRow.classList.remove('hidden');
    retakeQuizBtn.classList.add('hidden');
}

// ========================================
// PDF DOWNLOAD
// ========================================
async function handleDownloadPdf() {
    if (!currentNotes) return;

    downloadPdfBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/download-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: currentNotes, title: currentVideoTitle, lang: currentLang })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to generate PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentVideoTitle.replace(/[^a-z0-9]/gi, '_')}_notes.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('PDF downloaded successfully! 🎉', 'success');

    } catch (err) {
        console.error(err);
        showToast('Failed to download PDF: ' + err.message, 'error');
    } finally {
        downloadPdfBtn.disabled = false;
    }
}

// ========================================
// COPY NOTES
// ========================================
function handleCopyNotes() {
    if (!currentNotes) return;
    navigator.clipboard.writeText(currentNotes).then(() => {
        showToast('Notes copied! 📋', 'success');
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L7 12L13 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Copied!`;
        setTimeout(() => { copyBtn.innerHTML = orig; }, 2000);
    }).catch(() => showToast('Failed to copy', 'error'));
}

// ========================================
// NEW NOTE
// ========================================
function handleNewNote() {
    youtubeUrlInput.value = '';
    currentNotes = '';
    currentVideoTitle = '';
    quizQuestions = [];
    resultsSection.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => youtubeUrlInput.focus(), 500);
}

// ========================================
// UI HELPERS
// ========================================
function showLoading() {
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    progressFill.style.width = '0%';

    // Reset steps
    ['lstep1','lstep2','lstep3','lstep4'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) { el.className = 'lstep' + (i === 0 ? ' active' : ''); }
    });

    const messages = [
        { title: 'Extracting transcript...', text: 'Fetching video captions', step: 'lstep1' },
        { title: 'Analyzing content...', text: 'AI is processing the transcript', step: 'lstep2' },
        { title: 'Creating notes...', text: 'Organizing information', step: 'lstep3' },
        { title: 'Almost there...', text: 'Finalizing your notes', step: 'lstep4' }
    ];

    let idx = 0;
    loadingTitle.textContent = messages[0].title;
    loadingText.textContent  = messages[0].text;

    const msgInterval = setInterval(() => {
        if (idx < messages.length) {
            const prev = document.getElementById(messages[Math.max(0,idx-1)].step);
            if (prev && idx > 0) prev.className = 'lstep done';
        }
        idx++;
        if (idx < messages.length) {
            loadingTitle.textContent = messages[idx].title;
            loadingText.textContent  = messages[idx].text;
            const curr = document.getElementById(messages[idx].step);
            if (curr) curr.className = 'lstep active';
        } else {
            clearInterval(msgInterval);
        }
    }, 3500);

    loadingSection.dataset.msgInterval = msgInterval;

    setTimeout(() => {
        loadingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function hideLoading() {
    clearInterval(parseInt(loadingSection.dataset.msgInterval || '0'));
    clearInterval(progressInterval);
    progressFill.style.width = '100%';
    setTimeout(() => loadingSection.classList.add('hidden'), 500);
}

function showResults(notes) {
    notesContent.innerHTML = formatNotes(notes);

    const now = new Date();
    timestamp.textContent = now.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
    });

    notesLangBadge.textContent = `Lang: ${LANG_NAMES[currentLang] || currentLang}`;

    resultsSection.classList.remove('hidden');

    // Switch to notes tab (properly handles hidden class)
    switchTab('notes');

    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function simulateProgress() {
    let progress = 0;
    progressInterval = setInterval(() => {
        progress += Math.random() * 12;
        if (progress > 88) progress = 88;
        progressFill.style.width = progress + '%';
    }, 600);
}

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    const icon = toast.querySelector('.toast-icon');

    if (type === 'error') {
        icon.innerHTML = `
            <circle cx="10" cy="10" r="8" stroke="#EF4444" stroke-width="2"/>
            <path d="M10 6V10M10 13V14" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
        `;
    } else {
        icon.innerHTML = `
            <circle cx="10" cy="10" r="8" stroke="#10B981" stroke-width="2"/>
            <path d="M7 10L9 12L13 8" stroke="#10B981" stroke-width="2" stroke-linecap="round"/>
        `;
    }

    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function isValidYouTubeUrl(url) {
    return [
        /(?:youtube\.com\/watch\?v=)([^&\n]+)/,
        /(?:youtu\.be\/)([^&\n]+)/,
        /(?:youtube\.com\/embed\/)([^&\n]+)/
    ].some(p => p.test(url));
}

function extractVideoTitle(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&\n]+)/,
        /(?:youtu\.be\/)([^&\n]+)/,
        /(?:youtube\.com\/embed\/)([^&\n]+)/
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return `Video_${m[1]}`;
    }
    return 'YouTube_Video';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatNotes(notes) {
    if (!notes) return '<p>No notes available</p>';

    let f = notes;

    // Headers
    f = f.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    f = f.replace(/^## (.*$)/gim,  '<h2>$1</h2>');
    f = f.replace(/^# (.*$)/gim,   '<h1>$1</h1>');

    // Bold + italic
    f = f.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    f = f.replace(/\*(.*?)\*/g,     '<em>$1</em>');

    // Code
    f = f.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bullet lists
    f = f.replace(/^[\*\-] (.*$)/gim, '<li>$1</li>');
    f = f.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');

    // Numbered lists
    f = f.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // Paragraphs
    f = f.replace(/\n\n/g, '</p><p>');
    if (!f.startsWith('<')) f = '<p>' + f + '</p>';

    // Cleanup
    f = f.replace(/<p>\s*<\/p>/g, '');
    f = f.replace(/<p>(<h[1-6]>)/g, '$1');
    f = f.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    f = f.replace(/<p>(<ul>)/g,     '$1');
    f = f.replace(/(<\/ul>)<\/p>/g, '$1');
    f = f.replace(/\n/g, ' ');

    return f;
}

// ========================================
// INIT
// ========================================
window.addEventListener('load', () => {
    initParticles();
    youtubeUrlInput.focus();
    document.documentElement.style.scrollBehavior = 'smooth';
    console.log('🚀 NoteStream initialized | by AEK → github.com/meddadaek');
});
