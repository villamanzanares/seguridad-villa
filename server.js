// server.js - Render + Server Key + token de prueba
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch"; // Node <18: npm install node-fetch

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(express.static("public"));

// Tu Server Key de Firebase (guárdala en Render como FIREBASE_SERVER_KEY)
const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;

// Tokens FCM de prueba (tu token generado en el navegador)
const TOKENS = [
  "ejPSCL5eewe-FLzRn8iZIK:APA91bFlv5bBZ000RU7cDvybLSR0mxsVYZeparjP-NNOGa3yBYfQY0M4NWFRUyR7sY2hE9qBbOZT2Inffd-NeNDDtoLtJ6248FU0jdmNr3QilnQJmXfMRjI"
];

app.post("/alerta", async (req, res) => {
  const { tipo, usuario } = req.body;

  if (!tipo || !usuario) return res.status(400).json({ success: false, error: "Faltan datos" });

  try {
    if (TOKENS.length === 0) {
      return res.status(200).json({ success: true, message: "No hay tokens registrados" });
    }

    // Payload de la notificación
    const payload = {
      registration_ids: TOKENS,
      notification: {
        title: tipo,
        body: `Usuario: ${usuario}`,
      },
    };

    // Enviar notificación a FCM
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
