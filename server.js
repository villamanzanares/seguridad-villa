import express from 'express';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import serviceAccount from './serviceAccountKey.json' assert { type: "json" };

const app = express();
app.use(bodyParser.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.post('/guardar-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).send("Falta token");

  try {
    await db.collection('tokens').doc(token).set({ token });
    console.log(`✅ Token guardado: ${token}`);
    res.send('Token guardado');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error guardando token');
  }
});

app.post('/alerta', async (req, res) => {
  const { tipo } = req.body;

  try {
    const snapshot = await db.collection('tokens').get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    if (!tokens.length) return res.status(400).send('No hay tokens');

    const message = {
      tokens,
      notification: {
        title: `🚨 ALERTA VILLA SEGURA`,
        body: `${tipo} reportado`
      },
      data: {
        tipo
      }
    };

    const response = await admin.messaging().sendMulticast(message);

    console.log(`📡 Enviando a ${tokens.length} dispositivos`);
    console.log(`✅ Enviados: ${response.successCount}`);
    console.log(`❌ Fallidos: ${response.failureCount}`);

    res.send({ sent: response.successCount, failed: response.failureCount });
  } catch (e) {
    console.error(e);
    res.status(500).send('Error enviando alerta');
  }
});

app.listen(10000, () => {
  console.log('🚀 Servidor corriendo en puerto 10000');
});
