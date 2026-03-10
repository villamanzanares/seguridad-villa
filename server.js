import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos públicos
app.use(express.static(path.join(__dirname, "public")));

// Servir sonidos
app.use("/sounds", express.static(path.join(__dirname, "public/sounds")));

// 🔹 Inicializar Firebase Admin
let firebaseActivo = false;

try {

  const serviceAccount = JSON.parse(
    fs.readFileSync("./serviceAccountKey.json", "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  firebaseActivo = true;
  console.log("🔥 Firebase inicializado correctamente");

} catch (error) {

  console.log("⚠️ Firebase NO inicializado, funcionando en modo simulación");
}

// 🔹 Guardar tokens
const tokens = new Set();

app.post("/register-token", (req, res) => {

  const { token } = req.body;

  if (token) {
    tokens.add(token);
    console.log("📱 Token registrado:", token);
  }

  res.json({ success: true });
});

// 🔹 Enviar alerta
app.post("/send-alert", async (req, res) => {

  const { type, latitude, longitude } = req.body;

  console.log("🚨 Alerta recibida:", type);
  console.log("📍 Ubicación:", latitude, longitude);
  console.log("📲 Tokens disponibles:", tokens.size);

  const payload = {
    notification: {
      title: `ALERTA ${type.toUpperCase()}`,
      body: `Ubicación aproximada enviada`
    },
    data: {
      type: type
    }
  };

  // 🔹 Si Firebase está activo intenta enviar
  if (firebaseActivo && tokens.size > 0) {

    try {

      const response = await admin.messaging().sendEachForMulticast({
        tokens: Array.from(tokens),
        notification: payload.notification,
        data: payload.data
      });

      console.log("📡 Notificaciones enviadas:", response.successCount);

      return res.json({
        success: true,
        messageId: "FCM_OK"
      });

    } catch (error) {

      console.log("❌ Error enviando FCM:", error.message);

    }

  }

  // 🔹 Simulación si falla FCM
  console.log("🧪 Modo simulación activado");

  res.json({
    success: true,
    messageId: "SIMULADO"
  });

});

// 🔹 Puerto
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("🚀 Servidor funcionando en puerto", PORT);
});
