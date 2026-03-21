import express from "express";
import admin from "firebase-admin";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Firebase seguro
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// 📲 Guardar token
app.post("/guardar-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) return res.status(400).send("No token");

    await db.collection("tokens").doc(token).set({ token });

    res.send({ ok: true });

  } catch (e) {
    console.error(e);
    res.status(500).send("Error guardando token");
  }
});

// 🚨 Enviar alerta
app.post("/alerta", async (req, res) => {
  try {
    const { tipo } = req.body;

    const snapshot = await db.collection("tokens").get();

    const tokens = snapshot.docs.map(doc => doc.data().token);

    if (!tokens.length) {
      return res.status(400).send("No hay tokens");
    }

    const message = {
      notification: {
        title: `🚨 ${tipo}`,
        body: "Alerta vecinal activada"
      },
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("Enviados:", response.successCount);

    res.send({ ok: true });

  } catch (e) {
    console.error("ERROR ALERTA:", e);
    res.status(500).send("Error enviando alerta");
  }
});

app.listen(8080, () => {
  console.log("Servidor corriendo en puerto 8080");
});
