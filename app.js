/* =========================
   DOM elementlari
========================= */
const lessonSelect = document.getElementById("lessonSelect");
const fromIdx = document.getElementById("fromIdx");
const toIdx = document.getElementById("toIdx");
const countInput = document.getElementById("count");
const startBtn = document.getElementById("startBtn");
const startBtnInline = document.getElementById("startBtnInline");
const resetBtn = document.getElementById("resetBtn");
const modeSelect = document.getElementById("modeSelect");
const shuffleToggle = document.getElementById("shuffleToggle");
const saveToggle = document.getElementById("saveToggle");
const showRomajiToggle = document.getElementById("showRomajiToggle");
const quizArea = document.getElementById("quizArea");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const lessonMeta = document.getElementById("lessonMeta");
const pctText = document.getElementById("pctText");
const resultPanel = document.getElementById("resultPanel");
const resultTitle = document.getElementById("resultTitle");
const resultAdvice = document.getElementById("resultAdvice");
const medalEl = document.getElementById("medal");
const retryBtn = document.getElementById("retryBtn");
const goSettingsBtn = document.getElementById("goSettings");
const mistakesList = document.getElementById("mistakesList");
const timeSpentEl = document.getElementById("timeSpent");

let pool = [],
  questions = [],
  currentIndex = 0,
  score = 0,
  mode = "flashcard";
let userAnswers = [],
  startedAt = 0,
  timerInterval = null;

/* =========================
   Helper funksiyalar
========================= */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .trim();
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function showRomaji() {
  return showRomajiToggle.checked;
}
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* =========================
   Lesson select init
========================= */
function initLessonSelect() {
  lessonSelect.innerHTML = "";
  if (typeof LESSONS === "undefined") {
    console.error("LESSONS topilmadi!");
    return;
  }
  Object.values(LESSONS).forEach((lesson) => {
    if (!lesson || !lesson.words) return;
    const opt = document.createElement("option");
    opt.value = lesson.id;
    opt.textContent = `${lesson.id} — ${lesson.title} (${lesson.words.length})`;
    lessonSelect.appendChild(opt);
  });
}

/* =========================
   Pool yaratish
========================= */
function collectPool() {
  let selected = [];
  const f = parseInt(fromIdx.value),
    t = parseInt(toIdx.value);
  if (!isNaN(f) && !isNaN(t) && f > 0 && t >= f) {
    for (let i = f; i <= t; i++) if (LESSONS[i]) selected.push(LESSONS[i]);
  } else {
    const opts = Array.from(lessonSelect.selectedOptions).map((o) =>
      parseInt(o.value)
    );
    if (opts.length === 0) selected.push(LESSONS[1]);
    else
      opts.forEach((id) => {
        if (LESSONS[id]) selected.push(LESSONS[id]);
      });
  }

  const flat = [];
  selected.forEach((lesson) => {
    lesson.words.forEach((w) => {
      flat.push({ ...w, lessonId: lesson.id, lessonTitle: lesson.title });
    });
  });
  return flat;
}

/* =========================
   Savollar tayyorlash
========================= */
function prepareQuestions() {
  pool = collectPool();
  if (pool.length === 0) {
    alert("So‘zlar topilmadi.");
    return false;
  }

  const requested = clamp(parseInt(countInput.value) || 10, 1, pool.length);
  let sel = pool.slice();
  if (shuffleToggle.checked) sel = shuffle(sel);
  sel = sel.slice(0, requested);
  mode = modeSelect.value;

  questions = sel.map((w) => {
    if (mode === "multiple") {
      const wrongPool = pool.filter(
        (p) => normalize(p.translation) !== normalize(w.translation)
      );
      const wrong = shuffle(wrongPool)
        .slice(0, 3)
        .map((x) => x.translation);
      const options = shuffle([w.translation, ...wrong]);
      return { source: w, options, answer: w.translation };
    } else {
      return { source: w, options: [], answer: w.translation };
    }
  });

  currentIndex = 0;
  score = 0;
  userAnswers = [];
  startedAt = Date.now();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const sec = Math.floor((Date.now() - startedAt) / 1000);
    timeSpentEl.textContent = `Vaqt: ${sec} s`;
  }, 1000);

  resultPanel.style.display = "none";
  renderQuestion();
  updateProgress();

  if (saveToggle.checked) saveState();
  return true;
}

