// ===============================
// CONFIG FIREBASE
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.firebasestorage.app",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===============================
// VARIABLES GLOBALES
// ===============================
let usuario = JSON.parse(localStorage.getItem("usuario"));

// ===============================
// REGISTRO USUARIO
// ===============================
window.registrarUsuario = function () {
  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;
  const casa = document.getElementById("casa").value;
  const villa = document.getElementById("villa").value;

  if (!nombre || !telefono || !casa || !villa) {
    alert("Completa todos los campos");
    return;
  }

  const nuevoUsuario = {
    nombre,
    telefono,
    casa,
    villa,
    rol: "vecino"
  };

  localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
  location.reload();
};

// ===============================
// MOSTRAR APP
// ===============================
function iniciarApp() {
  document.getElementById("registro").style.display = "none";
  document.getElementById("app").style.display = "block";

  escucharAlertas();
}

// ===============================
// ENVIAR ALERTA
// ===============================
window.enviarAlerta = async function (tipo) {
  if (!usuario) return;

  await addDoc(collection(db, "alertas"), {
    tipo,
    nombre: usuario.nombre,
    telefono: usuario.telefono,
    casa: usuario.casa,
    villa: usuario.villa,
    timestamp: serverTimestamp()
  });
};

// ===============================
// ESCUCHAR ALERTAS (SOLO FOOTER)
// ===============================
function escucharAlertas() {
  const q = query(
    collection(db, "alertas"),
    where("villa", "==", usuario.villa),
    orderBy("timestamp", "desc"),
    limit(1)
  );

  onSnapshot(q, (snapshot) => {
    snapshot.forEach((doc) => {
      const data = doc.data();
      actualizarFooter(data);
    });
  });
}

// ===============================
// FOOTER
// ===============================
function actualizarFooter(data) {
  const footer = document.getElementById("footer-alerta");

  footer.innerHTML = `
    <div class="alerta-tipo">${data.tipo}</div>
    <div class="alerta-info">
      Enviado por: ${data.nombre}<br>
      Casa: ${data.casa} | Fono: ${data.telefono}<br>
      ${data.villa}
    </div>
  `;
}

// ===============================
// INIT
// ===============================
if (!usuario) {
  document.getElementById("registro").style.display = "block";
} else {
  iniciarApp();
}
