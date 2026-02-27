importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.firebasestorage.app",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en background:', payload);

  const notificationTitle = payload.notification?.title || "🚨 Alerta";
  const notificationOptions = {
    body: payload.notification?.body || "Nueva emergencia activada",
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
