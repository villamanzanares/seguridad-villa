import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

let serviceAccount;
try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON); }
catch (error) { console.error("❌ Error parseando JSON:", error); }

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("🔥 Firebase OK");
}

const db = admin.firestore();

// FRONTEND
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));

// GET LISTA DE VILLAS
app.get("/villas", async (req, res) => {
  try {
    const snap = await db.collection("villas").get();
    const lista = snap.docs.map(d => d.data().nombre);
    res.json({ ok: true, villas: lista });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GUARDAR TOKEN + DATOS VECINO EN FIRESTORE
app.post("/guardar-token", async (req, res) => {
  try {
    const { token, nombre, telefono, direccion, casaDepto, villa } = req.body;
    if (!token || !nombre || !villa) return res.status(400).json({ error: "Datos incompletos" });

    const userRef = db.collection("vecinos").doc(token);
    await userRef.set({ nombre, telefono, direccion, casaDepto, villa, token }, { merge: true });
    console.log("📱 Vecino guardado:", nombre, villa);

    res.json({ ok: true });
  } catch (error) { console.error("❌ Error guardar-token:", error); res.status(500).json({ error: error.message }); }
});

// ENVIAR ALERTA A TODOS LOS VECINOS
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo, usuario } = req.body;
    const vecinosSnap = await db.collection("vecinos").get();
    if (vecinosSnap.empty) return res.status(400).json({ error: "No hay vecinos registrados" });

    const tokens = vecinosSnap.docs.map(doc => doc.data().token);
    const mensaje = {
      notification: {
        title: `🚨 ${tipo.toUpperCase()}`,
        body: `${usuario.nombre} - ${usuario.direccion} / ${usuario.casaDepto}`
      },
      data: { ...usuario, tipo },
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(mensaje);
    console.log(`✅ Alertas enviadas: ${response.successCount} de ${tokens.length}`);
    res.json({ ok: true });
  } catch (error) { console.error("❌ Error enviar-alerta:", error); res.status(500).json({ error: error.message }); }
});

// ===============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
