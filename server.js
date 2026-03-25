import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// ===============================
// 🔥 FIREBASE
// ===============================
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (error) {
  console.error("❌ Error parseando JSON:", error);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("🔥 Firebase OK");
}

// ===============================
// 🧠 MEMORIA DE TOKENS POR VILLA
// ===============================
let vecinos = []; // {nombre, telefono, direccion, casaDepto, villa, token}

// ===============================
// 🏠 VILLAS DISPONIBLES
// ===============================
let villas = ["Villa Manzanares"];

// ===============================
// 📁 FRONTEND
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ===============================
// 💾 GUARDAR TOKEN + DATOS VECINO
// ===============================
app.post("/guardar-token", (req, res) => {
  const { nombre, telefono, direccion, casaDepto, villa, token } = req.body;

  if (!nombre || !villa || !token) {
    return res.status(400).json({ error: "Nombre, Villa y Token requeridos" });
  }

  const existing = vecinos.find(v => v.token === token);
  if (!existing) {
    vecinos.push({ nombre, telefono, direccion, casaDepto, villa, token });
    console.log("📱 Vecino registrado:", nombre, "Villa:", villa);
  }

  res.json({ ok: true });
});

// ===============================
// 🚨 ENVIAR ALERTA SOLO A VILLA
// ===============================
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo, usuario } = req.body;

    if (!usuario || !usuario.villa) {
      return res.status(400).json({ error: "Usuario o Villa inválido" });
    }

    const villaVecinos = vecinos.filter(v => v.villa === usuario.villa);
    const tokens = villaVecinos.map(v => v.token);

    if (tokens.length === 0) {
      return res.status(400).json({ error: "No hay dispositivos registrados en la villa" });
    }

    const mensaje = {
      notification: {
        title: tipo,
        body: `${usuario.nombre} - ${usuario.direccion}`
      },
      data: usuario,
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(mensaje);
    console.log(`✅ Alertas enviadas a Villa ${usuario.villa}:`, response.successCount);

    res.json({ ok: true });
  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// 📋 LISTAR VILLAS
// ===============================
app.get("/villas", (req, res) => {
  res.json({ villas });
});

// ===============================
// ➕ AGREGAR VILLA (SUPER USUARIO)
// ===============================
app.post("/agregar-villa", (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Nombre obligatorio" });

  if (!villas.includes(nombre)) {
    villas.push(nombre);
    console.log("🏘 Nueva Villa agregada:", nombre);
  }

  res.json({ ok: true });
});

// ===============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
