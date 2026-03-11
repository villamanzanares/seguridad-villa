// server.js - versión lista para Render con debug
import express from "express";
import bodyParser from "body-parser";
import admin from "firebase-admin";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(express.static("public"));

// Inicializar Firebase Admin desde variable de entorno
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin inicializado ✅");
} catch (err) {
  console.error("Error inicializando Firebase Admin. Revisa FIREBASE_SERVICE_ACCOUNT_JSON:", err);
}

// Referencia a Firestore
const db = admin.firestore();

// Endpoint para recibir alertas desde frontend
app.post("/alerta", async (req, res) => {
  const { tipo, usuario } = req.body;

  if (!tipo || !usuario) {
    return res.status(400).json({ success: false, error: "Faltan datos" });
  }

  try {
    // Obtener todos los tokens registrados en Firestore
    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    if (tokens.length === 0) {
      console.log("No hay tokens registrados en Firestore");
      return res.status(200).json({ success: true, message: "No hay tokens registrados" });
    }

    // Payload de la notificación
    const payload = {
      notification: {
        title: tipo,
        body: `Usuario: ${usuario}`,
      },
    };

    // Enviar notificación a todos los tokens
    const response = await admin.messaging().sendToDevice(tokens, payload);
    console.log(`Alerta enviada a ${tokens.length} token(s) ✅`, response);

    res.status(200).json({ success: true, message: "Alerta enviada ✅" });

  } catch (err) {
    console.error("Error enviando alerta FCM:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
