import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

// Server Key desde Render
const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;

// Token de prueba (tu PC)
const TOKENS = [
"ejPSCL5eewe-FLzRn8iZIK:APA91bFlv5bBZ000RU7cDvybLSR0mxsVYZeparjP-NNOGa3yBYfQY0M4NWFRUyR7sY2hE9qBbOZT2Inffd-NeNDDtoLtJ6248FU0jdmNr3QilnQJmXfMRjI"
];

app.post("/alerta", async (req, res) => {

const { tipo, usuario } = req.body;

if(!tipo || !usuario){
return res.status(400).json({error:"Datos incompletos"});
}

console.log("Alerta recibida:", tipo, usuario);

try{

const payload = {
registration_ids: TOKENS,
notification:{
title: tipo,
body: `Usuario: ${usuario}`
}
};

const response = await fetch(
"https://fcm.googleapis.com/fcm/send",
{
method:"POST",
headers:{
"Authorization": `key=${FIREBASE_SERVER_KEY}`,
"Content-Type":"application/json"
},
body: JSON.stringify(payload)
}
);

const text = await response.text();

console.log("Respuesta FCM cruda:");
console.log(text);

// intentar convertir a JSON
let data;

try{
data = JSON.parse(text);
}catch{
console.log("Respuesta no es JSON (probablemente error de clave)");
return res.status(500).json({
error:"FCM respondió HTML",
detalle:text.substring(0,200)
});
}

console.log("Respuesta FCM JSON:", data);

res.json({
success:true,
fcm:data
});

}catch(error){

console.error("Error enviando alerta:", error);

res.status(500).json({
error:"Error enviando alerta",
detalle:error.message
});

}

});

app.listen(PORT, ()=>{
console.log("Servidor iniciado en puerto", PORT);
});
