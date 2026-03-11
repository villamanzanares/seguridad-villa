// server.js - versión Render con fetch y Server Key
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch"; // si Node <18, instala: npm install node-fetch

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(express.static("public"));

// Tu Server Key de Firebase (del proyecto FCM)
// ⚠️ Mantén esta key privada, puedes guardarla en Render como variable FIREBASE_SERVER_KEY
const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;
console.log("Server Key cargada ✅", FIREBASE_SERVER_KEY ? true : false);

app.post("/alerta", async (req, res) => {
  const { tipo, usuario } = req.body;

  if (!tipo || !usuario) {
    return res.status(400).json({ success: false, error: "Faltan datos" });
  }

  try {
    // Obtener todos los tokens desde Firestore (simulación si quieres, o con tu DB)
    // Aquí suponemos que tienes la colección "tokens" en Firestore y guardaste los tokens
    const admin = await import("firebase-admin");
    const db = admin.firestore();

    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    if (tokens.length === 0) {
      console.log("No hay tokens registrados");
      return res.status(200).json({ success: true, message: "No hay tokens registrados" });
    }

    // Payload de la notificación
    const payload = {
      registration_ids: tokens,
      notification: {
        title: tipo,
        body: `Usuario: ${usuario}`,
      },
    };

    // Llamada HTTP a FCM
    const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": `key=${FIREBASE_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await fcmResponse.json();
    console.log("FCM response:", data);

    res.status(200).json({ success: true, message: "Alerta enviada ✅", fcm: data });

  } catch (err) {
    console.error("Error enviando alerta:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

