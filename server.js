import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Firebase Admin
import admin from "firebase-admin";

// 🔥 CONFIGURACIÓN BÁSICA
const app = express();
app.use(cors());
app.use(express.json());

// 🧭 Necesario para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Servir carpeta public
app.use(express.static(path.join(__dirname, "public")));

// 🔥 INICIALIZAR FIREBASE ADMIN
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("🔥 Firebase Admin inicializado");
} catch (error) {
  console.error("❌ Error inicializando Firebase:", error);
}

// 🧠 Almacenamiento temporal de tokens (puedes cambiar a Firestore después)
let tokens = [];

// 📲 REGISTRAR TOKEN
app.post("/registrar-token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token requerido" });
  }

  if (!tokens.includes(token)) {
    tokens.push(token);
  }

  console.log("📲 Token registrado:", token);
  res.json({ success: true });
});

// 🚨 ENVIAR ALERTA
app.post("/enviar-alerta", async (req, res) => {
  const { tipo, lat, lng } = req.body;

  if (!tipo) {
    return res.status(400).json({ error: "Tipo de alerta requerido" });
  }

  if (tokens.length === 0) {
    return res.json({
      success: true,
      mensaje: "No hay usuarios registrados",
      enviados: 0,
    });
  }

  const message = {
    notification: {
      title: `🚨 ALERTA: ${tipo}`,
      body: `Ubicación: ${lat || "N/A"}, ${lng || "N/A"}`,
    },
    data: {
      tipo: tipo || "",
      lat: lat ? String(lat) : "",
      lng: lng ? String(lng) : "",
    },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("📡 Resultado envío:", response);

    res.json({
      success: true,
      enviados: response.successCount,
      fallidos: response.failureCount,
    });
  } catch (error) {
    console.error("❌ Error enviando alerta:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 🌐 RUTA PRINCIPAL (IMPORTANTE PARA EL "Cannot GET /")
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🩺 TEST RÁPIDO
app.get("/ping", (req, res) => {
  res.send("pong 🏓");
});

// 🚀 PUERTO
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
