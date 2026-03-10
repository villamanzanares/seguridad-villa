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

// Notificación en background
messaging.onBackgroundMessage(payload => {
  const { tipo } = payload.data;
  self.registration.showNotification(`Alerta: ${tipo}`, {
    body: "Toca para abrir la app y escuchar la sirena",
    icon: '/icon.png',
    vibrate: [200, 100, 200],
    tag: 'alerta-rosko'
  });
});

// Al tocar la notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(windowClients => {
      for (let client of windowClients) {
        // Si ya hay ventana abierta
        if (client.url === '/' && 'focus' in client) {
          client.postMessage({ accion: 'sonarSirena' });
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      return clients.openWindow('/').then(newClient => {
        newClient.postMessage({ accion: 'sonarSirena' });
      });
    })
  );
});
