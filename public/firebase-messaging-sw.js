importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Inicializa Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.firebasestorage.app",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging = firebase.messaging();

// Array de sonidos de emergencia
const sonidos = [
  '/sounds/ambulancia.wav',
  '/sounds/emergencia.wav',
  '/sounds/policia.wav',
  '/sounds/sirena.mp3'
];

// Escucha notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notificación recibida:', payload);

  // Escoge un sonido al azar
  const sonidoElegido = sonidos[Math.floor(Math.random() * sonidos.length)];

  const notificationTitle = payload.notification?.title || 'Alerta Villa Segura';
  const notificationOptions = {
    body: payload.notification?.body || 'Revisa la aplicación para más detalles',
    icon: '/icon.png',       // reemplaza con tu icono
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    sound: sonidoElegido,    // sonido aleatorio
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejo de click en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada', event.notification.data);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) clientList[0].focus();
      else clients.openWindow('/');
    })
  );
});
