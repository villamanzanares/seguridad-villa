import express from "express";
import admin from "firebase-admin";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

/* FIREBASE ADMIN */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("Firebase Admin iniciado ✅");

/* SUSCRIBIR TOKEN */
app.post("/subscribe", async (req,res)=>{

  const { token } = req.body;

  try{

    await admin.messaging().subscribeToTopic(token,"vecinos");

    console.log("Token suscrito a vecinos");

    res.json({ ok:true });

  }catch(err){

    console.error("Error suscripción:",err);

    res.status(500).json({ error: err.message });

  }

});

/* ENVIAR ALERTA */
app.post("/alerta", async (req,res)=>{

  const { tipo, usuario } = req.body;

  try{

    const message = {
      notification:{
        title: tipo,
        body: `Usuario: ${usuario}`
      },
      topic:"vecinos"
    };

    const response = await admin.messaging().send(message);

    console.log("Alerta enviada:",response);

    res.json({ success:true });

  }catch(err){

    console.error("Error FCM:",err);

    res.status(500).json({ error:err.message });

  }

});

app.listen(PORT,()=>{
  console.log("Servidor activo en puerto",PORT);
});
