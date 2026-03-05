import express from "express";
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json());

/* rutas de directorio */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* servir frontend */
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   INICIALIZAR FIREBASE
========================= */

try {

  if (!process.env.PROJECT_ID) {
    console.log("❌ PROJECT_ID no definido");
  }

  if (!process.env.CLIENT_EMAIL) {
    console.log("❌ CLIENT_EMAIL no definido");
  }

  if (!process.env.PRIVATE_KEY) {
    console.log("❌ PRIVATE_KEY no definida");
  }

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

  console.log("❌ Error inicializando Firebase:", error);

}

/* =========================
   REGISTRAR TELEFONO
========================= */

app.post("/register", async (req, res) => {

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      ok: false,
      error: "Token no recibido"
    });
  }

  try {

    await admin.messaging().subscribeToTopic(token, "alertas");

    console.log("✅ Token registrado:", token);

    res.json({
      ok: true,
      mensaje: "Token registrado"
    });

  } catch (error) {

    console.log("❌ Error registrando token:", error);

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

/* =========================
   BOTON EMERGENCIA
========================= */

app.post("/emergency", async (req, res) => {

  try {

    const message = {
      notification: {
        title: "🚨 EMERGENCIA",
        body: "Se ha activado una alerta"
      },
      topic: "alertas"
    };

    const response = await admin.messaging().send(message);

    console.log("✅ Notificación enviada:", response);

    res.json({
      ok: true,
      mensaje: "Notificación enviada"
    });

  } catch (error) {

    console.log("❌ Error enviando emergencia:", error);

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

/* =========================
   RUTA PRINCIPAL
========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* =========================
   INICIAR SERVIDOR
========================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
