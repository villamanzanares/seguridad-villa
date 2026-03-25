import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 INICIALIZAR FIREBASE ADMIN
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🧠 ARRAY EN MEMORIA (puedes luego pasarlo a Firestore si quieres)
let tokens = [];

// =======================================
// 📲 GUARDAR TOKEN
// =======================================
app.post("/guardar-token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).send("Token requerido");
  }

  if (!tokens.includes(token)) {
    tokens.push(token);
    console.log("✅ Token guardado:", token);
  }

  res.send({ ok: true });
});

// =======================================
// 🚨 ENVIAR ALERTA
// =======================================
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo, nombre, direccion } = req.body;

    if (!tipo || !nombre || !direccion) {
      return res.status(400).send("Faltan datos");
    }

    // 🔥 1. GUARDAR EN FIRESTORE (TIEMPO REAL)
    await db.collection("alertas").add({
      tipo,
      nombre,
      direccion,
      timestamp: new Date()
    });

    // 🔔 2. ENVIAR PUSH
    if (tokens.length > 0) {
      const message = {
        notification: {
          title: "🚨 Nueva alerta",
          body: `${tipo} - ${nombre}`
        },
        tokens: tokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log("📩 Notificaciones enviadas:", response.successCount);
    } else {
      console.log("⚠️ No hay tokens registrados");
    }

    res.send({ ok: true });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).send("Error interno");
  }
});

// =======================================
// 🌐 RUTA TEST
// =======================================
app.get("/", (req, res) => {
  res.send("🚀 Servidor Villa Segura activo");
});

// =======================================
// 🚀 LEVANTAR SERVIDOR
// =======================================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
