importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.firebasestorage.app",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging = firebase.messaging();

// 🔔 Notificaciones en segundo plano (VERSIÓN ROBUSTA)
messaging.onBackgroundMessage(function(payload) {
  console.log("Mensaje recibido en background:", payload);

  let title = "🚨 Alerta vecinal";
  let body = "Nueva alerta recibida";

  try {
    if (payload.notification) {
      title = payload.notification.title || title;
      body = payload.notification.body || body;
    } else if (payload.data) {
      title = payload.data.title || title;
      body = payload.data.body || body;
    }
  } catch (e) {
    console.error("Error leyendo payload:", e);
  }

  self.registration.showNotification(title, {
    body: body,
    icon: '/icon.png',
    data: payload.data || {}
  });
});

// 👉 Manejo de clic en la notificación
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (const client of clientList) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/');
      })
  );
});
