import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import path from "path";

// 🔥 IMPORTANTE PARA RENDER
const __dirname = new URL('.', import.meta.url).pathname;

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 SERVIR ARCHIVOS DESDE /public
app.use(express.static(path.join(__dirname, "public")));

// 🔥 FORZAR INDEX REAL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔥 FIREBASE ADMIN
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🔔 GUARDAR TOKEN
app.post("/guardar-token", async (req, res) => {
  try {
    const { token } = req.body;

    await db.collection("tokens").add({
      token,
      createdAt: new Date()
    });

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error guardando token" });
  }
});

// 🚨 ENVIAR ALERTA
app.post("/enviar-alerta", async (req, res) => {
  try {
    const data = req.body;

    // 🔥 guardar alerta
    await db.collection("alertas").add({
      ...data,
      fecha: new Date()
    });

    // 🔥 obtener tokens
    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: `🚨 ${data.tipo}`,
          body: `${data.nombre} - ${data.direccion}`
        },
        data: {
          tipo: data.tipo || "",
          nombre: data.nombre || "",
          telefono: data.telefono || "",
          direccion: data.direccion || ""
        }
      });
    }

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error enviando alerta" });
  }
});

// 🚀 START
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
