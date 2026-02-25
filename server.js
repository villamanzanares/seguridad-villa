// server.js
import express from 'express';
import admin from 'firebase-admin';

const app = express();

app.use(express.json());
app.use(express.static('.')); // Sirve index.html y service worker

// Inicializar Firebase usando variable de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("Firebase inicializado ✅");

// Endpoint para alertas
app.post('/emergencia', async (req, res) => {
  try {
    const db = admin.firestore();

    const { usuario, ubicacion, token } = req.body;

    const data = {
      usuario: usuario || 'test',
      ubicacion: ubicacion || 'Santiago',
      token: token || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    // Guardar en Firestore
    await db.collection('alertas').add(data);

    // 🔥 Enviar notificación push si hay token
    if (token) {
      await admin.messaging().send({
        token: token,
        notification: {
          title: "🚨 Emergencia activada",
          body: `Ubicación: ${data.ubicacion}`
        }
      });

      console.log("Notificación enviada correctamente ✅");
    }

    res.status(200).send({ ok: true });

  } catch (error) {
    console.error("Error enviando notificación:", error);
    res.status(500).send({ ok: false, error: error.message });
  }
});

// Servidor
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
