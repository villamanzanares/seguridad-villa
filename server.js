const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Verificación de variable (puedes borrarlo después)
console.log("VARIABLE RAW:", process.env.FIREBASE_SERVICE_ACCOUNT);

// 🔐 Inicializar Firebase
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error("❌ Error parseando FIREBASE_SERVICE_ACCOUNT:", error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 🚀 Ruta de prueba
app.get("/", (req, res) => {
  res.send("🚨 Servidor Villa Segura funcionando");
});

// 📡 Endpoint para enviar notificaciones
app.post("/send-alert", async (req, res) => {
  const { token, titulo, mensaje } = req.body;

  try {
    await admin.messaging().send({
      token,
      notification: {
        title: titulo,
        body: mensaje,
      },
    });

    res.status(200).send("✅ Notificación enviada");
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
    res.status(500).send("Error enviando notificación");
  }
});

// 🌍 Puerto dinámico para Render
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
