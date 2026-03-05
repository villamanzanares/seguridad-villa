import express from "express";
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* servir frontend */
app.use(express.static(path.join(__dirname, "public")));

/* inicializar Firebase */
try {

  const serviceAccount = {
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log("✅ Firebase inicializado");

} catch (error) {

  console.error("❌ Error inicializando Firebase:", error);

}

/* registrar token */
let tokens = [];

app.post("/register", (req, res) => {

  const token = req.body.token;

  if (!tokens.includes(token)) {
    tokens.push(token);
  }

  console.log("✅ Token registrado:", token);

  res.json({ success: true });

});

/* enviar emergencia */
app.post("/emergency", async (req, res) => {

  if (tokens.length === 0) {
    return res.json({ success: false, message: "No hay dispositivos registrados" });
  }

  const message = {

    notification: {
      title: "🚨 EMERGENCIA",
      body: "Un vecino ha presionado el botón de emergencia"
    },

    tokens: tokens

  };

  try {

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("✅ Notificación enviada:", response);

    res.json({ success: true, response });

  } catch (error) {

    console.error("❌ Error enviando notificación:", error);

    res.json({ success: false, error });

  }

});

/* puerto render */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log("🚀 Servidor corriendo en puerto", PORT);

});
