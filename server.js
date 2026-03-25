import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

let serviceAccount;
try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON); }
catch(e){ console.error("❌ Error parseando JSON:", e); }

if(!admin.apps.length && serviceAccount){
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("🔥 Firebase OK");
}

const db = admin.firestore();

// FRONTEND
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname,"public")));
app.get("/", (req,res)=>res.sendFile(path.join(__dirname,"public/index.html")));

// GET VILLAS
app.get("/villas", async (req,res)=>{
  try{
    const snap = await db.collection("villas").get();
    res.json({ok:true, villas: snap.docs.map(d=>d.data().nombre)});
  }catch(e){ res.status(500).json({error:e.message}); }
});

// AGREGAR VILLA (superusuario)
app.post("/agregar-villa", async (req,res)=>{
  try{
    const { nombre } = req.body;
    if(!nombre) return res.status(400).json({error:"Nombre de villa requerido"});

    const snap = await db.collection("villas").where("nombre","==",nombre).get();
    if(!snap.empty) return res.status(400).json({error:"Villa ya existe"});

    await db.collection("villas").add({ nombre });
    console.log("🏡 Nueva villa agregada:", nombre);
    res.json({ok:true});
  }catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

// GUARDAR TOKEN + DATOS VECINO
app.post("/guardar-token", async (req,res)=>{
  try{
    const { token,nombre,telefono,direccion,casaDepto,villa } = req.body;
    if(!token||!nombre||!villa) return res.status(400).json({error:"Datos incompletos"});

    await db.collection("vecinos").doc(token).set({nombre,telefono,direccion,casaDepto,villa,token},{merge:true});
    console.log("📱 Vecino guardado:", nombre,villa);
    res.json({ok:true});
  }catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

// ENVIAR ALERTA SOLO A VECINOS DE LA MISMA VILLA
app.post("/enviar-alerta", async (req,res)=>{
  try{
    const { tipo, usuario } = req.body;
    if(!usuario.villa) return res.status(400).json({error:"Villa no definida"});

    const vecinosSnap = await db.collection("vecinos").where("villa","==",usuario.villa).get();
    if(vecinosSnap.empty) return res.status(400).json({error:"No hay vecinos registrados en esta villa"});

    const tokens = vecinosSnap.docs.map(d=>d.data().token);
    const mensaje = {
      notification: { title:`🚨 ${tipo.toUpperCase()}`, body:`${usuario.nombre} - ${usuario.direccion} / ${usuario.casaDepto}` },
      data:{...usuario,tipo},
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(mensaje);
    console.log(`✅ Alertas enviadas: ${response.successCount} de ${tokens.length} vecinos de ${usuario.villa}`);
    res.json({ok:true});
  }catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

// ===============================
const PORT = process.env.PORT || 8080;
app.listen(PORT,()=>console.log(`🚀 Servidor en puerto ${PORT}`));
