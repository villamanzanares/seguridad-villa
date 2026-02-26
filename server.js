import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import bodyParser from "body-parser";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

let tokensRegistrados = [];

app.post("/registrar-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token no proporcionado" });

  if (!tokensRegistrados.includes(token)) tokensRegistrados.push(token);
  console.log("✅ Token registrado:", token);

  return res.status(200).json({ success: true });
});

app.post("/emergencia", async (req, res) => {
  const { usuario, token } = req.body;

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
