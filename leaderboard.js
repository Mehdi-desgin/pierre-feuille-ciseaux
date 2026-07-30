import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxWF8Ag8VDqu574AGzxQrME6Pmm3puEFY",
  authDomain: "pierre-feuille-ciseaux-68650.firebaseapp.com",
  projectId: "pierre-feuille-ciseaux-68650",
  storageBucket: "pierre-feuille-ciseaux-68650.firebasestorage.app",
  messagingSenderId: "944445613907",
  appId: "1:944445613907:web:098e2ea845ae0a8c3163a6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const leaderboardEl = document.getElementById("leaderboard");
const MIN_GAMES_FOR_RANKING = 3;

function normalizeName(playerName) {
  return playerName.trim().toLowerCase().replace(/\s+/g, " ");
}

async function updateLeaderboard(playerName, gameWon) {
  if (!playerName) return;

  const key = normalizeName(playerName);
  if (!key) return;

  const playerRef = doc(db, "players", key);
  const snapshot = await getDoc(playerRef);
  const current = snapshot.exists() ? snapshot.data() : { gamesPlayed: 0, gamesWon: 0 };

  await setDoc(playerRef, {
    name: playerName.trim().replace(/\s+/g, " "),
    gamesPlayed: current.gamesPlayed + 1,
    gamesWon: current.gamesWon + (gameWon ? 1 : 0),
  });

  renderLeaderboard();
  renderPlayerRank(playerName);
}

async function getRankedPlayers() {
  const playersQuery = query(collection(db, "players"), orderBy("gamesPlayed", "desc"), limit(100));
  const snapshot = await getDocs(playersQuery);

  return snapshot.docs
    .map((docSnap) => docSnap.data())
    .filter((data) => data.gamesPlayed >= MIN_GAMES_FOR_RANKING)
    .map((data) => ({ ...data, winRate: data.gamesWon / data.gamesPlayed }))
    .sort((a, b) => b.winRate - a.winRate);
}

async function renderLeaderboard() {
  if (!leaderboardEl) return;
  leaderboardEl.innerHTML = "<h3>Classement</h3><p>Chargement...</p>";

  try {
    const players = await getRankedPlayers();

    if (players.length === 0) {
      leaderboardEl.innerHTML = `<h3>Classement</h3><p>Aucun joueur avec au moins ${MIN_GAMES_FOR_RANKING} parties jouées pour l'instant.</p>`;
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];

    let html = "<h3>Classement (taux de victoire)</h3><ol>";
    players.slice(0, 10).forEach((data, rank) => {
      const medal = medals[rank] || "";
      const topClass = rank < 3 ? " class=\"topRank\"" : "";
      const percent = Math.round(data.winRate * 100);
      html += `<li${topClass}>${medal} ${data.name} — ${percent}% (${data.gamesWon}/${data.gamesPlayed} parties)</li>`;
    });
    html += "</ol>";
    leaderboardEl.innerHTML = html;
  } catch (err) {
    leaderboardEl.innerHTML = "<h3>Classement</h3><p>Impossible de charger le classement.</p>";
    console.error(err);
  }
}

async function renderPlayerRank(playerName) {
  const playerRankEl = document.getElementById("playerRank");
  if (!playerRankEl) return;

  const key = normalizeName(playerName || "");
  if (!key) {
    playerRankEl.textContent = "";
    return;
  }

  playerRankEl.textContent = "Recherche de votre classement...";

  try {
    const players = await getRankedPlayers();
    const index = players.findIndex((p) => normalizeName(p.name) === key);

    if (index === -1) {
      const playerRef = doc(db, "players", key);
      const snapshot = await getDoc(playerRef);
      const gamesPlayed = snapshot.exists() ? snapshot.data().gamesPlayed : 0;
      const remaining = MIN_GAMES_FOR_RANKING - gamesPlayed;
      playerRankEl.textContent =
        remaining > 0
          ? `Encore ${remaining} partie(s) à jouer pour apparaître au classement.`
          : "Pas encore classé.";
      return;
    }

    const player = players[index];
    const percent = Math.round(player.winRate * 100);
    playerRankEl.textContent = `Vous êtes classé #${index + 1} (${percent}% de victoires).`;
  } catch (err) {
    playerRankEl.textContent = "";
    console.error(err);
  }
}

window.updateLeaderboard = updateLeaderboard;
window.renderPlayerRank = renderPlayerRank;

renderLeaderboard();
