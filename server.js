import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 CONFIG FIREBASE DESDE VARIABLES DE ENTORNO
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("🔥 Firebase Admin inicializado OK");
} catch (error) {
  console.error("❌ Error inicializando Firebase:", error);
}

const db = admin.firestore();

let tokens = [];

// 🔔 GUARDAR TOKEN
app.post("/guardar-token", (req, res) => {
  try {
    const { token } = req.body;

    if (token && !tokens.includes(token)) {
      tokens.push(token);
      console.log("📱 Token guardado:", token);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error guardando token:", error);
    res.sendStatus(500);
  }
});

// 🚨 ENVIAR ALERTA
app.post("/enviar-alerta", async (req, res) => {
  try {
    const data = req.body;

    console.log("🚨 Enviando alerta:", data);

    if (!tokens.length) {
      console.log("⚠️ No hay tokens registrados");
      return res.sendStatus(200);
    }

    const message = {
      notification: {
        title: `🚨 ${data.tipo}`,
        body: `${data.nombre} - ${data.direccion}`,
      },
      data: {
        tipo: data.tipo || "",
        nombre: data.nombre || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("📩 Resultado envío:", response);

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.sendStatus(500);
  }
});

// 🚀 SERVER
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
