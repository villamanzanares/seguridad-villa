importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging = firebase.messaging();

// Notificaciones en background
messaging.onBackgroundMessage(payload => {
  const { tipo } = payload.data;
  self.registration.showNotification(`Alerta: ${tipo}`, {
    body: `Toca para abrir la app`,
    icon: '/icon.png'
  });
});

// Al tocar notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
