import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getMessaging,
  getToken
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

/* =========================
   INIT
========================= */

window.onload = () => {
  setTimeout(() => {
    verificarUsuario();
  }, 300);
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
   INICIAR APP (NO BLOQUEANTE)
========================= */

function iniciarApp() {

  registrarServiceWorker().catch(e =>
    console.error("SW error:", e)
  );

  solicitarPermisoYToken().catch(e =>
    console.error("Token error:", e)
  );

  escucharAlertas();

  document.getElementById("footer").innerText = "Sistema listo ✅";

  console.log("App iniciada 🚀");
}

/* =========================
   SERVICE WORKER
========================= */

async function registrarServiceWorker() {
  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

  await navigator.serviceWorker.ready;

  console.log("SW listo");
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
   ENVIAR ALERTA
========================= */

async function enviarAlerta(tipo) {

  actualizarFooter(tipo);

  try {
    await fetch("/alerta", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tipo,
        usuario: usuario.nombre,
        telefono: usuario.telefono,
        casa: usuario.casa,
        villa: usuario.villa
      })
    });
  } catch (e) {
    console.error("Error alerta:", e);
  }
}

/* =========================
   FOOTER PRO
========================= */

function actualizarFooter(tipo) {
  const footer = document.getElementById("footer");

  footer.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:22px; font-weight:bold;">
        ALERTA ${tipo}
      </div>

      <div style="margin-top:10px;">
        Enviado por: ${usuario.nombre}
      </div>

      <div>
        Casa: ${usuario.casa} | Fono: ${usuario.telefono}
      </div>

      <div style="margin-top:6px; font-weight:bold;">
        ${usuario.villa}
      </div>
    </div>
  `;
}

/* =========================
   HISTORIAL (SOLO 3)
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
   EXPONER FUNCIONES
========================= */

window.registrarUsuario = registrarUsuario;
window.enviarAlerta = enviarAlerta;
