import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 RUTAS ABSOLUTAS (IMPORTANTE EN RENDER)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 SERVIR CARPETA PUBLIC
app.use(express.static(path.join(__dirname, "public")));

// 🔥 FIREBASE ADMIN
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🧠 TOKENS EN MEMORIA
let tokens = [];

// =======================================
// 📲 GUARDAR TOKEN
// =======================================
app.post("/guardar-token", (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).send("Token requerido");

  if (!tokens.includes(token)) {
    tokens.push(token);
    console.log("✅ Token guardado");
  }

  res.send({ ok: true });
});

// =======================================
// 🚨 ENVIAR ALERTA
// =======================================
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo, nombre, direccion } = req.body;

    // 🔥 GUARDAR EN FIRESTORE
    await db.collection("alertas").add({
      tipo,
      nombre,
      direccion,
      timestamp: new Date()
    });

    // 🔔 PUSH
    if (tokens.length > 0) {
      const message = {
        notification: {
          title: "🚨 Nueva alerta",
          body: `${tipo} - ${nombre}`
        },
        tokens: tokens
      };

      await admin.messaging().sendEachForMulticast(message);
    }

    res.send({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
});

// 👉 ESTA LÍNEA HACE QUE / CARGUE TU INDEX.HTML
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 🚀 START
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
