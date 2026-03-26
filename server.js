const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

/* 🔥 Firebase Admin */
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let tokens = [];

/* 📌 Registrar token */
app.post("/register", (req, res) => {
  const { token } = req.body;

  if (token && !tokens.includes(token)) {
    tokens.push(token);
    console.log("✅ Token registrado:", token);
  }

  res.sendStatus(200);
});

/* 🚨 Enviar alerta */
app.post("/alerta", async (req, res) => {
  const { nombre, direccion, tipo } = req.body;

  console.log("📥 Datos recibidos:", { nombre, direccion, tipo });

  const nombreFinal = nombre || "Usuario";
  const direccionFinal = direccion || "Ubicación no disponible";

  const message = {
    notification: {
      title: `🚨 ${tipo || "Alerta"}`,
      body: `${nombreFinal} - ${direccionFinal}`
    },
    data: {
      nombre: nombreFinal,
      direccion: direccionFinal,
      tipo: tipo || ""
    },
    tokens: tokens
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("📤 Notificaciones enviadas:", response.successCount);
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error enviando:", error);
    res.sendStatus(500);
  }
});

/* 🚀 Servidor */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
