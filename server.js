import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json());

/* =========================================
   🔐 INICIALIZAR FIREBASE ADMIN
========================================= */

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* =========================================
   🟢 ENDPOINT TEST
========================================= */

app.get("/", (req, res) => {
  res.send("🔥 Servidor de alertas funcionando");
});

/* =========================================
   📲 REGISTRAR TOKEN
========================================= */

app.post("/registro", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).send("Token requerido");
    }

    await db.collection("tokens").doc(token).set({
      token: token,
      createdAt: new Date()
    });

    console.log("✅ Token guardado:", token);

    res.send("Token registrado");
  } catch (error) {
    console.error("❌ Error registrando token:", error);
    res.status(500).send("Error servidor");
  }
});

/* =========================================
   🚨 ENVIAR ALERTA (VERSIÓN PRO)
========================================= */

app.post("/alerta", async (req, res) => {
  try {
    const { tipo } = req.body;

    console.log("🚨 Nueva alerta:", tipo);

    const snapshot = await db.collection("tokens").get();

    if (snapshot.empty) {
      console.log("⚠️ No hay tokens registrados");
      return res.status(200).send("Sin dispositivos");
    }

    const tokens = [];

    snapshot.forEach(doc => {
      const data = doc.data();

      // 🔍 FILTRO ANTI-BASURA
      if (data.token && data.token.length > 20) {
        tokens.push(data.token);
      }
    });

    console.log("📡 Tokens válidos:", tokens.length);

    if (tokens.length === 0) {
      return res.status(200).send("Sin tokens válidos");
    }

    const message = {
      notification: {
        title: "🚨 ALERTA VECINAL",
        body: tipo
      },
      data: {
        tipo: tipo,
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      }
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      ...message
    });

    console.log("✅ Enviados:", response.successCount);
    console.log("❌ Fallidos:", response.failureCount);

    // 🧹 LIMPIAR TOKENS INVÁLIDOS (PRO LEVEL)
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error.code;

        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          const badToken = tokens[idx];

          db.collection("tokens").doc(badToken).delete();

          console.log("🧹 Token eliminado:", badToken);
        }
      }
    });

    res.send("Alerta enviada correctamente");

  } catch (error) {
    console.error("❌ Error enviando alerta:", error);
    res.status(500).send("Error servidor");
  }
});

/* =========================================
   🚀 INICIAR SERVIDOR
========================================= */

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
