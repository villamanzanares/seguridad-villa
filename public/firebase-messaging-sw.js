// firebase-messaging-sw.js

const VERSION = Date.now(); // cambia cada deploy

self.addEventListener("install", (event) => {
  console.log(`SW install ${VERSION}`);
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log(`SW activate ${VERSION}`);
  clients.claim();
});

importScripts("https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
  authDomain: "alerta-rosko.firebaseapp.com",
  projectId: "alerta-rosko",
  storageBucket: "alerta-rosko.firebasestorage.app",
  messagingSenderId: "1022811358317",
  appId: "1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging = firebase.messaging();

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const titulo = data.notification?.title || "🚨 ALERTIA";
  const cuerpo = data.notification?.body || "Nueva alerta vecinal";

  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: cuerpo,
      icon: "/icon.png",
      badge: "/icon.png",
      vibrate: [300,100,300,100,500],
      requireInteraction: true,
      data: data
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type:"window", includeUncontrolled:true }).then(clientList => {
      for (const client of clientList) { if (client.url.includes("/") && "focus" in client) return client.focus(); }
      return clients.openWindow("/");
    })
  );
});
