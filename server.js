import express from "express";
import cors from "cors";
import admin from "firebase-admin";

console.log("🔥 VERSION NUEVA SERVER 🔥");

// ===============================
// INICIALIZAR FIREBASE
// ===============================

let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (error) {
  console.error("❌ Error leyendo FIREBASE_SERVICE_ACCOUNT_JSON");
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase inicializado");
} else {
  console.log("❌ Firebase NO inicializado");
}

// ===============================
// APP EXPRESS
// ===============================

const app = express();
app.use(cors());
app.use(express.json());

const tokens = [];

// ===============================
// REGISTRAR TOKEN
// ===============================

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

// ===============================
// ENVIAR NOTIFICACIÓN
// ===============================

app.post("/send", async (req, res) => {
  if (tokens.length === 0) {
    return res.status(400).json({ error: "No hay tokens registrados" });
  }

  try {
    const response = await admin.messaging().send({
      token: tokens[0], // enviamos a uno para depurar
      notification: {
        title: "🚨 EMERGENCIA",
        body: "Se ha activado el botón de emergencia",
      },
    });

    console.log("✅ ENVÍO EXITOSO:", response);
    res.json({ success: true, response });

  } catch (error) {
    console.error("❌ ERROR REAL:", error);
    res.status(500).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }
});

// ===============================
// INICIAR SERVIDOR
// ===============================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
