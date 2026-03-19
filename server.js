const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// 🔥 FIREBASE ADMIN
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("Firebase Admin iniciado ✅");

// 🧠 TOKENS
let tokens = [];

// 📌 REGISTRO TOKEN
app.post("/registro-token", (req, res) => {
  const { token, villa } = req.body;

  tokens.push({ token, villa });

  console.log("Token registrado:", villa);

  res.sendStatus(200);
});

// 🚨 ALERTA
app.post("/alerta", async (req, res) => {
  const { tipo, usuario, villa } = req.body;

  try {
    // Guardar en Firestore
    await db.collection("alertas").add({
      tipo,
      usuario,
      villa,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Filtrar tokens por villa
    const tokensFiltrados = tokens
      .filter(t => t.villa === villa)
      .map(t => t.token);

    if (tokensFiltrados.length > 0) {
      await admin.messaging().sendMulticast({
        tokens: tokensFiltrados,
        notification: {
          title: `🚨 ALERTA ${tipo}`,
          body: `${usuario.nombre} - Casa ${usuario.casa}`
        }
      });
    }

    console.log("Alerta enviada:", tipo);

    res.sendStatus(200);

  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// 🚀 START
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
