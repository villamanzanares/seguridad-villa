import express from "express";
import admin from "firebase-admin";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

/* -------------------------
   INICIALIZAR FIREBASE
------------------------- */

let firebaseReady = false;

try {

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  firebaseReady = true;
  console.log("🔥 Firebase inicializado correctamente");

} catch (error) {

  console.error("❌ Error inicializando Firebase:", error.message);

}

/* -------------------------
   TOKENS
------------------------- */

const tokens = new Set();

app.post("/registrar-token", (req, res) => {

  const { token } = req.body;

  if (!token) {
    return res.json({ success: false });
  }

  tokens.add(token);

  console.log("📱 Token registrado:", token);

  res.json({ success: true });

});

/* -------------------------
   ALERTA
------------------------- */

app.post("/emergency", async (req, res) => {

  if (!firebaseReady) {
    return res.json({
      success: false,
      error: "Firebase no inicializado"
    });
  }

  try {

    const message = {
      notification: {
        title: "🚨 ALERTA VECINAL",
        body: "Un vecino activó la alarma"
      },
      tokens: Array.from(tokens)
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("📢 Enviadas:", response.successCount);

    res.json({
      success: true,
      enviados: response.successCount
    });

  } catch (error) {

    console.error("❌ Error enviando alerta:", error);

    res.json({
      success: false,
      error: error.message
    });

  }

});

/* -------------------------
   SERVIDOR
------------------------- */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
