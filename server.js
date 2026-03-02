import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

// Necesario para usar __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validar variable de entorno
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("❌ ERROR: La variable FIREBASE_SERVICE_ACCOUNT_JSON no está definida.");
  process.exit(1);
}

// Parsear JSON de service account
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  // reemplazar saltos de línea escapados en la private_key
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} catch (err) {
  console.error("❌ ERROR: No se pudo parsear FIREBASE_SERVICE_ACCOUNT_JSON:", err);
  process.exit(1);
}

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 8080;

// Array para almacenar tokens registrados
let tokensRegistrados = [];

// 🔹 Registrar token
app.post("/registrar-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token no proporcionado" });

  if (!tokensRegistrados.includes(token)) tokensRegistrados.push(token);
  console.log("✅ Token registrado:", token);

  return res.status(200).json({ success: true });
});

// 🔹 Enviar alerta de emergencia
app.post("/emergencia", async (req, res) => {
  const { usuario, token } = req.body;

  if (!usuario || !usuario.nombre || !usuario.casa || !usuario.ubicacion) {
    return res.status(400).json({ error: "Datos incompletos del usuario" });
  }

  if (tokensRegistrados.length === 0 && !token) {
    return res.status(400).json({ error: "No hay dispositivos registrados" });
  }

  const mensajeTexto = `🚨 Emergencia!
Usuario: ${usuario.nombre}
Casa: ${usuario.casa}
Ubicación: ${usuario.ubicacion.lat},${usuario.ubicacion.lng}`;

  const message = {
    notification: { title: "🚨 Emergencia", body: mensajeTexto },
    tokens: token ? [token] : tokensRegistrados
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log("✅ Notificación enviada:", response);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 🔹 Endpoint /alerta que envía notificaciones a todos los tokens registrados
app.post("/alerta", async (req, res) => {
  const { titulo, mensaje, nivel, fecha } = req.body;

  if (!titulo || !mensaje) {
    return res.status(400).json({ error: "Faltan campos: titulo o mensaje" });
  }

  console.log("📢 Alerta recibida:", { titulo, mensaje, nivel, fecha });

  if (tokensRegistrados.length === 0) {
    return res.status(200).json({ status: "ok", mensaje: "Alerta recibida, pero no hay tokens registrados" });
  }

  const message = {
    notification: { title: `🚨 ${titulo}`, body: mensaje },
    tokens: tokensRegistrados
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log("✅ Notificación enviada a tokens registrados:", response);
    return res.status(200).json({ status: "ok", mensaje: "Alerta enviada a todos los dispositivos" });
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
    return res.status(500).json({ status: "error", error: error.message });
  }
});

// Servir la app
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
