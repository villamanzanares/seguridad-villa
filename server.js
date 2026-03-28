require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

const app = express();

// 🔥 Middlewares
app.use(cors());
app.use(express.json());

// 📁 Servir carpeta PUBLIC (CLAVE)
app.use(express.static(path.join(__dirname, 'public')));

// 🔐 Inicializar Firebase SOLO si existe variable
let firebaseReady = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseReady = true;
    console.log('🔥 Firebase inicializado correctamente');
  } else {
    console.log('⚠️ FIREBASE_SERVICE_ACCOUNT no definida');
  }
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message);
}

// 🧪 Ruta test backend
app.get('/test', (req, res) => {
  res.send('🚨 Servidor Villa Segura funcionando');
});

// 🚨 Endpoint enviar alerta
app.post('/alerta', async (req, res) => {
  if (!firebaseReady) {
    return res.status(500).json({ error: 'Firebase no inicializado' });
  }

  const { titulo, mensaje, tokens } = req.body;

  try {
    const response = await admin.messaging().sendMulticast({
      notification: {
        title: titulo || '🚨 Alerta',
        body: mensaje || 'Nueva alerta'
      },
      tokens: tokens || []
    });

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

// 🌐 Ruta principal (ESTO ARREGLA TU PROBLEMA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Puerto
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
