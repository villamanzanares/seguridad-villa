// firebase-messaging-sw.js

// Importar la versión compat de Firebase
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Inicializar Firebase con tu configuración
firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.appspot.com",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});

// Obtener instancia de Messaging
const messaging = firebase.messaging();

// Escuchar notificaciones cuando la app está en background
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Notificación recibida en background:', payload);

  const notificationTitle = payload.notification?.title || 'Alerta Villa Segura';
  const notificationOptions = {
    body: payload.notification?.body || '¡Revisa la aplicación!',
    icon: './favicon.ico' // opcional
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
