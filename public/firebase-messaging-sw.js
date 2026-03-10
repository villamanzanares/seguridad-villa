importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:"TU_API_KEY",
  authDomain:"alerta-rosko.firebaseapp.com",
  projectId:"alerta-rosko",
  messagingSenderId:"1022811358317",
  appId:"1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging = firebase.messaging();


/* CUANDO LLEGA UNA ALERTA */

messaging.onBackgroundMessage(function(payload){

  const tipo = payload.data.tipo;
  const lat = payload.data.lat;
  const lng = payload.data.lng;

  self.registration.showNotification("🚨 Villa Segura",{

    body:"Alerta de "+tipo,
    icon:"/icon.png",

    data:{
      lat:lat,
      lng:lng,
      tipo:tipo
    }

  });

});


/* CUANDO TOCAN LA NOTIFICACION */

self.addEventListener("notificationclick",(event)=>{

  event.notification.close();

  const lat = event.notification.data.lat;
  const lng = event.notification.data.lng;
  const tipo = event.notification.data.tipo;

  const url = "/?lat="+lat+"&lng="+lng+"&tipo="+tipo;

  event.waitUntil(
    clients.openWindow(url)
  );

});
