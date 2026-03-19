importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging = firebase.messaging();

// 📩 BACKGROUND
messaging.onBackgroundMessage((payload)=>{

  const data = payload.data;

  const title = "🚨 " + data.tipo;

  const options = {
    body: data.nombre + " - Casa " + data.casa,
    icon: "/icon.png"
  };

  self.registration.showNotification(title, options);

});
