importScripts("https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js");

// Config Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.firebasestorage.app",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging = firebase.messaging();

// PUSH RECIBIDO (APP cerrada o en 2º plano)
self.addEventListener("push", function(event){
  if(!event.data) return;
  const data = event.data.json();

  const titulo = data.notification?.title || "🚨 Villa Segura";
  const cuerpo = data.notification?.body || "Nueva alerta vecinal";

  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: cuerpo,
      icon: "/icon.png",
      badge: "/icon.png",
      vibrate: [300,100,300,100,500],
      requireInteraction: true,
      data
    })
  );
});

// CLICK EN NOTIFICACION
self.addEventListener("notificationclick", function(event){
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type:"window", includeUncontrolled:true}).then(clientsList=>{
      for(const client of clientsList){
        if(client.url.includes("/") && "focus" in client) return client.focus();
      }
      return clients.openWindow("/");
    })
  );
});

// INSTALACION Y ACTIVACION
self.addEventListener("install", e=>{ console.log("SW install", Date.now()); self.skipWaiting(); });
self.addEventListener("activate", e=>{ console.log("SW activate", Date.now()); self.clients.claim(); });
