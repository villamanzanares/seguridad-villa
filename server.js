import express from "express";
import admin from "firebase-admin";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

/* FIREBASE ADMIN */
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("Firebase Admin iniciado ✅");

/* =========================
   SUSCRIPCIÓN
========================= */

app.post("/subscribe", async (req, res) => {
  const { token } = req.body;

  try {
    await admin.messaging().subscribeToTopic(token, "vecinos");
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   ALERTA
========================= */

app.post("/alerta", async (req, res) => {
  const { tipo, usuario, telefono, casa, villa } = req.body;

  try {
    /* GUARDAR EN FIRESTORE */
    await db.collection("alertas").add({
      tipo,
      usuario,
      telefono,
      casa,
      villa,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    /* ENVIAR PUSH */
    const message = {
      notification: {
        title: `🚨 ${tipo}`,
        body: `${usuario} - ${villa}`
      },
      topic: "vecinos"
    };

    await admin.messaging().send(message);

    res.json({ ok: true });
  } catch (err) {
    console.error("Error alerta:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
