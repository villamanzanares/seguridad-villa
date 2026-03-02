import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Inicializar Firebase Admin
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.log("❌ ENV no definida");
  process.exit(1);
}

let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.log("❌ Error parseando FIREBASE_SERVICE_ACCOUNT:", error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("✅ Firebase inicializado correctamente");

const db = admin.firestore();

// ======================================================
// 🔎 VALIDAR VILLA
// ======================================================
app.post("/validar-villa", async (req, res) => {
  const { codigoVilla } = req.body;

  if (!codigoVilla) {
    return res.status(400).json({
      success: false,
      error: "Código requerido",
    });
  }

  try {
    const villaRef = db.collection("villas").doc(codigoVilla);
    const villaSnap = await villaRef.get();

    if (!villaSnap.exists || villaSnap.data().estado !== "activa") {
      return res.status(400).json({
        success: false,
        error: "Código inválido o villa inactiva",
      });
    }

    res.json({
      success: true,
      nombreVilla: villaSnap.data().nombre,
    });
  } catch (error) {
    console.error("Error validando villa:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ======================================================
// 👤 REGISTRAR USUARIO
// ======================================================
app.post("/registrar-usuario", async (req, res) => {
  const { nombre, email, numeroCasa, tipoUsuario, codigoVilla } = req.body;

  if (!nombre || !numeroCasa || !codigoVilla) {
    return res.status(400).json({
      success: false,
      error: "Datos incompletos",
    });
  }

  try {
    const nuevoUsuario = await db.collection("usuarios").add({
      nombre,
      email: email || "",
      numeroCasa,
      tipoUsuario: tipoUsuario || "residente",
      codigoVilla,
      estado: "activo",
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      idUsuario: nuevoUsuario.id,
    });
  } catch (error) {
    console.error("Error registrando usuario:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ======================================================
// 📲 REGISTRAR TOKEN FCM
// ======================================================
app.post("/registrar-token", async (req, res) => {
  const { token, idUsuario } = req.body;

  if (!token || !idUsuario) {
    return res.status(400).json({
      success: false,
      error: "Token o idUsuario faltante",
    });
  }

  try {
    await db.collection("usuarios").doc(idUsuario).update({
      tokenFCM: token,
    });

    console.log("✅ Token guardado para usuario:", idUsuario);

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error guardando token:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ======================================================
// 🚨 ENVIAR EMERGENCIA
// ======================================================
app.post("/emergencia", async (req, res) => {
  const { idUsuario, ubicacion } = req.body;

  if (!idUsuario || !ubicacion) {
    return res.status(400).json({
      success: false,
      error: "Datos incompletos del usuario",
    });
  }

  try {
    const usuarioRef = db.collection("usuarios").doc(idUsuario);
    const usuarioSnap = await usuarioRef.get();

    if (!usuarioSnap.exists) {
      return res.status(400).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const usuario = usuarioSnap.data();

    const usuariosSnap = await db
      .collection("usuarios")
      .where("codigoVilla", "==", usuario.codigoVilla)
      .where("estado", "==", "activo")
      .get();

    const tokens = [];

    usuariosSnap.forEach((doc) => {
      const data = doc.data();
      if (data.tokenFCM) tokens.push(data.tokenFCM);
    });

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No hay dispositivos registrados",
      });
    }

    await db.collection("alertas").add({
      idUsuario,
      nombre: usuario.nombre,
      numeroCasa: usuario.numeroCasa,
      codigoVilla: usuario.codigoVilla,
      ubicacion,
      fecha: admin.firestore.FieldValue.serverTimestamp(),
    });

    const message = {
      notification: {
        title: "🚨 EMERGENCIA",
        body: `${usuario.nombre} - Casa ${usuario.numeroCasa}`,
      },
      tokens: tokens,
    };

    await admin.messaging().sendEachForMulticast(message);

    console.log("🚨 Emergencia enviada correctamente");

    res.json({ success: true });
  } catch (error) {
    console.error("Error enviando emergencia:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ======================================================
// 🚀 INICIAR SERVIDOR
// ======================================================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
