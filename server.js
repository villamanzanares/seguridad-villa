// server.js
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import bodyParser from "body-parser";

// ---------------------------
// Inicialización Firebase Admin
// ---------------------------
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ---------------------------
// Configuración Express
// ---------------------------
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

// ---------------------------
// Endpoint de prueba / emergencia
// ---------------------------
app.post("/emergencia", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token no proporcionado" });
  }

  const message = {
    notification: {
      title: "🚨 Emergencia",
      body: "Alerta activada",
    },
    token: token,
  };

  try {
    await admin.messaging().send(message);
    console.log("✅ Notificación enviada al token:", token);
    return res.status(200).json({ success: true, message: "Alerta enviada" });
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------
// Iniciar servidor
// ---------------------------
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
