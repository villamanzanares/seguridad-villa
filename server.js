import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import bodyParser from "body-parser";

// Validación de la variable de entorno
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("❌ ERROR: La variable FIREBASE_SERVICE_ACCOUNT_JSON no está definida.");
  process.exit(1); // Termina el proceso si no está configurada
}

// Parse seguro del JSON del service account
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

  // 🔹 Reemplaza los "\n" por saltos de línea reales en la private key
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

const PORT = process.env.PORT || 8080;

let tokensRegistrados = [];

// Registrar token en backend
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

  const mensajeTexto = `🚨 Emergencia!\nUsuario: ${usuario.nombre}\nCasa: ${usuario.casa}\nUbicación: ${usuario.ubicacion.lat},${usuario.ubicacion.lng}`;

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

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
