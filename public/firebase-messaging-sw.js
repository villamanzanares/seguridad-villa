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


/* CUANDO LLEGA LA NOTIFICACIÓN */

messaging.onBackgroundMessage(function(payload) {

  const tipo = payload.data.tipo;
  const lat = payload.data.lat;
  const lng = payload.data.lng;

  const notificationTitle = "🚨 Villa Segura";

  const notificationOptions = {

    body: "Alerta de " + tipo,
    icon: "/icon.png",

    data: {
      lat: lat,
      lng: lng
    },

    actions: [
      {
        action: "ver",
        title: "📍 Ver ubicación"
      }
    ]

  };

  self.registration.showNotification(notificationTitle, notificationOptions);

});


/* CUANDO EL USUARIO TOCA LA NOTIFICACIÓN */

self.addEventListener("notificationclick", function(event){

  const lat = event.notification.data.lat;
  const lng = event.notification.data.lng;

  event.notification.close();

  const url = "https://www.google.com/maps?q=" + lat + "," + lng;

  event.waitUntil(
    clients.openWindow(url)
  );

});
