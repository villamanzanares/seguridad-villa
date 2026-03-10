import express from 'express';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

// Servir archivos estáticos
app.use(express.static('public'));

// Servir correctamente los sonidos
app.use('/sounds', express.static(path.join(__dirname, 'public/sounds')));

// 🔹 Inicializar Firebase Admin
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
console.log("Firebase Admin inicializado ✅");

// 🔹 Guardar tokens en memoria
const tokens = new Set();

// 🔹 Endpoint para registrar tokens FCM
app.post('/register-token', (req, res) => {
  const { token } = req.body;
  if (token) tokens.add(token);
  console.log('Tokens registrados:', Array.from(tokens));
  res.json({ success: true });
});

// 🔹 Endpoint para enviar alertas
app.post('/send-alert', async (req, res) => {
  const { type, latitude, longitude } = req.body;
  if (!type) return res.status(400).json({ error: "Tipo de alerta requerido" });

  const payload = {
    notification: {
      title: `Alerta: ${type.toUpperCase()}`,
      body: `Ubicación: ${latitude}, ${longitude}`
    },
    data: { type }
  };

  try {
    const response = await admin.messaging().sendToDevice(Array.from(tokens), payload);
    console.log('Notificación enviada:', response);
    res.json({ success: true, messageId: response?.results?.[0]?.messageId || 'SIMULADO' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
