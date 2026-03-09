import express from 'express';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post('/send-alert', async (req, res) => {
  const { type, latitude, longitude } = req.body;

  if (!type || !latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }

  const message = {
    notification: {
      title: `Alerta: ${type}`,
      body: `Ubicación: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
    },
    topic: 'vecinos',
    data: { type, latitude: latitude.toString(), longitude: longitude.toString() }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`Alerta ${type} enviada:`, response);
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(8080, () => console.log('Servidor corriendo en puerto 8080'));
