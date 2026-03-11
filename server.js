import express from "express";
import admin from "firebase-admin";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Inicialización Firebase con la variable única
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Endpoints
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server escuchando en puerto ${PORT}`));
