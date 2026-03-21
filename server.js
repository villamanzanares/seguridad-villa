import express from 'express';
import admin from 'firebase-admin';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 🔥 Firebase init (usa tus credenciales)
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

// 📡 Endpoint alerta
app.post('/alerta', async (req, res) => {
  try {
    const { tipo, lat, lng } = req.body;

    // Guardar en Firestore
    const doc = await db.collection('alertas').add({
      tipo,
      lat,
      lng,
      fecha: new Date()
    });

    // Obtener tokens
    const tokensSnap = await db.collection('tokens').get();
    const tokens = tokensSnap.docs.map(doc => doc.data().token);

    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: `🚨 ${tipo}`,
          body: `Nueva alerta en tu comunidad`
        },
        data: {
          tipo,
          lat: lat ? String(lat) : '',
          lng: lng ? String(lng) : ''
        }
      });
    }

    res.json({ ok: true, id: doc.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar alerta' });
  }
});

app.listen(8080, () => {
  console.log('Servidor corriendo en puerto 8080');
});
