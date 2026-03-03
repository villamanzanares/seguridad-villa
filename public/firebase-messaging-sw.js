importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "TU_API_KEY_REAL",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID_REAL",
  appId: "TU_APP_ID_REAL"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensaje en segundo plano recibido:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = { body: payload.notification.body };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
