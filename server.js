import express from "express";
import path from "path";
import admin from "firebase-admin";

const app = express();
app.use(express.json());

// ------------------ Servir archivos estáticos ------------------
app.use(express.static(path.join(process.cwd(), "public")));

// Endpoint raíz para servir index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});

// ------------------ Inicializar Firebase Admin ------------------
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log("Firebase Admin inicializado ✅");

} catch (err) {
  console.error("Error inicializando Firebase Admin:", err);
}

const messaging = admin.messaging();
const db = admin.firestore();

// ------------------ Endpoint para enviar alertas ------------------
app.post("/enviar-alerta", async (req, res) => {
  const { tipo } = req.body;

  try {
    // Leer todos los tokens registrados
    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    if (!tokens.length) {
      return res.json({ id: Date.now(), enviado: 0 });
    }

    // Preparar mensaje
    const message = {
      tokens,
      notification: {
        title: `🚨 ${tipo}`,
        body: `Alerta ${tipo} enviada`,
      },
    };

    // Enviar notificaciones
    const response = await messaging.sendMulticast(message);

    console.log(`Alerta "${tipo}" enviada a ${response.successCount} dispositivos ✅`);

    res.json({ id: Date.now(), enviado: response.successCount });

  } catch (err) {
    console.error("Error enviando alerta:", err);
    res.status(500).json({ id: Date.now(), enviado: 0, error: err.message });
  }
});

// ------------------ Iniciar servidor ------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
