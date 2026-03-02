import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

// Necesario para usar __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================
// 🔐 VALIDACIÓN FIREBASE
// =============================
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("❌ ERROR: FIREBASE_SERVICE_ACCOUNT_JSON no está definida.");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} catch (err) {
  console.error("❌ ERROR parseando credenciales Firebase:", err);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 8080;

// =============================
// 📲 TOKENS EN MEMORIA
// =============================
let tokensRegistrados = [];

// =============================
// 📌 REGISTRAR TOKEN
// =============================
app.post("/registrar-token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token no proporcionado" });
  }

  if (!tokensRegistrados.includes(token)) {
    tokensRegistrados.push(token);
  }

  console.log("✅ Token registrado:", token);

  return res.status(200).json({ success: true });
});

// =============================
// 👤 REGISTRAR USUARIO
// =============================
app.post("/registrar-usuario", async (req, res) => {
  const { email, nombre, numeroCasa, tipoUsuario, estado } = req.body;

  if (!email || !nombre || !numeroCasa) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const nuevoUsuario = {
      email,
      nombre,
      numeroCasa,
      tipoUsuario: tipoUsuario || "vecino",
      estado: estado || "activo",
      fechaRegistro: new Date()
    };

    const docRef = await db.collection("usuarios").add(nuevoUsuario);

    console.log("👤 Usuario registrado:", docRef.id);

    return res.status(200).json({
      success: true,
      id: docRef.id
    });

  } catch (error) {
    console.error("❌ Error registrando usuario:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// =============================
// 🚨 EMERGENCIA INDIVIDUAL
// =============================
app.post("/emergencia", async (req, res) => {
  const { usuario, token } = req.body;

  if (!usuario || !usuario.nombre || !usuario.numeroCasa || !usuario.ubicacion) {
    return res.status(400).json({ error: "Datos incompletos del usuario" });
  }

  const mensajeTexto = `🚨 Emergencia
Usuario: ${usuario.nombre}
Casa: ${usuario.numeroCasa}
Ubicación: ${usuario.ubicacion.lat}, ${usuario.ubicacion.lng}`;

  const message = {
    notification: {
      title: "🚨 Emergencia",
      body: mensajeTexto
    },
    tokens: token ? [token] : tokensRegistrados
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    // Guardar en Firestore
    await db.collection("alertas").add({
      tipo: "emergencia",
      usuario: usuario.nombre,
      numeroCasa: usuario.numeroCasa,
      ubicacion: usuario.ubicacion,
      fecha: new Date()
    });

    console.log("✅ Emergencia enviada:", response);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Error enviando emergencia:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// =============================
// 📢 ALERTA GENERAL
// =============================
app.post("/alerta", async (req, res) => {
  const { titulo, mensaje, nivel } = req.body;

  if (!titulo || !mensaje) {
    return res.status(400).json({ error: "Faltan campos: titulo o mensaje" });
  }

  if (tokensRegistrados.length === 0) {
    return res.status(200).json({
      status: "ok",
      mensaje: "Alerta recibida, pero no hay tokens registrados"
    });
  }

  const message = {
    notification: {
      title: `🚨 ${titulo}`,
      body: mensaje
    },
    tokens: tokensRegistrados
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    // Guardar alerta en Firestore
    await db.collection("alertas").add({
      tipo: "general",
      titulo,
      mensaje,
      nivel: nivel || "medio",
      fecha: new Date()
    });

    console.log("✅ Alerta general enviada:", response);

    return res.status(200).json({
      status: "ok",
      mensaje: "Alerta enviada a todos los dispositivos"
    });

  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    return res.status(500).json({
      status: "error",
      error: error.message
    });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
);
