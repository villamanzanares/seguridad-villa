import express from "express";
import admin from "firebase-admin";

const app = express();
app.use(express.json());
app.use(express.static("public"));

// 🔥 Inicializar Firebase Admin desde variable de entorno
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (error) {
  console.error("❌ Error parseando FIREBASE_SERVICE_ACCOUNT_JSON");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("Firebase Admin inicializado ✅");

// 🚨 ENDPOINT PARA ENVIAR ALERTA
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo } = req.body;

    if (!tipo) {
      return res.status(400).json({ error: "Falta tipo de alerta" });
    }

    // 🔍 Obtener tokens desde Firestore
    const snapshot = await db.collection("tokens").get();

    const tokens = [];
    snapshot.forEach(doc => {
      tokens.push(doc.id); // usamos el ID como token
    });

    if (tokens.length === 0) {
      console.log("⚠️ No hay tokens registrados");
      return res.json({
        id: Date.now(),
        enviado: 0
      });
    }

    // 📩 Construir mensaje
    const message = {
  notification: {
    title: "🚨 Alerta vecinal",
    body: data.tipo
  },
  data: {
    tipo: data.tipo,
    nombre: data.nombre || "Vecino",
    telefono: data.telefono || "No disponible",
    direccion: data.direccion || "-",
    villa: data.villa || "-",
    lat: String(data.lat || ""),
    lng: String(data.lng || "")
  },
  tokens: tokens
};

    // 🚀 Enviar a todos
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("📤 Enviado a:", tokens.length);
    console.log("✅ Success:", response.successCount);
    console.log("❌ Fail:", response.failureCount);

    // 🔁 Limpiar tokens inválidos
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.log("❌ Token inválido:", tokens[idx]);
        db.collection("tokens").doc(tokens[idx]).delete();
      }
    });

    // ✅ RESPUESTA PARA EL FRONT
    res.json({
      id: Date.now(),
      enviado: response.successCount
    });

  } catch (error) {
    console.error("🔥 Error enviando alerta:", error);
    res.status(500).json({ error: "Error enviando alerta" });
  }
});

// 🚀 LEVANTAR SERVIDOR
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
