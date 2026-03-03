importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.appspot.com",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[Service Worker] Background message received:', payload);

  const notificationTitle = payload.notification?.title || '🚨 Alerta';
  const notificationOptions = {
    body: payload.notification?.body || '¡Revisa la aplicación!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: 'alerta-unica',
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