/* =========================
   Progress update
========================= */
function updateProgress() {
  const total = questions.length;
  const pct = total ? Math.round((currentIndex / total) * 100) : 0;
  progressBar.style.width = pct + "%";
  pctText.textContent = pct + "%";
  progressText.textContent = `Savol: ${currentIndex + 1}/${total}`;
  lessonMeta.textContent = questions[currentIndex]
    ? `Bo'lim: ${questions[currentIndex].source.lessonId} — ${questions[currentIndex].source.lessonTitle}`
    : "Hech qanday test boshlanmagan";
}

/* =========================
   Render flashcard
========================= */
function renderFlashcard(q) {
  quizArea.innerHTML = `
    <div class="flashcard" id="flashWrap" tabindex="0">
      <div class="card-inner">
        <div class="card-face front" style="font-size:1.5rem;font-weight:bold;text-align:center">
          ${escapeHtml(q.source.hiragana)}
          ${
            showRomaji()
              ? `<div style="font-size:1rem;color:#25663f;margin-top:5px">${escapeHtml(
                  q.source.romaji
                )}</div>`
              : ""
          }
        </div>
        <div class="card-face back" style="font-size:1.25rem;font-weight:bold;text-align:center">
          ${escapeHtml(q.answer)}
          <div style="margin-top:5px;color:#2b6a4a">${escapeHtml(
            q.source.lessonTitle
          )} — Bo'lim ${q.source.lessonId}</div>
          ${
            showRomaji()
              ? `<div style="margin-top:5px;color:#25663f">${escapeHtml(
                  q.source.romaji
                )}</div>`
              : ""
          }
        </div>
      </div>
    </div>
    <div style="margin-top:10px;text-align:center">
      <button id="flipCard" class="btn primary">🔁 Flip</button>
      <button id="prevCard" class="btn ghost">◀ Oldingi</button>
      <button id="nextCard" class="btn ghost">Keyingi ▶</button>
    </div>
  `;

  const flashWrap = document.getElementById("flashWrap");
  const inner = flashWrap.querySelector(".card-inner");

  document.getElementById("flipCard").onclick = () =>
    inner.classList.toggle("flipped");
  document.getElementById("nextCard").onclick = () => {
    currentIndex = Math.min(currentIndex + 1, questions.length - 1);
    renderQuestion();
  };
  document.getElementById("prevCard").onclick = () => {
    currentIndex = Math.max(currentIndex - 1, 0);
    renderQuestion();
  };
}

/* =========================
   Render multiple choice
========================= */
function renderMultiple(q) {
  const optionsHtml = q.options
    .map(
      (o, i) =>
        `<button class="option-btn btn ghost" data-val="${o}">${String.fromCharCode(
          65 + i
        )}. ${o}</button>`
    )
    .join("");
  quizArea.innerHTML = `
    <div class="question-card" style="text-align:center;padding:20px;border:1px solid #ccc;border-radius:10px">
      <div style="font-size:1.5rem;font-weight:bold">${escapeHtml(
        q.source.hiragana
      )}</div>
      ${
        showRomaji()
          ? `<div style="margin-top:5px;color:#25663f">${escapeHtml(
              q.source.romaji
            )}</div>`
          : ""
      }
      <div style="margin-top:15px">${optionsHtml}</div>
    </div>
  `;
  quizArea.querySelectorAll(".option-btn").forEach((b) => {
    b.onclick = () => checkAnswer(b.dataset.val);
  });
}

