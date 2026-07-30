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
}

async function renderLeaderboard() {
  if (!leaderboardEl) return;
  leaderboardEl.innerHTML = "<h3>Classement</h3><p>Chargement...</p>";

  try {
    const playersQuery = query(collection(db, "players"), orderBy("gamesWon", "desc"), limit(10));
    const snapshot = await getDocs(playersQuery);

    if (snapshot.empty) {
      leaderboardEl.innerHTML = "<h3>Classement</h3><p>Aucun joueur pour l'instant.</p>";
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];

    let html = "<h3>Classement (parties gagnées)</h3><ol>";
    let rank = 0;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const medal = medals[rank] || "";
      const topClass = rank < 3 ? " class=\"topRank\"" : "";
      html += `<li${topClass}>${medal} ${data.name} — ${data.gamesWon}/${data.gamesPlayed} partie(s) gagnée(s)</li>`;
      rank++;
    });
    html += "</ol>";
    leaderboardEl.innerHTML = html;
  } catch (err) {
    leaderboardEl.innerHTML = "<h3>Classement</h3><p>Impossible de charger le classement.</p>";
    console.error(err);
  }
}

window.updateLeaderboard = updateLeaderboard;

renderLeaderboard();
