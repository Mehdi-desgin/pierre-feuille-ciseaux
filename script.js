const choiceBtns = document.querySelectorAll(".choiceBtn");
const result = document.getElementById("result");
const roundDetail = document.getElementById("roundDetail");
const winsCount = document.getElementById("winsCount");
const lossesCount = document.getElementById("lossesCount");
const tiesCount = document.getElementById("tiesCount");
const resetBtn = document.getElementById("resetBtn");
const roundCounter = document.getElementById("roundCounter");
const finalResult = document.getElementById("finalResult");
const history = document.getElementById("history");
const globalStats = document.getElementById("globalStats");
const lengthSelect = document.getElementById("lengthSelect");
const resetStatsBtn = document.getElementById("resetStatsBtn");
const themeToggle = document.getElementById("themeToggle");
const playerNameInput = document.getElementById("playerNameInput");

playerNameInput.value = localStorage.getItem("pfcPlayerName") || "";
playerNameInput.addEventListener("input", () => {
  localStorage.setItem("pfcPlayerName", playerNameInput.value.trim());
});

const emojis = { pierre: "🪨", feuille: "📄", ciseaux: "✂️" };
const beats = { pierre: "ciseaux", feuille: "pierre", ciseaux: "feuille" };

let maxRounds = Number(lengthSelect.value);
let wins = 0;
let losses = 0;
let ties = 0;
let roundsPlayed = 0;
let isAnimating = false;

const stats = JSON.parse(localStorage.getItem("pfcStats")) || {
  totalWins: 0,
  totalLosses: 0,
  totalTies: 0,
  gamesPlayed: 0,
  gamesWon: 0,
};

function saveStats() {
  localStorage.setItem("pfcStats", JSON.stringify(stats));
}

function renderGlobalStats() {
  globalStats.innerHTML = `
    <h3>Statistiques globales</h3>
    <div>Manches : ${stats.totalWins} victoires / ${stats.totalLosses} défaites / ${stats.totalTies} égalités</div>
    <div>Parties : ${stats.gamesWon} gagnée(s) sur ${stats.gamesPlayed} jouée(s)</div>
  `;
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency, startTime, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function playSound(outcome) {
  const now = audioCtx.currentTime;
  if (outcome === "Gagné") {
    playTone(440, now, 0.15);
    playTone(660, now + 0.15, 0.2);
  } else if (outcome === "Perdu") {
    playTone(300, now, 0.15);
    playTone(150, now + 0.15, 0.25);
  } else {
    playTone(400, now, 0.2);
  }
}

function playRound(playerChoice) {
  if (roundsPlayed >= maxRounds || isAnimating) return;

  isAnimating = true;
  choiceBtns.forEach((btn) => (btn.disabled = true));
  lengthSelect.disabled = true;
  result.textContent = "";

  if (audioCtx.state === "suspended") audioCtx.resume();

  const choices = ["pierre", "feuille", "ciseaux"];
  const computerChoice = choices[Math.floor(Math.random() * choices.length)];

  let ticks = 0;
  const suspense = setInterval(() => {
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    roundDetail.textContent = `Vous : ${emojis[playerChoice]}  —  Ordinateur : ${emojis[randomChoice]}`;
    ticks++;
    if (ticks >= 8) {
      clearInterval(suspense);
      finishRound(playerChoice, computerChoice);
    }
  }, 100);
}

function finishRound(playerChoice, computerChoice) {
  roundDetail.textContent = `Vous : ${emojis[playerChoice]}  —  Ordinateur : ${emojis[computerChoice]}`;

  let outcome;
  if (playerChoice === computerChoice) {
    ties++;
    stats.totalTies++;
    outcome = "Égalité";
  } else if (beats[playerChoice] === computerChoice) {
    wins++;
    stats.totalWins++;
    outcome = "Gagné";
  } else {
    losses++;
    stats.totalLosses++;
    outcome = "Perdu";
  }
  saveStats();
  renderGlobalStats();
  result.textContent =
    outcome === "Égalité" ? "Égalité !" : outcome === "Gagné" ? "Vous avez gagné !" : "Vous avez perdu !";

  playSound(outcome);
  addToHistory(playerChoice, computerChoice, outcome);

  roundsPlayed++;
  updateScore();
  isAnimating = false;

  if (roundsPlayed >= maxRounds) {
    endGame();
  } else {
    roundCounter.textContent = `Manche ${roundsPlayed + 1}/${maxRounds}`;
    choiceBtns.forEach((btn) => (btn.disabled = false));
  }
}

function launchConfetti() {
  const colors = ["#e63946", "#f4a340", "#4caf87", "#3a86ff", "#ffbe0b"];

  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
    piece.style.opacity = String(0.7 + Math.random() * 0.3);
    document.body.appendChild(piece);

    piece.addEventListener("animationend", () => piece.remove());
  }
}

function endGame() {
  choiceBtns.forEach((btn) => (btn.disabled = true));
  roundCounter.textContent = "Partie terminée";

  stats.gamesPlayed++;
  const gameWon = wins > losses;
  if (gameWon) {
    finalResult.textContent = "🏆 Vous avez gagné la partie !";
    stats.gamesWon++;
    launchConfetti();
  } else if (losses > wins) {
    finalResult.textContent = "💀 Vous avez perdu la partie.";
  } else {
    finalResult.textContent = "🤝 Match nul !";
  }
  saveStats();
  renderGlobalStats();

  const playerName = playerNameInput.value.trim();
  if (playerName && window.updateLeaderboard) {
    window.updateLeaderboard(playerName, gameWon);
  }
}

function addToHistory(playerChoice, computerChoice, outcome) {
  const li = document.createElement("li");
  li.textContent = `Manche ${roundsPlayed + 1} : ${emojis[playerChoice]} vs ${emojis[computerChoice]} — ${outcome}`;
  history.appendChild(li);
}

function updateScore() {
  winsCount.textContent = `Victoires : ${wins}`;
  lossesCount.textContent = `Défaites : ${losses}`;
  tiesCount.textContent = `Égalités : ${ties}`;
}

choiceBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    playRound(btn.dataset.choice);
  });
});

resetStatsBtn.addEventListener("click", () => {
  if (!confirm("Réinitialiser les statistiques globales (toutes parties confondues) ?")) return;
  stats.totalWins = 0;
  stats.totalLosses = 0;
  stats.totalTies = 0;
  stats.gamesPlayed = 0;
  stats.gamesWon = 0;
  saveStats();
  renderGlobalStats();
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === "dark" ? "☀️ Mode clair" : "🌙 Mode sombre";
}

applyTheme(localStorage.getItem("pfcTheme") || "light");

themeToggle.addEventListener("click", () => {
  const newTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("pfcTheme", newTheme);
  applyTheme(newTheme);
});

lengthSelect.addEventListener("change", () => {
  maxRounds = Number(lengthSelect.value);
  roundCounter.textContent = `Manche 1/${maxRounds}`;
});

renderGlobalStats();

resetBtn.addEventListener("click", () => {
  wins = 0;
  losses = 0;
  ties = 0;
  roundsPlayed = 0;
  isAnimating = false;
  maxRounds = Number(lengthSelect.value);
  result.textContent = "";
  roundDetail.textContent = "";
  finalResult.textContent = "";
  roundCounter.textContent = `Manche 1/${maxRounds}`;
  choiceBtns.forEach((btn) => (btn.disabled = false));
  lengthSelect.disabled = false;
  history.innerHTML = "";
  updateScore();
});
