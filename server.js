import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_JSON || "{}");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Endpoint para guardar token de dispositivo
app.post("/guardar-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: "Token requerido" });

    await db.collection("tokens").doc(token).set({ token });
    console.log("📱 Token guardado:", token);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint para enviar alerta a todos los tokens
app.post("/alerta", async (req, res) => {
  try {
    const { tipo, nombre, telefono, casa } = req.body;
    if (!tipo || !nombre || !telefono || !casa)
      return res.status(400).json({ success: false, error: "Faltan datos" });

    // Guardar alerta en Firestore (opcional)
    const docRef = await db.collection("alerts").add({
      tipo,
      nombre,
      telefono,
      casa,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Enviar push a todos los tokens
    const tokensSnapshot = await db.collection("tokens").get();
    const tokens = tokensSnapshot.docs.map(doc => doc.id);
    if (tokens.length > 0) {
      const message = {
        notification: {
          title: `Alerta: ${tipo}`,
          body: `${nombre} - ${telefono} - ${casa}`,
        },
        data: { tipo, nombre, telefono, casa },
        tokens,
      };
      await admin.messaging().sendMulticast(message);
      console.log("✅ Alerta enviada a todos los dispositivos");
    }

    res.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Arrancar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT} ✅`);
});
