import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// 🔥 Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (error) {
  console.error("❌ Error parseando JSON:", error);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("🔥 Firebase Admin OK");
}

// 📁 Frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));

// 💾 Guardar token en Firestore
app.post("/guardar-token", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token requerido" });

  try {
    const docRef = admin.firestore().collection("tokens").doc(token);
    await docRef.set({ createdAt: Date.now() });
    console.log("📱 Token guardado:", token);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 🚨 Enviar alerta
app.post("/enviar-alerta", async (req, res) => {
  const { titulo, nombre, telefono, ubicacion } = req.body;
  try {
    const snapshot = await admin.firestore().collection("tokens").get();
    if (snapshot.empty) return res.status(400).json({ error: "No hay tokens registrados" });

    const tokens = snapshot.docs.map(doc => doc.id);
    const mensaje = {
      notification: { title: titulo, body: `${nombre || "Vecino"} - ${ubicacion || "Ubicación"}` },
      data: { nombre, telefono, ubicacion, sonido: "sirena" },
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(mensaje);
    console.log("✅ Alertas enviadas:", response.successCount);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error enviando alerta:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
