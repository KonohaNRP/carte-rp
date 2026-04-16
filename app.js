import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

/* 🔥 REMPLACE ICI PAR TA CONFIG FIREBASE */
const firebaseConfig = {
apiKey: "AIzaSyAC6uQD2KfxIqINAwIDsTV4uEacR8iFCXg",
authDomain: "ag---reconnaissance-drapeau.firebaseapp.com",
projectId: "ag---reconnaissance-drapeau",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const map = document.getElementById("map");
const flagsCollection = collection(db, "flags");

const CONFIRMATION_DELAY = 5 * 60 * 1000;

let flagsData = [];

/* 🟢 Ajouter un drapeau avec nom */
map.addEventListener("click", async (e) => {
  const name = prompt("Nom du point ?");
  if (!name) return;

  const rect = map.getBoundingClientRect();

  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  await addDoc(flagsCollection, {
    x,
    y,
    name,
    owner: "neutral",
    lastUpdate: Date.now()
  });
});

/* 🔄 Firestore */
onSnapshot(flagsCollection, (snapshot) => {
  flagsData = [];

  snapshot.forEach(docSnap => {
    flagsData.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  renderFlags();
});

/* ⏱️ format temps */
function formatTime(seconds) {
  if (seconds < 60) return seconds + "s";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours + "h " + remainingMinutes + "m";
}

/* 🎨 render */
function renderFlags() {
  document.querySelectorAll(".flag").forEach(el => el.remove());

  const rect = map.getBoundingClientRect();
  const now = Date.now();

  flagsData.forEach(data => {

    let displayOwner = data.owner;

    const timeSince = now - data.lastUpdate;

    if (timeSince > CONFIRMATION_DELAY) {
      displayOwner = "a_confirmer";
    }

    const flag = document.createElement("div");
    flag.className = "flag " + displayOwner;

    flag.style.left = (data.x * rect.width) + "px";
    flag.style.top = (data.y * rect.height) + "px";

    /* 🟡 clic gauche = changer camp */
    flag.addEventListener("click", async (event) => {
      event.stopPropagation();

      let newOwner;

      if (data.owner === "neutral") newOwner = "konoha";
      else if (data.owner === "konoha") newOwner = "suna";
      else newOwner = "neutral";

      await updateDoc(doc(db, "flags", data.id), {
        owner: newOwner,
        lastUpdate: Date.now()
      });
    });

    /* 🔴 clic droit = supprimer */
    flag.addEventListener("contextmenu", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const confirmDelete = confirm("Supprimer ce point ?");
      if (!confirmDelete) return;

      await deleteDoc(doc(db, "flags", data.id));
    });

    /* 🏷️ nom */
    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.top = "-32px";
    label.style.fontSize = "12px";
    label.style.whiteSpace = "nowrap";
    label.innerText = data.name || "";

    /* ⏱️ timer */
    const timer = document.createElement("div");
    timer.className = "timer";

    const seconds = Math.floor(timeSince / 1000);
    timer.innerText = formatTime(seconds);

    /* reset timer */
    timer.addEventListener("click", async (event) => {
      event.stopPropagation();

      await updateDoc(doc(db, "flags", data.id), {
        lastUpdate: Date.now()
      });
    });

    flag.appendChild(label);
    flag.appendChild(timer);
    map.appendChild(flag);
  });
}

/* 🔄 refresh live */
setInterval(() => {
  renderFlags();
}, 1000);