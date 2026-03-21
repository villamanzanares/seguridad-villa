import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 IMPORTANTE: servir frontend
app.use(express.static('public'));

// 🔥 Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 🧠 Endpoint alerta
app.post('/alerta', async (req, res) => {
  try {
    const { tipo, mensaje, tokens } = req.body;

    if (!tokens || tokens.length === 0) {
      return res.status(400).json({ error: 'No hay tokens' });
    }

    const message = {
      notification: {
        title: `🚨 ${tipo}`,
        body: mensaje
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`📡 Enviados: ${response.successCount}`);
    console.log(`❌ Fallidos: ${response.failureCount}`);

    res.json({
      success: true,
      enviados: response.successCount,
      fallidos: response.failureCount
    });

  } catch (error) {
    console.error('❌ Error enviando alerta:', error);
    res.status(500).json({ error: 'Error enviando alerta' });
  }
});

// 🚀 iniciar server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
