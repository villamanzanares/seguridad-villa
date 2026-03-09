importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.firebasestorage.app",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {

  console.log("📩 Mensaje recibido en background:", payload);

  const notificationTitle = payload.notification?.title || "🚨 Alerta";
  
  const notificationOptions = {
    body: payload.notification?.body || "Nueva alerta vecinal",
    icon: "/favicon.ico",
    vibrate: [200,100,200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);

});
