const express = require('express');
const admin = require('firebase-admin');
const app = express();

app.use(express.json());

// Inicializar Firebase con la variable de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://alerta-rosko-default-rtdb.firebaseio.com" // reemplaza con tu URL de Firebase
});

console.log("Firebase inicializado ✅");

// Endpoint de prueba para alertas
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
