const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 👇 IMPORTANTE: sirve el frontend
app.use(express.static("public"));

// 👇 Ruta base
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// 👇 Ping de prueba
app.get("/ping", (req, res) => {
  res.send("pong 🟢");
});

// 🔥 Firebase config desde ENV (Render)
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 🧠 Guardar tokens en memoria (simple por ahora)
let tokens = [];

// 📲 Registrar token
app.post("/register", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token requerido" });
  }

  if (!tokens.includes(token)) {
    tokens.push(token);
    console.log("✅ Token registrado:", token);
  }

  res.json({ success: true });
});

// 🚨 Enviar alerta
app.post("/alerta", async (req, res) => {
  try {
    const {
      nombre = "Vecino",
      direccion = "Sin dirección",
      tipo = "Alerta",
      telefono = "Sin teléfono",
      villa = "Villa Segura",
    } = req.body;

    console.log("📤 Enviando alerta:", {
      nombre,
      direccion,
      tipo,
      telefono,
      villa,
    });

    if (tokens.length === 0) {
      return res.status(400).json({ error: "No hay dispositivos registrados" });
    }

    const message = {
      tokens,
      notification: {
        title: `🚨 ${tipo}`,
        body: `${nombre} - ${direccion}`,
      },
      data: {
        nombre,
        direccion,
        tipo,
        telefono,
        villa,
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("✅ Enviado:", response.successCount);

    res.json({
      success: true,
      enviados: response.successCount,
    });
  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// 🚀 Puerto Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});
