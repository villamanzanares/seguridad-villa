// server.js
const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const app = express();
app.use(bodyParser.json());

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Guardar token
app.post("/guardar-token", async (req, res) => {
  const { token } = req.body;
  try {
    await db.collection("tokens").doc(token).set({ token });
    res.send({ ok: true });
  } catch (e) {
    console.error("Error guardando token:", e);
    res.status(500).send({ ok: false });
  }
});

// Enviar alerta
app.post("/alerta", async (req, res) => {
  const { tipo, nombre, direccion, telefono } = req.body;

  try {
    // Traer todos los tokens
    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    // Preparar mensaje FCM
    const message = {
      tokens,
      notification: {
        title: `🚨 ALERTA VILLA SEGURA`,
        body: `${tipo} reportado por ${nombre}`
      },
      data: { tipo, nombre, direccion, telefono }
    };

    // Enviar notificaciones
    const response = await admin.messaging().sendMulticast(message);

    // Log detallado por token
    response.responses.forEach((r, idx) => {
      if (!r.success) console.log(`Error token: ${tokens[idx]} ->`, r.error);
    });

    // Guardar alerta en Firestore para footer en tiempo real
    await db.collection("alertas").add({
      tipo,
      nombre,
      direccion,
      telefono,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.send({ status: "ok" });

  } catch (e) {
    console.error("Error enviando alerta:", e);
    res.status(500).send('Error enviando alerta');
  }
});

app.listen(10000, () => console.log("Servidor corriendo en puerto 10000"));
