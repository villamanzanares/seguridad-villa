// server.js - versión multi-dispositivo
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
// Simulación de base de datos de tokens
// En producción esto iría en Firestore o Realtime DB
// ---------------------------
let tokensRegistrados = [];

// Registrar un token (por ejemplo desde la app frontend)
app.post("/registrar-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token no proporcionado" });

  if (!tokensRegistrados.includes(token)) {
    tokensRegistrados.push(token);
    console.log("✅ Token registrado:", token);
  } else {
    console.log("ℹ️ Token ya registrado:", token);
  }

  return res.status(200).json({ success: true });
});

// ---------------------------
// Endpoint de alerta
// ---------------------------
app.post("/emergencia", async (req, res) => {
  const { token } = req.body;

  // Si envían token específico, lo usamos; si no, enviamos a todos
  const tokensAEnviar = token ? [token] : tokensRegistrados;

  if (!tokensAEnviar.length) {
    return res.status(400).json({ error: "No hay tokens para enviar alerta" });
  }

  const message = {
    notification: {
      title: "🚨 Emergencia",
      body: "Alerta activada",
    },
    tokens: tokensAEnviar, // Enviar a todos los tokens
  };

  try {
    const response = await admin.messaging().sendMulticast(message);

    console.log("✅ Envío completo. Éxitos:", response.successCount, "Errores:", response.failureCount);
    response.responses.forEach((r, i) => {
      if (!r.success) console.error("❌ Error token:", tokensAEnviar[i], r.error);
    });

    return res.status(200).json({
      success: true,
      enviados: response.successCount,
      fallidos: response.failureCount,
    });
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
