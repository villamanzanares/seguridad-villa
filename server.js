import express from "express";
import admin from "firebase-admin";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let serviceAccount = null;

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("ENV no definida");
  } else {
    console.log("ENV detectada");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
} catch (error) {
  console.error("Error parseando JSON:", error);
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase inicializado");
} else {
  console.log("Firebase NO inicializado");
}

app.get("/", (req, res) => {
  res.send("Servidor activo 🚀");
});

app.post("/api/alerta", async (req, res) => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: "Firebase no inicializado" });
  }

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
app.listen(PORT, () => console.log("Servidor corriendo en puerto", PORT));
