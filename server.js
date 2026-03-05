import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";


const app = express();
app.use(express.json());

// 🔥 Firebase
if (process.env.PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.PROJECT_ID,
      clientEmail: process.env.CLIENT_EMAIL,
      privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
  console.log("✅ Firebase inicializado");
} else {
  console.log("❌ PRIVATE_KEY no definida");
}

// 📁 Servir carpeta public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚨 Ruta alerta
app.post("/send-alert", async (req, res) => {
  try {
    const { token } = req.body;

    const message = {
      notification: {
        title: "🚨 ALERTA DE EMERGENCIA",
        body: "Se ha activado el botón de emergencia",
      },
      token,
    };

    const response = await admin.messaging().send(message);

    console.log("✅ Notificación enviada:", response);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
    res.status(500).json({ success: false, error });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

