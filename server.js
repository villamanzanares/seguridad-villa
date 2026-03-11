import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// Inicialización Firebase con la variable única
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware para servir archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Endpoints API
app.post("/guardar-token", async (req, res) => {
  const { token, usuario } = req.body;
  try {
    await admin.firestore().collection("tokens").doc(usuario).set({ token });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/alerta", async (req, res) => {
  const { tipo, usuario } = req.body;
  try {
    const tokensSnap = await admin.firestore().collection("tokens").get();
    const tokens = tokensSnap.docs.map(doc => doc.data().token);

    const message = {
      notification: {
        title: `Alerta: ${tipo}`,
        body: `Usuario: ${usuario}`
      },
      tokens
    };

    await admin.messaging().sendMulticast(message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Servir index.html en cualquier ruta desconocida
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Puerto
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server escuchando en puerto ${PORT}`));
