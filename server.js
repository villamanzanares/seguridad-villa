import express from "express";
import admin from "firebase-admin";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

import serviceAccount from "./alerta-rosko-firebase-adminsdk-fbsvc-3cffb57e10.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post("/api/alerta", async (req, res) => {
  const { token } = req.body;

  const message = {
    notification: {
      title: "Alerta Rosko 🚨",
      body: "Se ha presionado el botón de emergencia"
    },
    token
  };

  try {
    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo"));