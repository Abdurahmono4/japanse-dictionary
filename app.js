// 📂 Baza – faqat 1-bo‘lim misol tariqasida
const lessons = [
  {
    id: 1,
    title: "Bo‘lim 1 — Salomlashish va asosiy so‘zlar",
    words: [
      { romaji: "watashi", hiragana: "わたし", translation: "men" },
      { romaji: "anata", hiragana: "あなた", translation: "siz (sen)" },
      { romaji: "sensei", hiragana: "せんせい", translation: "ustoz" },
      { romaji: "gakusei", hiragana: "がくせい", translation: "talaba" },
      { romaji: "daigaku", hiragana: "だいがく", translation: "universitet" },
      { romaji: "nihon", hiragana: "にほん", translation: "Yaponiya" },
      { romaji: "amerika", hiragana: "アメリカ", translation: "Amerika" },
    ],
  },
];

const lessonSelect = document.getElementById("lessonSelect");
const startBtn = document.getElementById("startBtn");
const quiz = document.getElementById("quiz");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const nextBtn = document.getElementById("nextBtn");
const resultEl = document.getElementById("result");
const questionCountEl = document.getElementById("questionCount");

let currentLesson = null;
let questions = [];
let currentIndex = 0;
let score = 0;

// 🔹 Selectni to‘ldirish
lessons.forEach((lesson) => {
  const opt = document.createElement("option");
  opt.value = lesson.id;
  opt.textContent = lesson.title;
  lessonSelect.appendChild(opt);
});

// 🔹 Boshlash
startBtn.addEventListener("click", () => {
  const lessonId = parseInt(lessonSelect.value);
  const count = parseInt(questionCountEl.value);
  currentLesson = lessons.find((l) => l.id === lessonId);

  // random so‘zlar
  questions = shuffle(currentLesson.words).slice(0, count);

  currentIndex = 0;
  score = 0;
  resultEl.classList.add("hidden");
  quiz.classList.remove("hidden");
  showQuestion();
});

// 🔹 Savolni ko‘rsatish
function showQuestion() {
  resetState();

  const word = questions[currentIndex];
  questionEl.textContent = `👉 ${word.hiragana} (${word.romaji})`;

  // variantlar
  let options = [word];
  while (options.length < 4 && options.length < currentLesson.words.length) {
    const random =
      currentLesson.words[
        Math.floor(Math.random() * currentLesson.words.length)
      ];
    if (!options.includes(random)) options.push(random);
  }
  options = shuffle(options);

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.textContent = opt.translation;
    btn.classList.add("option-btn");
    btn.addEventListener("click", () => selectAnswer(btn, opt, word));
    optionsEl.appendChild(btn);
  });
}

// 🔹 Javobni tanlash
function selectAnswer(btn, chosen, correct) {
  Array.from(optionsEl.children).forEach((b) => (b.disabled = true));

  if (chosen === correct) {
    btn.classList.add("correct");
    score++;
  } else {
    btn.classList.add("wrong");
  }
  nextBtn.classList.remove("hidden");
}

// 🔹 Keyingiga o‘tish
nextBtn.addEventListener("click", () => {
  currentIndex++;
  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
});

// 🔹 Natija
function showResult() {
  quiz.classList.add("hidden");
  resultEl.classList.remove("hidden");

  const percent = Math.round((score / questions.length) * 100);
  resultEl.textContent = `✅ Siz ${questions.length} ta savoldan ${score} tasini to‘g‘ri topdingiz. (${percent}%)`;
}

// 🔹 Yordamchi: random aralashtirish
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function resetState() {
  nextBtn.classList.add("hidden");
  optionsEl.innerHTML = "";
}