/* =========================
   Render write mode
========================= */
function renderWrite(q) {
  quizArea.innerHTML = `
    <div class="question-card" style="text-align:center;padding:20px;border:1px solid #ccc;border-radius:10px">
      <div style="font-size:1.5rem;font-weight:bold">${escapeHtml(
        q.source.hiragana
      )}</div>
      ${
        showRomaji()
          ? `<div style="margin-top:5px;color:#25663f">${escapeHtml(
              q.source.romaji
            )}</div>`
          : ""
      }
      <input type="text" id="writeInput" placeholder="Javobni yozing" style="margin-top:15px;padding:5px;width:200px" />
      <button id="writeSubmit" class="btn primary" style="margin-left:5px">✅ Tekshirish</button>
    </div>
  `;
  document.getElementById("writeSubmit").onclick = () => {
    const val = document.getElementById("writeInput").value;
    checkAnswer(val);
  };
}

/* =========================
   Javobni tekshirish
========================= */
function checkAnswer(ans) {
  if (!ans) return;
  const q = questions[currentIndex];
  const correct = normalize(q.answer);
  if (normalize(ans) === correct) score++;
  else userAnswers.push({ q, given: ans });

  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else finishTest();
  if (saveToggle.checked) saveState();
}

/* =========================
   Render savol
========================= */
function renderQuestion() {
  updateProgress();
  if (questions.length === 0) return;
  const q = questions[currentIndex];
  if (mode === "flashcard") renderFlashcard(q);
  else if (mode === "multiple") renderMultiple(q);
  else renderWrite(q);
}

/* =========================
   Test tugashi
========================= */
function finishTest() {
  if (timerInterval) clearInterval(timerInterval);
  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  resultTitle.textContent = `Siz ${score}/${total} to‘g‘ri topdingiz (${pct}%)`;
  medalEl.textContent =
    pct >= 90 ? "🥇" : pct >= 75 ? "🥈" : pct >= 50 ? "🥉" : "❌";
  resultAdvice.textContent =
    "Natijangizni yaxshilash uchun mashq qilishingiz mumkin.";
  mistakesList.innerHTML = userAnswers.length
    ? userAnswers
        .map(
          (u) =>
            `<div>${escapeHtml(u.q.source.hiragana)} → Javob: ${escapeHtml(
              u.given
            )}, To‘g‘ri: ${escapeHtml(u.q.answer)}</div>`
        )
        .join("")
    : "";
  resultPanel.style.display = "block";
  quizArea.innerHTML = "";
  progressBar.style.width = "100%";
}

/* =========================
   Keyboard shortcuts
========================= */
document.addEventListener("keydown", (e) => {
  if (questions.length === 0) return;
  if (mode === "multiple") {
    const idx = e.key.toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < 4) checkAnswer(questions[currentIndex].options[idx]);
  } else if (mode === "write") {
    if (e.key === "Enter") document.getElementById("writeSubmit")?.click();
  } else if (mode === "flashcard") {
    if (e.key === " " || e.key === "Spacebar")
      document.getElementById("flipCard")?.click();
  }
});

/* =========================
   LocalStorage saqlash
========================= */
function saveState() {
  const state = { questions, currentIndex, score, userAnswers, startedAt };
  localStorage.setItem("quizState", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("quizState");
  if (saved) {
    const state = JSON.parse(saved);
    questions = state.questions || [];
    currentIndex = state.currentIndex || 0;
    score = state.score || 0;
    userAnswers = state.userAnswers || [];
    startedAt = state.startedAt || Date.now();
    renderQuestion();
    updateProgress();
  }
}

/* =========================
   DOM tayyor bo‘lganda eventlar
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initLessonSelect();
  startBtn.onclick = prepareQuestions;
  startBtnInline.onclick = prepareQuestions;
  resetBtn.onclick = () => {
    currentIndex = score = 0;
    userAnswers = questions = [];
    quizArea.innerHTML = "";
    progressBar.style.width = "0%";
    progressText.textContent = "";
    lessonMeta.textContent = "";
    resultPanel.style.display = "none";
    if (timerInterval) clearInterval(timerInterval);
  };
  retryBtn.onclick = prepareQuestions;
  goSettingsBtn.onclick = resetBtn;

  if (saveToggle.checked) loadState();
});

document.getElementById("flipCard").onclick = () => {
  const flashWrap = document.getElementById("flashWrap");
  flashWrap.classList.toggle("flipped");
};
