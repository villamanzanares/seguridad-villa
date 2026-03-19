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

/* MEMORIA SIMPLE */
let historial = [];

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

    const evento = {
      tipo,
      usuario,
      ubicacion,
      timestamp: Date.now()
    };

    historial.unshift(evento);

    if(historial.length > 20){
      historial.pop();
    }

    const message = {
      notification:{
        title: tipo,
        body: `${usuario} - ${ubicacion}`
      },
      topic:"vecinos"
    };

    await admin.messaging().send(message);

    res.json({ success:true });

  }catch(err){
    res.status(500).json({ error:err.message });
  }

});

/* HISTORIAL */
app.get("/historial",(req,res)=>{
  res.json(historial);
});

app.listen(PORT,()=>{
  console.log("Servidor activo en puerto",PORT);
});
