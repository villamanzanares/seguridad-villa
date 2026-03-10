importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");


firebase.initializeApp({

  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"

});


const messaging = firebase.messaging();


messaging.onBackgroundMessage(function(payload) {

  console.log("Notificación recibida:", payload);

  self.registration.showNotification(

    payload.notification.title,

    {
      body: payload.notification.body,
      icon: "/icon.png",
      vibrate: [200,100,200,100,200],
      requireInteraction: true
    }

  );

});
