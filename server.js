// server.js
import express from 'express';
import admin from 'firebase-admin';

const app = express();
app.use(express.json());
app.use(express.static('.'));

// Inicializar Firebase usando variable de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// 🔥 ESTA LÍNEA ARREGLA EL ERROR PEM
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://alerta-rosko-default-rtdb.firebaseio.com"
});

console.log("Firebase inicializado ✅");

// Endpoint para alertas
app.post('/emergencia', async (req, res) => {
  try {
    const data = {
      usuario: req.body.usuario || 'test',
      ubicacion: req.body.ubicacion || 'Santiago',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    const db = admin.firestore();
    await db.collection('alertas').add(data);
    res.status(200).send({ ok: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).send({ ok: false, error: error.message });
  }
});

// Servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});



