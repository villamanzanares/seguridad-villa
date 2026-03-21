import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Servir frontend
app.use(express.static('public'));

// 🔥 Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 🧠 Base de datos temporal (memoria)
let tokens = [];

// 📲 GUARDAR TOKEN
app.post('/guardar-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token requerido' });
  }

  if (!tokens.includes(token)) {
    tokens.push(token);
    console.log('✅ Token guardado:', token);
  }

  res.json({ success: true });
});

// 🚨 ENVIAR ALERTA
app.post('/alerta', async (req, res) => {
  try {
    const { tipo } = req.body;

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No hay dispositivos registrados' });
    }

    console.log(`🚨 Nueva alerta: ${tipo}`);
    console.log(`📡 Enviando a ${tokens.length} dispositivos`);

    const message = {
      notification: {
        title: `🚨 ${tipo}`,
        body: `Alerta de ${tipo} en tu comunidad`
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`✅ Enviados: ${response.successCount}`);
    console.log(`❌ Fallidos: ${response.failureCount}`);

    res.json({
      success: true,
      enviados: response.successCount
    });

  } catch (error) {
    console.error('❌ Error enviando alerta:', error);
    res.status(500).json({ error: 'Error enviando alerta' });
  }
});

// 🚀 iniciar
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
