import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Inicializa Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync("./firebase-key.json", "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Registro de token
app.post("/guardar-token", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, msg: "No token" });
  try {
    await db.collection("tokens").doc(token).set({ createdAt: Date.now() });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Enviar alerta
app.post("/alerta", async (req, res) => {
  const { tipo, lat, lng } = req.body;

  if (!tipo || !lat || !lng) return res.status(400).json({ success: false, msg: "Faltan datos" });

  try {
    const tokensSnapshot = await db.collection("tokens").get();
    const tokens = tokensSnapshot.docs.map(doc => doc.id);

    const payload = {
      data: {
        tipo,
        lat: lat.toString(),
        lng: lng.toString()
      },
      notification: {
        title: `Alerta: ${tipo}`,
        body: `Ubicación: ${lat}, ${lng}`,
        icon: "/icon.png"
      }
    };

    await admin.messaging().sendToDevice(tokens, payload);

    // Guardar alerta en Firestore para radar
    await db.collection("alerts").add({ tipo, lat, lng, createdAt: Date.now() });

    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(process.env.PORT || 8080, () => console.log("Server corriendo en puerto 8080"));
