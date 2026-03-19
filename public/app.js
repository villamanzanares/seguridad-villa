// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.firebasestorage.app",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
const db = firebase.firestore();

let usuario = null;

// 🧠 VERIFICAR USUARIO
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

// 💾 GUARDAR USUARIO
function guardarUsuario() {
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

// 🚀 INICIO
async function iniciarApp() {
  await registrarServiceWorker();
  await solicitarPermisoYToken();
  escucharAlertas();
}

// 🔧 SERVICE WORKER
async function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log("Service Worker registrado ✅");
  }
}

// 🔔 NOTIFICACIONES
async function solicitarPermisoYToken() {
  const permiso = await Notification.requestPermission();
  console.log("Permiso:", permiso);

  if (permiso !== "granted") return;

  const registration = await navigator.serviceWorker.ready;

  const token = await messaging.getToken({
    vapidKey: "BJdodl41DkUmiqBVuJ8AjALteBLa_YGsti0uynu6zKz0WGS13V3Rk5SB0rPyfEtmSpsJ_QUlZdzSH9shcVttofw",
    serviceWorkerRegistration: registration
  });

  console.log("TOKEN:", token);

  await fetch("/registro-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token,
      villa: usuario.villa
    })
  });
}

// 🚨 ENVIAR ALERTA
function enviarAlerta(tipo) {
  actualizarFooter(tipo);

  fetch("/alerta", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tipo,
      usuario,
      villa: usuario.villa
    })
  });
}

// 📡 HISTORIAL (SOLO 3 ALERTAS)
function escucharAlertas() {
  db.collection("alertas")
    .where("villa", "==", usuario.villa)
    .orderBy("timestamp", "desc")
    .limit(3)
    .onSnapshot(snapshot => {

      const contenedor = document.getElementById("historial");
      contenedor.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();

        const div = document.createElement("div");
        div.className = "alerta-item";

        const fecha = data.timestamp
          ? new Date(data.timestamp.seconds * 1000).toLocaleString()
          : "Ahora";

        div.innerHTML = `
          <strong>${data.tipo}</strong><br>
          ${data.usuario.nombre} - Casa ${data.usuario.casa}<br>
          <small>${fecha}</small>
        `;

        contenedor.appendChild(div);
      });
    });
}

// 🎯 FOOTER GRANDE
function actualizarFooter(tipo) {
  const footer = document.getElementById("footer");

  footer.innerHTML = `
    <div class="footer-alerta">
      <div class="titulo">🚨 ALERTA ${tipo}</div>

      <div class="info">
        Enviado por: ${usuario.nombre}
      </div>

      <div class="info">
        Casa-Depto: ${usuario.casa} | Fono: ${usuario.telefono}
      </div>

      <div class="villa">
        ${usuario.villa}
      </div>
    </div>
  `;
}

// INIT
verificarUsuario();
