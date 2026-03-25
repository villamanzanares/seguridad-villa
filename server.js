import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// ===============================
// 🔥 FIREBASE
// ===============================
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (error) {
  console.error("❌ Error parseando JSON:", error);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("🔥 Firebase OK");
}

// ===============================
// 🧠 MEMORIA DE TOKENS
// ===============================
let tokens = [];

// ===============================
// 📁 FRONTEND
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ===============================
// 💾 GUARDAR TOKEN
// ===============================
app.post("/guardar-token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token requerido" });
  }

  if (!tokens.includes(token)) {
    tokens.push(token);
    console.log("📱 Token guardado:", token);
  }

  res.json({ ok: true });
});

// ===============================
// 🚨 ENVIAR ALERTA A TODOS
// ===============================
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { titulo, nombre, telefono, ubicacion } = req.body;

    if (tokens.length === 0) {
      return res.status(400).json({ error: "No hay dispositivos registrados" });
    }

    const mensaje = {
      notification: {
        title: titulo || "🚨 ALERTIA",
        body: `${nombre || "Vecino"} - ${ubicacion || "Ubicación"}`,
      },
      data: {
        nombre: nombre || "",
        telefono: telefono || "",
        ubicacion: ubicacion || "",
        sonido: "sirena",
      },
      tokens: tokens, // 🔥 ENVÍA A TODOS
    };

    const response = await admin.messaging().sendEachForMulticast(mensaje);

    console.log("✅ Alertas enviadas:", response.successCount);
    res.json({ ok: true });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});
