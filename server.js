const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});

let tokens = [];

app.post("/guardar-token",(req,res)=>{

const token = req.body.token;

if(!tokens.includes(token)){
tokens.push(token);
console.log("Nuevo dispositivo:",token);
}

res.json({ok:true});

});

app.post("/alerta",async(req,res)=>{

const {tipo,lat,lng} = req.body;

console.log("ALERTA:",tipo,lat,lng);

const mensaje = {

notification:{
title:"🚨 Villa Segura",
body:"Alerta de "+tipo
},

data:{
lat:String(lat),
lng:String(lng),
tipo:tipo
}

};

try{

const response = await admin.messaging().sendEachForMulticast({
tokens:tokens,
...mensaje
});

console.log("Enviados:",response.successCount);

res.json({
success:true,
enviados:response.successCount
});

}catch(error){

console.log(error);

res.json({
success:false
});

}

});

const PORT = process.env.PORT || 8080;

app.listen(PORT,()=>{
console.log("Servidor corriendo en puerto",PORT);
});
