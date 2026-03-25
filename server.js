import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// ===============================
// 🔥 CONFIGURAR FIREBASE
// ===============================
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (error) {
  console.error("❌ Error parseando FIREBASE_SERVICE_ACCOUNT_JSON:", error);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("🔥 Firebase inicializado");
} else {
  console.log("⚠️ Firebase NO inicializado");
}

// ===============================
// 📁 RUTAS Y FRONTEND
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// carpeta public
app.use(express.static(path.join(__dirname, "public")));

// ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===============================
// 🚨 ENDPOINT DE ALERTA
// ===============================
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { token, titulo, nombre, telefono, ubicacion } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Falta token" });
    }

    const mensaje = {
      token: token,
      notification: {
        title: titulo || "🚨 Alerta",
        body: `${nombre || "Vecino"} - ${ubicacion || "Ubicación desconocida"}`,
      },
      data: {
        nombre: nombre || "",
        telefono: telefono || "",
        ubicacion: ubicacion || "",
        sonido: "sirena",
      },
    };

    const response = await admin.messaging().send(mensaje);

    console.log("✅ Alerta enviada:", response);
    res.json({ ok: true, response });

  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// 🚀 INICIAR SERVIDOR
// ===============================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
