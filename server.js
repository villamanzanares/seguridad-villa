const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const app = express();
app.use(bodyParser.json());

// 🔥 Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// =============================
// 📲 Guardar token
// =============================
app.post("/guardar-token", async (req, res) => {
  const { token } = req.body;

  try {
    await db.collection("tokens").doc(token).set({ token });
    console.log("✅ Token guardado:", token);
    res.send({ ok: true });
  } catch (e) {
    console.error("❌ Error guardando token:", e);
    res.status(500).send({ ok: false });
  }
});

// =============================
// 🚨 Enviar alerta
// =============================
app.post("/alerta", async (req, res) => {
  const { tipo, nombre, direccion, telefono } = req.body;

  try {
    console.log(`🚨 Nueva alerta: ${tipo}`);

    // 🔹 Obtener tokens
    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.data().token);

    console.log(`📡 Enviando a ${tokens.length} dispositivos`);

    if (tokens.length === 0) {
      return res.send({ status: "sin tokens" });
    }

    // 🔥 MENSAJE CORREGIDO (data + notification)
    const message = {
      tokens: tokens,
      notification: {
        title: "🚨 ALERTA VILLA SEGURA",
        body: `${tipo} reportado por ${nombre}`
      },
      data: {
        tipo: tipo || "",
        nombre: nombre || "",
        direccion: direccion || "",
        telefono: telefono || ""
      }
    };

    // 🔹 Enviar
    const response = await admin.messaging().sendMulticast(message);

    console.log(`✅ Enviados: ${response.successCount}`);
    console.log(`❌ Fallidos: ${response.failureCount}`);

    // 🔍 Log detallado
    response.responses.forEach((r, i) => {
      if (!r.success) {
        console.log(`❌ Token inválido: ${tokens[i]}`);
        console.log(r.error);
      }
    });

    // 🔥 Guardar alerta para el footer en tiempo real
    await db.collection("alertas").add({
      tipo,
      nombre,
      direccion,
      telefono,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.send({ status: "ok" });

  } catch (e) {
    console.error("❌ Error enviando alerta:", e);
    res.status(500).send("Error enviando alerta");
  }
});

// =============================
// 🚀 Iniciar servidor
// =============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
