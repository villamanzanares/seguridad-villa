importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js?v=3');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js?v=3');

const SW_VERSION = 'v3';
console.log('[SW] Versión:', SW_VERSION);

// Inicializa Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.firebasestorage.app",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});;

const messaging = firebase.messaging();

// Sonidos de alerta
const sonidos = [
  '/sounds/ambulancia.wav',
  '/sounds/emergencia.wav',
  '/sounds/policia.wav',
  '/sounds/sirena.mp3'
];

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notificación recibida:', payload);
  const sonidoElegido = sonidos[Math.floor(Math.random() * sonidos.length)];

  const notificationTitle = payload.notification?.title || 'Alerta Villa Segura';
  const notificationOptions = {
    body: payload.notification?.body || 'Revisa la aplicación',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200,100,200],
    sound: sonidoElegido,
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada', event.notification.data);
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) clientList[0].focus();
      else clients.openWindow('/');
    })
  );
});
