import express from 'express';
import admin from 'firebase-admin';

const app = express();

app.use(express.json());
app.use(express.static('.'));

// Inicializar Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("Firebase inicializado ✅");

// 🔥 Endpoint Emergencia Global
app.post('/emergencia', async (req, res) => {
  try {
    const db = admin.firestore();
    const { usuario, ubicacion, token } = req.body;

    const data = {
      usuario: usuario || 'test',
      ubicacion: ubicacion || 'Santiago',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    // 1️⃣ Guardar alerta
    await db.collection('alertas').add(data);

    // 2️⃣ Guardar token si existe y no está repetido
    if (token) {
      const tokenRef = db.collection('tokens').doc(token);
      const doc = await tokenRef.get();
      if (!doc.exists) {
        await tokenRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
        console.log("Nuevo token guardado ✅");
      }
    }

    // 3️⃣ Obtener TODOS los tokens registrados
    const snapshot = await db.collection('tokens').get();
    const tokens = snapshot.docs.map(doc => doc.id);

    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: {
          title: "🚨 Emergencia activada",
          body: `Ubicación: ${data.ubicacion}`
        }
      });

      console.log(`Notificación enviada a ${tokens.length} dispositivos 🔥`);
    }

    res.status(200).send({ ok: true });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ ok: false, error: error.message });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
