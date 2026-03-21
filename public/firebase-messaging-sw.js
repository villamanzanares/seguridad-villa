importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging = firebase.messaging();

// 🔥 BACKGROUND
messaging.onBackgroundMessage(function(payload) {
  console.log("🔥 SW recibió:", payload);

  const data = payload.data || {};

  const title = "🚨 ALERTA VILLA SEGURA";
  const body = `${data.tipo || "Alerta"} reportado por ${data.nombre || "vecino"}`;

  self.registration.showNotification(title, {
    body: body,
    icon: "/icon.png"
  });
});
