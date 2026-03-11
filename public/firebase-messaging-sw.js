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
  const data = payload.data;
  self.registration.showNotification(`Alerta: ${data.tipo}`, {
    body: `${data.nombre} - ${data.telefono} - ${data.casa}`,
    icon: '/icon.png',
    vibrate: [200, 100, 200],
    tag: 'alerta-rosko'
  });
});

// Al tocar la notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === '/' && 'focus' in client) {
          // Enviar mensaje para actualizar footer y sonar
          client.postMessage({
            accion: 'alertaBackground',
            tipo: event.notification.title.replace('Alerta: ', ''),
            nombre: event.notification.body.split(' - ')[0],
            telefono: event.notification.body.split(' - ')[1],
            casa: event.notification.body.split(' - ')[2]
          });
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      return clients.openWindow('/').then(newClient => {
        newClient.postMessage({
          accion: 'alertaBackground',
          tipo: event.notification.title.replace('Alerta: ', ''),
          nombre: event.notification.body.split(' - ')[0],
          telefono: event.notification.body.split(' - ')[1],
          casa: event.notification.body.split(' - ')[2]
        });
      });
    })
  );
});
