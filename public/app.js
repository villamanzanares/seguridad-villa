import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.firebasestorage.app",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const db = getFirestore(app);

let usuario = null;

/* INICIO */
window.onload = () => {
  verificarUsuario();
};

/* =========================
   USUARIO
========================= */

function verificarUsuario() {
  const data = localStorage.getItem("usuario");

  if (!data) {
    document.getElementById("registro").style.display = "block";
    document.getElementById("app").style.display = "none";
  } else {
    usuario = JSON.parse(data);
    document.getElementById("registro").style.display = "none";
    document.getElementById("app").style.display = "block";
    iniciarApp();
  }
}

function registrarUsuario() {
  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;
  const casa = document.getElementById("casa").value;
  const villa = document.getElementById("villa").value;

  if (!nombre || !telefono || !casa || !villa) {
    alert("Completa todos los campos");
    return;
  }

  usuario = { nombre, telefono, casa, villa };
  localStorage.setItem("usuario", JSON.stringify(usuario));

  verificarUsuario();
}

/* =========================
   INIT APP
========================= */

async function iniciarApp() {
  try {
    await registrarServiceWorker();
  } catch (e) {
    console.error("SW error:", e);
  }

  try {
    await solicitarPermisoYToken();
  } catch (e) {
    console.error("Token error:", e);
  }

  escucharAlertas();

  document.getElementById("footer").innerText = "Sistema listo ✅";
}

/* =========================
   SERVICE WORKER
========================= */

async function registrarServiceWorker() {
  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );
  console.log("SW registrado", registration);
}

/* =========================
   NOTIFICACIONES
========================= */

async function solicitarPermisoYToken() {
  const permission = await Notification.requestPermission();
  console.log("Permiso:", permission);

  if (permission !== "granted") return;

  const token = await getToken(messaging, {
    vapidKey:
      "BJdodl41DkUmiqBVuJ8AjALteBLa_YGsti0uynu6zKz0WGS13V3Rk5SB0rPyfEtmSpsJ_QUlZdzSH9shcVttofw"
  });

  console.log("TOKEN:", token);

  await fetch("/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
}

/* =========================
   ALERTAS
========================= */

async function enviarAlerta(tipo) {
  actualizarFooter(tipo);

  await fetch("/alerta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo,
      usuario: usuario.nombre,
      telefono: usuario.telefono,
      casa: usuario.casa,
      villa: usuario.villa
    })
  });
}

function actualizarFooter(tipo) {
  const footer = document.getElementById("footer");

  footer.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:20px; font-weight:bold;">
        ALERTA ${tipo}
      </div>

      <div style="margin-top:8px;">
        Enviado por: ${usuario.nombre}
      </div>

      <div>
        Casa-Depto: ${usuario.casa} | Fono: ${usuario.telefono}
      </div>

      <div style="margin-top:5px; font-weight:bold;">
        ${usuario.villa}
      </div>
    </div>
  `;
}

/* =========================
   HISTORIAL (MAX 3)
========================= */

function escucharAlertas() {
  console.log("Escuchando alertas...");

  const q = query(
    collection(db, "alertas"),
    orderBy("timestamp", "desc"),
    limit(3)
  );

  onSnapshot(q, (snapshot) => {
    const contenedor = document.getElementById("historial");
    contenedor.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();

      const div = document.createElement("div");
      div.className = "alerta";

      div.innerHTML = `
        <strong>${data.tipo}</strong><br>
        ${data.usuario}<br>
        ${data.villa}
      `;

      contenedor.appendChild(div);
    });
  });
}

/* =========================
   EXPONER FUNCIONES (CLAVE)
========================= */

window.registrarUsuario = registrarUsuario;
window.enviarAlerta = enviarAlerta;
