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

const emojis = { pierre: "🪨", feuille: "📄", ciseaux: "✂️" };
const beats = { pierre: "ciseaux", feuille: "pierre", ciseaux: "feuille" };
const MAX_ROUNDS = 5;

let wins = 0;
let losses = 0;
let ties = 0;
let roundsPlayed = 0;
let isAnimating = false;

function playRound(playerChoice) {
  if (roundsPlayed >= MAX_ROUNDS || isAnimating) return;

  isAnimating = true;
  choiceBtns.forEach((btn) => (btn.disabled = true));
  result.textContent = "";

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
    outcome = "Égalité";
  } else if (beats[playerChoice] === computerChoice) {
    wins++;
    outcome = "Gagné";
  } else {
    losses++;
    outcome = "Perdu";
  }
  result.textContent =
    outcome === "Égalité" ? "Égalité !" : outcome === "Gagné" ? "Vous avez gagné !" : "Vous avez perdu !";

  addToHistory(playerChoice, computerChoice, outcome);

  roundsPlayed++;
  updateScore();
  isAnimating = false;

  if (roundsPlayed >= MAX_ROUNDS) {
    endGame();
  } else {
    roundCounter.textContent = `Manche ${roundsPlayed + 1}/${MAX_ROUNDS}`;
    choiceBtns.forEach((btn) => (btn.disabled = false));
  }
}

function endGame() {
  choiceBtns.forEach((btn) => (btn.disabled = true));
  roundCounter.textContent = "Partie terminée";

  if (wins > losses) {
    finalResult.textContent = "🏆 Vous avez gagné la partie !";
  } else if (losses > wins) {
    finalResult.textContent = "💀 Vous avez perdu la partie.";
  } else {
    finalResult.textContent = "🤝 Match nul !";
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

resetBtn.addEventListener("click", () => {
  wins = 0;
  losses = 0;
  ties = 0;
  roundsPlayed = 0;
  isAnimating = false;
  result.textContent = "";
  roundDetail.textContent = "";
  finalResult.textContent = "";
  roundCounter.textContent = `Manche 1/${MAX_ROUNDS}`;
  choiceBtns.forEach((btn) => (btn.disabled = false));
  history.innerHTML = "";
  updateScore();
});
