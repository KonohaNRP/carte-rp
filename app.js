import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

const CONFIRMATION_DELAY = 5 * 60 * 1000; // 5 min

let flagsData = [];

/* 🟢 Ajouter un drapeau */
map.addEventListener("click", async (e) => {
  const rect = map.getBoundingClientRect();

  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  await addDoc(flagsCollection, {
    x,
    y,
    owner: "neutral",
    lastUpdate: Date.now()
  });
});

/* 🔄 Écoute Firestore */
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

/* 🔄 rendu + timer live */
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

    /* 🟡 clic gauche → changer camp */
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

    /* 🔴 clic droit → supprimer */
    flag.addEventListener("contextmenu", async (event) => {
      event.preventDefault();

      const confirmDelete = confirm("Supprimer ce drapeau ?");
      if (!confirmDelete) return;

      await deleteDoc(doc(db, "flags", data.id));
    });

    /* ⏱️ compteur */
    const timer = document.createElement("div");
    timer.className = "timer";

    const seconds = Math.floor(timeSince / 1000);
    timer.innerText = seconds + "s";

    /* 🔄 reset compteur */
    timer.addEventListener("click", async (event) => {
      event.stopPropagation();

      await updateDoc(doc(db, "flags", data.id), {
        lastUpdate: Date.now()
      });
    });

    flag.appendChild(timer);
    map.appendChild(flag);
  });
}

/* 🔥 timer live (update toutes les secondes) */
setInterval(() => {
  renderFlags();
}, 1000);