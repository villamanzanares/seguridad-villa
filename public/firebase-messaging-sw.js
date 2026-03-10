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


messaging.onBackgroundMessage(function(payload){

  const tipo = payload.data.tipo;
  const lat = payload.data.lat;
  const lng = payload.data.lng;

  const url = "https://www.google.com/maps?q=" + lat + "," + lng;

  self.registration.showNotification("🚨 Villa Segura", {

    body: "Alerta de " + tipo,
    icon: "/icon.png",

    data: {
      url: url
    }

  });

});


self.addEventListener("notificationclick", function(event){

  event.notification.close();

  const url = event.notification.data.url;

  event.waitUntil(
    clients.openWindow(url)
  );

});
