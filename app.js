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

let flagsData = [];

/* 🟢 Ajouter un point */
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
    lastUpdate: Date.now(),
    captureEnd: null
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

/* ⏱️ Format temps */
function formatTime(seconds) {
  if (seconds < 60) return seconds + "s";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours + "h " + remainingMinutes + "m";
}

/* 🎨 Render */
function renderFlags() {
  document.querySelectorAll(".flag").forEach(el => el.remove());

  const rect = map.getBoundingClientRect();
  const now = Date.now();

  flagsData.forEach(data => {

    const flag = document.createElement("div");
    flag.className = "flag " + data.owner;

    flag.style.left = (data.x * rect.width) + "px";
    flag.style.top = (data.y * rect.height) + "px";

    /* 🏷️ NOM */
    const label = document.createElement("div");
    label.className = "label";
    label.innerText = data.name || "";

    /* 🔴 STOP BLINK */
    label.addEventListener("click", async (event) => {
      event.stopPropagation();

      await updateDoc(doc(db, "flags", data.id), {
        captureEnd: null
      });
    });

    /* 🔥 CAPTURE */
    const capture = document.createElement("div");
    capture.className = "capture";

    if (data.captureEnd) {
      const remaining = Math.floor((data.captureEnd - now) / 1000);

      if (remaining <= 0) {
        capture.innerText = "CAPTURABLE";

        /* blink uniquement neutral ou suna */
        if (data.owner === "neutral" || data.owner === "suna") {
          flag.classList.add("blink");
        }

      } else {
        capture.innerText = "Capturable dans : " + formatTime(remaining);
      }
    } else {
      capture.innerText = "Capturable : OFF";
    }

    /* définir timer capture */
    capture.addEventListener("click", async (event) => {
      event.stopPropagation();

      const minutes = prompt("Dans combien de minutes ?");
      if (!minutes) return;

      const ms = parseInt(minutes) * 60 * 1000;

      await updateDoc(doc(db, "flags", data.id), {
        captureEnd: Date.now() + ms,
        lastUpdate: Date.now() // reset check
      });
    });

    /* ⏱️ TIMER */
    const timer = document.createElement("div");
    timer.className = "timer";

    const seconds = Math.floor((now - data.lastUpdate) / 1000);
    timer.innerText = "Dernier check : " + formatTime(seconds);

    timer.addEventListener("click", async (event) => {
      event.stopPropagation();

      await updateDoc(doc(db, "flags", data.id), {
        lastUpdate: Date.now()
      });
    });

    /* 🟡 changement de camp */
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

    /* 🔴 suppression */
    flag.addEventListener("contextmenu", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!confirm("Supprimer ce point ?")) return;

      await deleteDoc(doc(db, "flags", data.id));
    });

    flag.appendChild(label);
    flag.appendChild(capture);
    flag.appendChild(timer);

    map.appendChild(flag);
  });
}

/* 🔄 refresh live */
setInterval(() => {
  renderFlags();
}, 1000);