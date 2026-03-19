import express from "express";
import admin from "firebase-admin";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("Firebase Admin iniciado ✅");

/* SUBSCRIBE */
app.post("/subscribe", async (req,res)=>{

  const { token } = req.body;

  try{
    await admin.messaging().subscribeToTopic(token,"vecinos");
    res.json({ ok:true });
  }catch(err){
    res.status(500).json({ error: err.message });
  }

});

/* ALERTA */
app.post("/alerta", async (req,res)=>{

  const { tipo, usuario, ubicacion } = req.body;

  try{

    const message = {
      notification:{
        title: tipo,
        body: `${usuario} - ${ubicacion}`
      },
      topic:"vecinos"
    };

    const response = await admin.messaging().send(message);

    res.json({ success:true });

  }catch(err){

    res.status(500).json({ error:err.message });

  }

});

app.listen(PORT,()=>{
  console.log("Servidor activo en puerto",PORT);
});
