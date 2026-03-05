import express from "express";
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* servir frontend */
app.use(express.static(path.join(__dirname, "public")));

/* ---------------------------
   INICIALIZAR FIREBASE
--------------------------- */

let firebaseReady = false;

try {

  if (!process.env.PROJECT_ID || !process.env.CLIENT_EMAIL || !process.env.PRIVATE_KEY) {
    throw new Error("Faltan variables de entorno de Firebase");
  }

  const serviceAccount = {
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

   console.log("🔥 Firebase inicializado OK");

  firebaseReady = true;
  console.log("✅ Firebase inicializado correctamente");

} catch (error) {

  console.error("❌ Error inicializando Firebase:", error.message);

}

/* ---------------------------
   ALMACENAR TOKENS
--------------------------- */

const tokens = new Set();

app.post("/registrar-token", (req, res) => {

  const { token } = req.body;

  if (!token) {
    return res.json({ success: false, error: "Token vacío" });
  }

  tokens.add(token);

  console.log("📱 Token registrado:", token);

  res.json({ success: true, totalTokens: tokens.size });

});

/* ---------------------------
   ALERTA DE EMERGENCIA
--------------------------- */

app.post("/emergency", async (req, res) => {

  if (!firebaseReady) {
    return res.json({
      success: false,
      error: "Firebase no está inicializado"
    });
  }

  try {

    const { usuario, tipo } = req.body;

    const message = {
      notification: {
        title: "🚨 ALERTA VECINAL",
        body: `${usuario?.nombre || "Vecino"} activó una alerta`
      },
      tokens: Array.from(tokens)
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("📢 Notificaciones enviadas:", response.successCount);

    res.json({
      success: true,
      enviados: response.successCount
    });

  } catch (error) {

    console.error("❌ Error enviando alerta:", error);

    res.json({
      success: false,
      error: error.message
    });

  }

});

/* ---------------------------
   SERVIDOR
--------------------------- */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

