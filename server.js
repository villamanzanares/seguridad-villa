import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

// =============================
// CONFIGURACIÓN BASE
// =============================

// Necesario para usar __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validar variable de entorno
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("❌ ERROR: FIREBASE_SERVICE_ACCOUNT_JSON no definida.");
  process.exit(1);
}

// Parse seguro del service account
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} catch (err) {
  console.error("❌ ERROR parseando credenciales Firebase:", err);
  process.exit(1);
}

// Inicializar Firebase Admin
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
// VARIABLES EN MEMORIA
// =============================

let tokensRegistrados = [];

// =============================
// ENDPOINTS
// =============================

// 🔹 Registrar token FCM
app.post("/registrar-token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: "Token no proporcionado" });
  }

  if (!tokensRegistrados.includes(token)) {
    tokensRegistrados.push(token);
  }

  console.log("✅ Token registrado:", token);
  return res.status(200).json({ success: true });
});


// 🔹 Validar código de villa
app.post("/validar-villa", async (req, res) => {
  const { codigoVilla } = req.body;

  if (!codigoVilla) {
    return res.status(400).json({ success: false, error: "Código no proporcionado" });
  }

  try {
    const villaRef = db.collection("villas").doc(codigoVilla);
    const villaSnap = await villaRef.get();

    if (!villaSnap.exists || villaSnap.data().estado !== "activa") {
      return res.status(400).json({
        success: false,
        error: "Código inválido o villa inactiva"
      });
    }

    return res.status(200).json({
      success: true,
      nombreVilla: villaSnap.data().nombre
    });

  } catch (error) {
    console.error("❌ Error validando villa:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// 🔹 Registrar usuario en villa
app.post("/registrar-usuario", async (req, res) => {
  const { nombre, numeroCasa, email, tipoUsuario, codigoVilla } = req.body;

  if (!nombre || !numeroCasa || !email || !codigoVilla) {
    return res.status(400).json({
      success: false,
      error: "Faltan datos obligatorios"
    });
  }

  try {
    // Verificar villa
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

    return res.status(200).json({
      success: true,
      idUsuario: usuarioRef.id,
      nombreVilla: villaSnap.data().nombre
    });

  } catch (error) {
    console.error("❌ Error registrando usuario:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// 🔹 Enviar emergencia
app.post("/emergencia", async (req, res) => {
  const { usuario, token } = req.body;

  if (!usuario || !usuario.nombre || !usuario.numeroCasa || !usuario.ubicacion) {
    return res.status(400).json({
      success: false,
      error: "Datos incompletos del usuario"
    });
  }

  const mensajeTexto = `🚨 Emergencia!
Usuario: ${usuario.nombre}
Casa: ${usuario.numeroCasa}
Ubicación: ${usuario.ubicacion.lat},${usuario.ubicacion.lng}`;

  const tokens = token ? [token] : tokensRegistrados;

  if (!tokens || tokens.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No hay tokens registrados"
    });
  }

  const message = {
    notification: {
      title: "🚨 Emergencia",
      body: mensajeTexto
    },
    tokens
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("✅ Notificación enviada:", response);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// 🔹 Enviar alerta general
app.post("/alerta", async (req, res) => {
  const { titulo, mensaje } = req.body;

  if (!titulo || !mensaje) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos: titulo o mensaje"
    });
  }

  if (tokensRegistrados.length === 0) {
    return res.status(200).json({
      success: true,
      mensaje: "Alerta recibida pero no hay tokens registrados"
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

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// =============================
// START SERVER
// =============================

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
