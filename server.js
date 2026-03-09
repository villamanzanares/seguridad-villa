import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname,"public")));

let firebaseReady=false;

try{

const serviceAccount=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
credential:admin.credential.cert(serviceAccount)
});

firebaseReady=true;

console.log("🔥 Firebase inicializado correctamente");

}catch(error){

console.error("❌ Error inicializando Firebase:",error);

}

const tokens=new Set();

/* registrar dispositivos */

app.post("/registrar-token",(req,res)=>{

const {token}=req.body;

if(!token){

return res.json({success:false});

}

tokens.add(token);

console.log("📱 Token registrado:",token);

res.json({
success:true,
total:tokens.size
});

});

/* alerta */

app.post("/emergency",async(req,res)=>{

if(!firebaseReady){

return res.json({
success:false,
error:"Firebase no listo"
});

}

if(tokens.size===0){

return res.json({
success:false,
error:"No hay dispositivos registrados"
});

}

try{

const {tipo,lat,lng}=req.body;

const mapa=lat&&lng
?`https://www.google.com/maps?q=${lat},${lng}`
:"";

const message={
notification:{
title:"🚨 ALERTA VECINAL",
body:`Un vecino activó ${tipo}`
},
data:{
mapa
},
tokens:Array.from(tokens)
};

const response=await admin.messaging().sendEachForMulticast(message);

console.log("📢 Notificaciones enviadas:",response.successCount);

res.json({
success:true,
enviados:response.successCount
});

}catch(error){

console.error("❌ Error enviando alerta:",error);

res.json({
success:false,
error:error.message
});

}

});

/* pagina principal */

app.get("/",(req,res)=>{

res.sendFile(path.join(__dirname,"public","index.html"));

});

const PORT=process.env.PORT||10000;

app.listen(PORT,()=>{

console.log("🚀 Servidor corriendo en puerto",PORT);

});
