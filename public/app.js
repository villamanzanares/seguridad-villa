// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
const db = firebase.firestore();

// 🔐 REGISTRO DE USUARIO
window.registrarUsuario = async function(){

  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;
  const casa = document.getElementById("casa").value;
  const villa = document.getElementById("villa").value;

  if(!nombre || !telefono || !casa || !villa){
    alert("Completa todos los datos");
    return;
  }

  const usuario = { nombre, telefono, casa, villa };

  localStorage.setItem("usuario", JSON.stringify(usuario));

  document.getElementById("footer").innerText = "Registrando dispositivo...";

  // 🔔 Permisos notificación
  const permission = await Notification.requestPermission();

  if(permission !== "granted"){
    document.getElementById("footer").innerText = "Permisos denegados ❌";
    return;
  }

  // 📡 Service Worker
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const token = await messaging.getToken({
    vapidKey: "BJdodl41DkUmiqBVuJ8AjALteBLa_YGsti0uynu6zKz0WGS13V3Rk5SB0rPyfEtmSpsJ_QUlZdzSH9shcVttofw",
    serviceWorkerRegistration: registration
  });

  // 📌 Suscribirse al topic
  await fetch("/subscribe",{
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    body: JSON.stringify({ token })
  });

  document.getElementById("registro").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.getElementById("footer").innerText = "Sistema listo ✅";

  iniciarHistorial();
}

// 🚨 ENVIAR ALERTA
window.enviarAlerta = async function(tipo){

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  document.getElementById("footer").innerText =
    "🚨 " + tipo + " enviada por " + usuario.nombre;

  await fetch("/alerta",{
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    body: JSON.stringify({ tipo, usuario })
  });

}

// 📩 MENSAJE EN PRIMER PLANO
messaging.onMessage((payload)=>{

  const data = payload.data;

  document.getElementById("footer").innerText =
    "🚨 " + data.tipo + " - " + data.nombre + " (Casa " + data.casa + ")";

});

// 📜 HISTORIAL TIEMPO REAL
function iniciarHistorial(){

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  db.collection("alertas")
    .where("villa","==",usuario.villa)
    .orderBy("timestamp","desc")
    .limit(20)
    .onSnapshot((snapshot)=>{

      const ul = document.getElementById("historial");
      ul.innerHTML = "";

      snapshot.forEach(doc=>{

        const a = doc.data();

        const li = document.createElement("li");
        li.innerText =
          "🚨 " + a.tipo + " - " + a.nombre + " (Casa " + a.casa + ")";

        ul.appendChild(li);

      });

    });

}

// 🔄 AUTO LOGIN
window.onload = ()=>{

  const usuario = localStorage.getItem("usuario");

  if(usuario){
    document.getElementById("registro").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");

    document.getElementById("footer").innerText = "Bienvenido nuevamente 👋";

    iniciarHistorial();
  }

}
