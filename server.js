import express from "express";
import admin from "firebase-admin";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// 🔹 Array para guardar tokens registrados (en memoria)
const tokensRegistrados = [];

// 🔹 Inicializar Firebase Admin con tu variable de entorno
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("❌ ERROR: La variable FIREBASE_SERVICE_ACCOUNT_JSON no está definida.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
});

console.log("✅ Firebase inicializado correctamente");

// 🔹 Endpoint para registrar token FCM
app.post("/registrar-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: "No se recibió token" });

  if (!tokensRegistrados.includes(token)) {
    tokensRegistrados.push(token);
    console.log("✅ Token registrado:", token);
  }

  res.json({ success: true, tokens: tokensRegistrados.length });
});

// 🔹 Endpoint para enviar alerta de emergencia
app.post("/emergencia", async (req, res) => {
  const { usuario } = req.body;

  if (!usuario || !usuario.nombre || !usuario.casa) {
    return res.status(400).json({ success: false, error: "Datos incompletos del usuario" });
  }

  if (tokensRegistrados.length === 0) {
    return res.status(400).json({ success: false, error: "No hay dispositivos registrados" });
  }

  const message = {
    notification: {
      title: `🚨 Emergencia de ${usuario.nombre}`,
      body: `Casa: ${usuario.casa}`
    },
    tokens: tokensRegistrados
  };

  try {
  const response = await admin.messaging().sendMulticast(message);
  console.log("RESPUESTA COMPLETA:", JSON.stringify(response, null, 2));
  res.json({ success: true, response });
} catch (err) {
  console.error("ERROR DETALLADO:", err);
  res.status(500).json({ success: false, error: err.message });
}
});

// 🔹 Servir frontend si quieres (opcional)
app.use(express.static("public"));

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));

