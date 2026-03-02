import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

// ===== CONFIGURACIÓN BASE =====

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const PORT = process.env.PORT || 10000;

let tokensRegistrados = [];

// ======================================================
// 🔹 REGISTRAR TOKEN
// ======================================================

app.post("/registrar-token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: "Token no proporcionado" });
  }

  if (!tokensRegistrados.includes(token)) {
    tokensRegistrados.push(token);
  }

  console.log("✅ Token registrado:", token);

  res.json({ success: true });
});

// ======================================================
// 🔹 EMERGENCIA
// ======================================================

app.post("/emergencia", async (req, res) => {
  console.log("📥 BODY RECIBIDO EN /emergencia:", req.body);

  const { usuario } = req.body;

  if (
    !usuario ||
    !usuario.nombre ||
    !usuario.casa ||
    !usuario.ubicacion ||
    usuario.ubicacion.lat === undefined ||
    usuario.ubicacion.lng === undefined
  ) {
    return res.status(400).json({
      success: false,
      error: "Datos incompletos del usuario"
    });
  }

  if (tokensRegistrados.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No hay dispositivos registrados"
    });
  }

  const mensajeTexto = `🚨 Emergencia
Usuario: ${usuario.nombre}
Casa: ${usuario.casa}
Ubicación: ${usuario.ubicacion.lat}, ${usuario.ubicacion.lng}`;

  const message = {
    notification: {
      title: "🚨 Emergencia",
      body: mensajeTexto
    },
    tokens: tokensRegistrados
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("✅ Notificación enviada:", response);

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======================================================
// 🔹 ALERTA GENERAL
// ======================================================

app.post("/alerta", async (req, res) => {
  const { titulo, mensaje } = req.body;

  if (!titulo || !mensaje) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos: titulo o mensaje"
    });
  }

  if (tokensRegistrados.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No hay tokens registrados"
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
    console.log("✅ Alerta enviada:", response);

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======================================================
// 🔹 VALIDAR VILLA
// ======================================================

app.post("/validar-villa", async (req, res) => {
  const { codigoVilla } = req.body;

  if (!codigoVilla) {
    return res.status(400).json({ success: false, error: "Código requerido" });
  }

  const villaRef = db.collection("villas").doc(codigoVilla);
  const villaSnap = await villaRef.get();

  if (!villaSnap.exists || villaSnap.data().estado !== "activa") {
    return res.status(400).json({
      success: false,
      error: "Código inválido o villa inactiva"
    });
  }

  res.json({
    success: true,
    nombreVilla: villaSnap.data().nombre
  });
});

// ======================================================
// 🔹 REGISTRAR USUARIO
// ======================================================

app.post("/registrar-usuario", async (req, res) => {
  const { nombre, numeroCasa, email, tipoUsuario, codigoVilla } = req.body;

  if (!nombre || !numeroCasa || !email || !codigoVilla) {
    return res.status(400).json({
      success: false,
      error: "Faltan datos obligatorios"
    });
  }

  const villaRef = db.collection("villas").doc(codigoVilla);
  const villaSnap = await villaRef.get();

  if (!villaSnap.exists || villaSnap.data().estado !== "activa") {
    return res.status(400).json({
      success: false,
      error: "Villa inválida o inactiva"
    });
  }

  const nuevoUsuario = {
    nombre,
    numeroCasa,
    email,
    tipoUsuario: tipoUsuario || "residente",
    codigoVilla,
    estado: "activo",
    fechaCreacion: admin.firestore.FieldValue.serverTimestamp()
  };

  const usuarioRef = await db.collection("usuarios").add(nuevoUsuario);

  console.log("✅ Usuario creado:", usuarioRef.id);

  res.json({
    success: true,
    idUsuario: usuarioRef.id,
    nombreVilla: villaSnap.data().nombre
  });
});

// ======================================================

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
