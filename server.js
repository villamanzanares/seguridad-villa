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
// 🧠 MEMORIA DE VECINOS Y VILLAS
// ===============================
let vecinos = []; // cada vecino: { nombre, telefono, direccion, casaDepto, villa, token }
let villas = ["Villa Manzanares"]; // lista inicial de villas

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
// 💾 GUARDAR TOKEN / DATOS VECINO
// ===============================
app.post("/guardar-token", (req, res) => {
  const { nombre, telefono, direccion, casaDepto, villa, token } = req.body;
  if (!nombre || !villa || !token) {
    return res.status(400).json({ error: "Nombre, villa y token son obligatorios" });
  }

  // Buscar vecino existente por token
  const index = vecinos.findIndex(v => v.token === token);
  if (index !== -1) {
    vecinos[index] = { nombre, telefono, direccion, casaDepto, villa, token };
    console.log("🔄 Vecino actualizado:", nombre);
  } else {
    vecinos.push({ nombre, telefono, direccion, casaDepto, villa, token });
    console.log("📱 Vecino registrado:", nombre);
  }

  res.json({ ok: true });
});

// ===============================
// 🚨 ENVIAR ALERTA A VILLA ESPECIFICA
// ===============================
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo, usuario } = req.body;

    if (!usuario || !usuario.villa) return res.status(400).json({ error: "Usuario o villa inválida" });

    // Filtrar tokens de vecinos de la misma villa
    const tokensVilla = vecinos
      .filter(v => v.villa === usuario.villa)
      .map(v => v.token);

    if (tokensVilla.length === 0) return res.status(400).json({ error: "No hay dispositivos registrados en esta villa" });

    const mensaje = {
      notification: {
        title: `🚨 ${tipo.toUpperCase()}`,
        body: `${usuario.nombre} - ${usuario.direccion}`,
      },
      data: {
        nombre: usuario.nombre || "",
        telefono: usuario.telefono || "",
        direccion: usuario.direccion || "",
        casaDepto: usuario.casaDepto || "",
        villa: usuario.villa || "",
        tipo: tipo || "",
        sonido: "sirena",
      },
      tokens: tokensVilla,
    };

    const response = await admin.messaging().sendEachForMulticast(mensaje);
    console.log(`✅ Alertas enviadas (${usuario.villa}):`, response.successCount);
    res.json({ ok: true });

  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// 📄 LISTA DE VILLAS
// ===============================
app.get("/villas", (req, res) => {
  res.json({ villas });
});

// ===============================
// ➕ AGREGAR VILLA (SUPER USUARIO)
// ===============================
app.post("/agregar-villa", (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Nombre de villa obligatorio" });

  if (!villas.includes(nombre)) {
    villas.push(nombre);
    console.log("🏘 Villa agregada:", nombre);
  }

  res.json({ ok: true });
});

// ===============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});
