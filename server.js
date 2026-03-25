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
try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON); }
catch (error) { console.error("❌ Error parseando JSON:", error); }

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("🔥 Firebase OK");
}

// ===============================
// 🧠 MEMORIA DE TOKENS MULTI-DISPOSITIVO
// ===============================
let tokens = []; // { token, nombre }

// ===============================
// 📁 FRONTEND
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// Evitar cache del SW
app.use('/firebase-messaging-sw.js', (req,res,next)=>{
  res.setHeader('Cache-Control','no-cache');
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ===============================
// 💾 GUARDAR TOKEN
// ===============================
app.post("/guardar-token", (req, res) => {
  const { token, nombre } = req.body;
  if (!token) return res.status(400).json({ error: "Token requerido" });

  if (!tokens.find(t => t.token === token)) {
    tokens.push({ token, nombre: nombre || "Desconocido" });
    console.log("📱 Token guardado:", token, "Nombre:", nombre || "Desconocido");
  }

  res.json({ ok: true });
});

// ===============================
// 🚨 ENVIAR ALERTA A TODOS
// ===============================
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { titulo, nombre, telefono, ubicacion, dispositivo } = req.body;

    if (tokens.length === 0) return res.status(400).json({ error: "No hay dispositivos registrados" });

    const mensaje = {
      notification: {
        title: titulo || "🚨 ALERTIA",
        body: `${nombre || dispositivo || "Vecino"} - ${ubicacion || "Ubicación"}`,
      },
      data: { nombre, telefono, ubicacion, sonido: "sirena" },
      tokens: tokens.map(t => t.token),
    };

    const response = await admin.messaging().sendEachForMulticast(mensaje);

    console.log(`✅ Alertas enviadas desde: ${dispositivo || "Desconocido"}`, "Éxito:", response.successCount);
    res.json({ ok: true });

  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
