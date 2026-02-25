// server.js
import express from 'express';
import admin from 'firebase-admin';

const app = express();
app.use(express.json());

// Inicializar Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("Firebase inicializado ✅");

// Endpoint para enviar notificación
app.post('/emergencia', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).send({ ok: false, error: "No token provided" });
    }

    const message = {
      token: token,
      notification: {
        title: "🚨 ALERTA ROSKO",
        body: "Se ha activado el botón de emergencia",
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      }
    };

    const response = await admin.messaging().send(message);

    console.log("Notificación enviada:", response);

    res.status(200).send({ ok: true, message: "Notificación enviada" });

  } catch (error) {
    console.error("Error enviando notificación:", error);
    res.status(500).send({ ok: false, error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
