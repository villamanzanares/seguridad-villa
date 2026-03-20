import express from "express";
import admin from "firebase-admin";

const app = express();
app.use(express.json());

// Inicializar Firebase Admin con variable de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const messaging = admin.messaging();
const db = admin.firestore();

// Endpoint para enviar alertas
app.post("/enviar-alerta", async (req, res) => {
  const { tipo } = req.body;
  try {
    // Leer tokens
    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    if (!tokens.length) {
      return res.json({ id: Date.now(), enviado: 0 });
    }

    // Preparar mensaje
    const message = {
      tokens,
      notification: {
        title: `🚨 ${tipo}`,
        body: `Alerta ${tipo} enviada`,
      },
    };

    // Enviar notificaciones
    const response = await messaging.sendMulticast(message);

    res.json({ id: Date.now(), enviado: response.successCount });

  } catch (err) {
    console.error("Error enviando alerta:", err);
    res.status(500).json({ id: Date.now(), enviado: 0, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
