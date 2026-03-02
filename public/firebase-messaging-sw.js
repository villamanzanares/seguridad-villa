// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js');

// Configuración de Firebase (igual que en index.html)
const firebaseConfig = {
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.appspot.com",
  messagingSenderId: "118396150726725931815",
  appId: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I"
};

firebase.initializeApp(firebaseConfig);

// Inicializar Firebase Messaging
const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Notificación recibida en segundo plano:', payload);

  const notificationTitle = payload.notification.title || "🚨 Alerta";
  const notificationOptions = {
    body: payload.notification.body || "",
    icon: "/icono.png" // puedes cambiarlo por un ícono propio
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
