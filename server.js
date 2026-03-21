import express from 'express';
import admin from 'firebase-admin';

const app = express();
app.use(express.json());
app.use(express.static('public'));


// 🔥 INICIALIZAR FIREBASE DESDE VARIABLE DE ENTORNO
// Usa la variable: FIREBASE_SERVICE_ACCOUNT_JSON

let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (error) {
  console.error('❌ Error leyendo FIREBASE_SERVICE_ACCOUNT_JSON');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// 📲 GUARDAR TOKEN (sin duplicados)
app.post('/guardar-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    const existe = await db.collection('tokens')
      .where('token', '==', token)
      .get();

    if (existe.empty) {
      await db.collection('tokens').add({
        token,
        fecha: new Date()
      });
      console.log('📲 Token guardado');
    } else {
      console.log('🔁 Token ya existe');
    }

    res.json({ ok: true });

  } catch (error) {
    console.error('❌ Error guardando token:', error);
    res.status(500).json({ error: 'Error guardando token' });
  }
});


// 🚨 ENVIAR ALERTA
app.post('/alerta', async (req, res) => {
  try {
    const { tipo, lat, lng } = req.body;

    console.log('🚨 Nueva alerta:', tipo);

    // Guardar alerta
    const doc = await db.collection('alertas').add({
      tipo,
      lat: lat || null,
      lng: lng || null,
      fecha: new Date()
    });

    // Obtener tokens
    const snapshot = await db.collection('tokens').get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    console.log(`📡 Enviando a ${tokens.length} dispositivos`);

    if (tokens.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: `🚨 ${tipo}`,
          body: `Alerta en tu comunidad`
        },
        data: {
          tipo: tipo || '',
          lat: lat ? String(lat) : '',
          lng: lng ? String(lng) : ''
        }
      });

      console.log('✅ Notificaciones enviadas:', response.successCount);

      // 🧹 Limpiar tokens inválidos
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const docId = snapshot.docs[idx].id;
          db.collection('tokens').doc(docId).delete();
          console.log('❌ Token inválido eliminado');
        }
      });
    }

    res.json({
      ok: true,
      id: doc.id
    });

  } catch (error) {
    console.error('❌ Error enviando alerta:', error);
    res.status(500).json({ error: 'Error enviando alerta' });
  }
});


// 🟢 SERVIDOR
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
