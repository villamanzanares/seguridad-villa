const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

/* FIREBASE ADMIN */

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const tokens = new Set();

/* GUARDAR TOKEN */

app.post("/guardar-token", (req, res) => {

  const { token } = req.body;

  if (!token) {
    return res.status(400).send("Token inválido");
  }

  tokens.add(token);

  console.log("📱 Token registrado:", token);

  res.send("Token guardado");
});

/* ENVIAR ALERTA */

app.post("/alerta", async (req, res) => {

  const { tipo, lat, lng } = req.body;

  console.log("🚨 Alerta recibida:", tipo);
  console.log("📍 GPS:", lat, lng);

  const mapa = `https://www.google.com/maps?q=${lat},${lng}`;

  const message = {
    notification: {
      title: "🚨 ALERTA VECINAL",
      body: `${tipo} cerca de tu ubicación`
    },

    data: {
      mapa: mapa
    },

    tokens: Array.from(tokens)
  };

  try {

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("📢 Notificaciones enviadas:", response.successCount);

    res.send("Alerta enviada");

  } catch (error) {

    console.error("❌ Error enviando alerta:", error);

    res.status(500).send("Error enviando alerta");

  }

});

/* CARGAR APP */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("🚀 Servidor iniciado en puerto", PORT);
});
