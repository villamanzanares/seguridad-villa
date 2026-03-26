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
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("🔥 Firebase OK");
}

// ===============================
// 🧠 MEMORIA DE USUARIOS Y VILLAS
// ===============================
let usuarios = []; // { nombre, telefono, direccion, casaDepto, villa, token }
let villas = ["Villa Manzanares"]; // lista de villas disponibles

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
// 💾 GUARDAR TOKEN / USUARIO
// ===============================
app.post("/guardar-token", (req, res) => {
  const u = req.body;
  if (!u.token || !u.nombre || !u.villa) return res.status(400).json({ error: "Datos incompletos" });

  const index = usuarios.findIndex(x => x.token === u.token);
  if (index === -1) {
    usuarios.push(u);
    console.log("📱 Usuario registrado:", u.nombre, "Villa:", u.villa);
  } else {
    usuarios[index] = u; // actualizar datos
  }

  res.json({ ok: true });
});

// ===============================
// 🚨 ENVIAR ALERTA SOLO A VILLA
// ===============================
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo, usuario } = req.body;
    if (!usuario || !usuario.villa) return res.status(400).json({ error: "Usuario sin villa" });

    const destinatarios = usuarios.filter(u => u.villa === usuario.villa && u.token);
    if (destinatarios.length === 0) return res.status(400).json({ error: "No hay usuarios en la villa" });

    const mensaje = {
      notification: {
        title: tipo || "🚨 ALERTA",
        body: `${usuario.nombre} - ${usuario.direccion}`,
      },
      data: usuario,
      tokens: destinatarios.map(u => u.token),
    };

    const response = await admin.messaging().sendEachForMulticast(mensaje);
    console.log("✅ Alertas enviadas:", response.successCount);
    res.json({ ok: true });

  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// 🏠 ENDPOINTS VILLAS
// ===============================
app.get("/villas", (req, res) => {
  res.json({ villas });
});

app.post("/agregar-villa", (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Nombre de villa requerido" });
  if (!villas.includes(nombre)) villas.push(nombre);
  res.json({ ok: true, villas });
});

// ===============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
