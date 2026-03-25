import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// 🧭 RUTAS (IMPORTANTE EN RENDER)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌐 SERVIR FRONTEND
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

  if (!token) {
    return res.status(400).send("Token requerido");
  }

  if (!tokens.includes(token)) {
    tokens.push(token);
    console.log("✅ Token guardado:", token.substring(0, 20) + "...");
  }

  res.send({ ok: true });
});

// =======================================
// 🚨 ENVIAR ALERTA
// =======================================
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo, nombre, telefono, direccion } = req.body;

    if (!tipo) {
      return res.status(400).send("Tipo de alerta requerido");
    }

    // 🔥 GUARDAR EN FIRESTORE
    const nuevaAlerta = {
      tipo,
      nombre: nombre || "Anónimo",
      telefono: telefono || "Sin teléfono",
      direccion: direccion || "Sin dirección",
      timestamp: new Date()
    };

    await db.collection("alertas").add(nuevaAlerta);

    console.log("🚨 Alerta guardada:", nuevaAlerta);

    // 🔔 ENVIAR PUSH
    if (tokens.length > 0) {
      const message = {
        notification: {
          title: `🚨 ${tipo}`,
          body: `${nombre || "Vecino"} - ${direccion || ""}`
        },
        tokens: tokens
      };

      await admin.messaging().sendEachForMulticast(message);

      console.log("📲 Push enviado a", tokens.length, "dispositivos");
    }

    res.send({ ok: true });

  } catch (error) {
    console.error("❌ Error al enviar alerta:", error);
    res.status(500).send("Error interno");
  }
});

// =======================================
// 🌐 RUTA PRINCIPAL (CARGA TU APP)
// =======================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 🚀 START SERVER
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
