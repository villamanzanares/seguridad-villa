import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

// 🧭 RUTA BASE (IMPORTANTE para Render)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ✅ SERVIR FRONTEND (CLAVE PARA ARREGLAR PANTALLA BLANCA)
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 🔥 INICIALIZAR FIREBASE ADMIN
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY))
});

const db = admin.firestore();

// 🧠 GUARDAR TOKEN
app.post("/guardar-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token requerido" });
    }

    await db.collection("tokens").doc(token).set({
      token,
      fecha: new Date()
    });

    console.log("✅ Token guardado:", token);
    res.json({ ok: true });

  } catch (error) {
    console.error("❌ Error guardando token:", error);
    res.status(500).json({ error: "Error guardando token" });
  }
});

// 🚨 ENVIAR ALERTA PUSH
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo, nombre, telefono, direccion } = req.body;

    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.id);

    if (tokens.length === 0) {
      return res.json({ ok: true, mensaje: "No hay dispositivos" });
    }

    const message = {
      notification: {
        title: `🚨 ${tipo}`,
        body: `${nombre} - ${direccion}`
      },
      data: {
        tipo: tipo || "",
        nombre: nombre || "",
        telefono: telefono || "",
        direccion: direccion || ""
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("📩 Notificaciones enviadas:", response.successCount);

    res.json({
      ok: true,
      enviados: response.successCount
    });

  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).json({ error: "Error enviando alerta" });
  }
});

// 🌐 PUERTO (Render usa process.env.PORT)
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor Villa Segura corriendo en puerto ${PORT}`);
});
