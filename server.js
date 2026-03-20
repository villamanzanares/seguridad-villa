import express from "express";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.static('public'));

// ------------------- FIREBASE ADMIN -------------------
const serviceAccount = JSON.parse(fs.readFileSync("serviceAccountKey.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

// ------------------- RUTA ENVIAR ALERTA -------------------
app.post("/enviar-alerta", async (req, res) => {
  const { tipo } = req.body;

  try {
    const tokensSnapshot = await db.collection("tokens").get();
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    if (!tokens.length) return res.status(400).json({ error: "No hay tokens registrados" });

    const message = {
      notification: {
        title: `🚨 ${tipo}`,
        body: `Alerta vecinal: ${tipo}`
      },
      tokens
    };

    const response = await messaging.sendMulticast(message);
    console.log("Notificación enviada a:", tokens.length, "devices");

    res.json({ id: new Date().getTime(), enviado: response.successCount });
  } catch (err) {
    console.error("Error enviando alerta:", err);
    res.status(500).json({ error: "Error enviando alerta" });
  }
});

// ------------------- SERVIDOR -------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
