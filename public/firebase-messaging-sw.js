importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
apiKey:"AIzaSyDzKHOwWJIuC4_f2OMuoEyMxJnucC-jr5I",
authDomain:"alerta-rosko.firebaseapp.com",
projectId:"alerta-rosko",
messagingSenderId:"1022811358317",
appId:"1:1022811358317:web:ce210848e7ed63d1412b64"
});

const messaging=firebase.messaging();

messaging.onBackgroundMessage(function(payload){

console.log("📩 mensaje recibido",payload);

const notificationTitle=payload.notification.title;

const notificationOptions={
body:payload.notification.body,
icon:"/icon.png",
vibrate:[200,100,200,100,200],
requireInteraction:true,
data:{
mapa:payload.data?.mapa
}
};

self.registration.showNotification(notificationTitle,notificationOptions);

});

self.addEventListener("notificationclick",function(event){

const mapa=event.notification.data?.mapa;

event.notification.close();

if(mapa){

event.waitUntil(
clients.openWindow(mapa)
);

}

});
