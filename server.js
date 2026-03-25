import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// 🔧 FIX __dirname (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌐 SERVIR FRONTEND (CLAVE)
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔥 INICIALIZAR FIREBASE ADMIN (ANTI-CRASH)
let serviceAccount;

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no existe");
  }

  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log("✅ Firebase Admin inicializado correctamente");

} catch (error) {
  console.error("❌ Error inicializando Firebase:", error.message);
}

// 🔔 GUARDAR TOKEN
app.post("/guardar-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token requerido" });
    }

    const db = admin.firestore();

    await db.collection("tokens").add({
      token,
      fecha: new Date()
    });

    console.log("📲 Token guardado:", token);

    res.json({ ok: true });

  } catch (error) {
    console.error("❌ Error guardando token:", error);
    res.status(500).json({ error: "Error guardando token" });
  }
});

// 🚨 ENVIAR ALERTA
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo, nombre, telefono, direccion } = req.body;

    const db = admin.firestore();

    // 📡 Obtener tokens
    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    if (tokens.length === 0) {
      return res.json({ ok: true, mensaje: "Sin dispositivos" });
    }

    // 🔥 PAYLOAD PUSH
    const message = {
      tokens,
      notification: {
        title: `🚨 ${tipo}`,
        body: `${nombre} - ${direccion}`
      },
      data: {
        tipo: tipo || "ALERTA",
        nombre: nombre || "Vecino",
        telefono: telefono || "Sin teléfono",
        direccion: direccion || "Sin dirección"
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("📡 Notificaciones enviadas:", response.successCount);

    res.json({
      ok: true,
      enviados: response.successCount
    });

  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).json({ error: "Error enviando alerta" });
  }
});

// 🚀 START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
