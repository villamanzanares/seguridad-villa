const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 FIREBASE (USANDO TU VARIABLE CORRECTA)
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("🔥 Firebase inicializado correctamente");

} catch (error) {
  console.error("❌ Error inicializando Firebase:", error);
}

// 📦 SERVIR FRONTEND
app.use(express.static("public"));

// 🧠 MEMORIA SIMPLE
let ultimaAlerta = null;

// 🚨 RECIBIR ALERTA
app.post("/alerta", (req, res) => {
  ultimaAlerta = req.body;

  console.log("🚨 Nueva alerta:", ultimaAlerta);

  res.json({ ok: true });
});

// 📡 ENTREGAR ALERTA
app.get("/estado", (req, res) => {
  res.json(ultimaAlerta);
});

// 🧪 TEST
app.get("/test", (req, res) => {
  res.send("🚨 Servidor Villa Segura funcionando");
});

// 🚀 START
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto " + PORT);
});
