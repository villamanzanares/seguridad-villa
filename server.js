import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

// __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validar variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("❌ ERROR: La variable FIREBASE_SERVICE_ACCOUNT_JSON no está definida.");
  process.exit(1);
}

// Parse del JSON de service account
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} catch (err) {
  console.error("❌ ERROR: No se pudo parsear FIREBASE_SERVICE_ACCOUNT_JSON:", err);
  process.exit(1);
}

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 8080;

// 🔹 Array temporal de tokens registrados
let tokensRegistrados = [];

// Registrar token
app.post("/registrar-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token no proporcionado" });

  if (!tokensRegistrados.includes(token)) tokensRegistrados.push(token);
  console.log("✅ Token registrado:", token);
  return res.status(200).json({ success: true });
});

// Enviar alerta de emergencia
app.post("/emergencia", async (req, res) => {
  const { usuario, token } = req.body;

  if (!usuario || !usuario.nombre || !usuario.casa || !usuario.ubicacion) {
    return res.status(400).json({ error: "Datos incompletos del usuario" });
  }

  const mensajeTexto = `🚨 Emergencia!
Usuario: ${usuario.nombre}
Casa: ${usuario.casa}
Ubicación: ${usuario.ubicacion.lat},${usuario.ubicacion.lng}`;

  const tokensEnviar = token ? [token] : tokensRegistrados;

  if (tokensEnviar.length === 0) {
    return res.status(400).json({ error: "No hay dispositivos registrados" });
  }

  const message = {
    notification: { title: "🚨 Emergencia", body: mensajeTexto },
    tokens: tokensEnviar
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("✅ Notificación enviada:", response);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
