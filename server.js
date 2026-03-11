// server.js
import express from "express";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
const PORT = 8080;

app.use(bodyParser.json());
app.use(express.static("public"));

// Inicializar Firebase Admin con tu service account
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Endpoint para recibir alertas desde el frontend
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
    console.log("Notificación enviada:", response);

    res.status(200).json({ success: true, message: "Alerta enviada ✅" });

  } catch (err) {
    console.error("Error enviando alerta:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
