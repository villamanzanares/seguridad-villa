import express from "express";
import admin from "firebase-admin";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

// 🔥 Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("Firebase Admin iniciado ✅");

// 📌 SUSCRIPCIÓN A TOPIC
app.post("/subscribe", async (req,res)=>{

  const { token } = req.body;

  try{

    await admin.messaging().subscribeToTopic(token,"vecinos");

    res.json({ ok:true });

  }catch(err){

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

// 🚨 ENVIAR ALERTA
app.post("/alerta", async (req,res)=>{

  const { tipo, usuario } = req.body;

  try{

    // 💾 Guardar en Firestore
    await db.collection("alertas").add({
      tipo,
      nombre: usuario.nombre,
      casa: usuario.casa,
      telefono: usuario.telefono,
      villa: usuario.villa,
      timestamp: Date.now()
    });

    // 📡 Notificación
    const message = {
      notification:{
        title: "🚨 " + tipo,
        body: usuario.nombre + " - Casa " + usuario.casa
      },
      data:{
        tipo,
        nombre: usuario.nombre,
        casa: usuario.casa,
        villa: usuario.villa
      },
      topic:"vecinos"
    };

    await admin.messaging().send(message);

    res.json({ success:true });

  }catch(err){

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

app.listen(PORT,()=>{
  console.log("Servidor corriendo en puerto",PORT);
});
