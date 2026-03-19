import express from "express";
import admin from "firebase-admin";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

/* FIREBASE */
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("Firebase Admin iniciado ✅");

/* =========================
   SUBSCRIBE
========================= */

app.post("/subscribe", async (req, res) => {
  const { token } = req.body;

  try {
    await admin.messaging().subscribeToTopic(token, "vecinos");
    res.json({ ok: true });
  } catch (err) {
    console.error("Error subscribe:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   ALERTA
========================= */

app.post("/alerta", async (req, res) => {
  const { tipo, usuario, telefono, casa, villa } = req.body;

  try {

    /* GUARDAR */
    await db.collection("alertas").add({
      tipo,
      usuario,
      telefono,
      casa,
      villa,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    /* PUSH */
    await admin.messaging().send({
      notification: {
        title: `🚨 ${tipo}`,
        body: `${usuario} - ${villa}`
      },
      topic: "vecinos"
    });

    console.log("Alerta enviada:", tipo);

    res.json({ ok: true });

  } catch (err) {
    console.error("Error alerta:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
