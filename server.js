import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔥 Inicializar Firebase Admin desde variable de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 🧠 Guardamos tokens en memoria (simple por ahora)
let tokens = [];

// 📌 Registrar dispositivo
app.post("/registro-token", (req, res) => {
  const { token } = req.body;

  if (token && !tokens.includes(token)) {
    tokens.push(token);
    console.log("📱 Token registrado:", token);
  }

  res.json({ ok: true });
});

// 🚨 Enviar alerta
app.post("/enviar-alerta", async (req, res) => {
  const data = req.body;

  console.log("🚨 Alerta recibida:", data);

  if (tokens.length === 0) {
    return res.json({ ok: true, enviados: 0 });
  }

  try {
    const message = {
      notification: {
        title: "🚨 Alerta vecinal",
        body: data.tipo
      },
      data: {
        tipo: data.tipo || "",
        nombre: data.nombre || "Vecino",
        telefono: data.telefono || "No disponible",
        direccion: data.direccion || "-",
        villa: data.villa || "-",
        lat: String(data.lat || ""),
        lng: String(data.lng || "")
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("✅ Enviados:", response.successCount);

    res.json({
      ok: true,
      enviados: response.successCount
    });

  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).json({ error: "Error enviando alerta" });
  }
});

// 🚀 Levantar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Servidor corriendo en puerto", PORT));
