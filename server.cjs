const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let tokens = [];

app.post("/guardar-token", (req, res) => {

  const token = req.body.token;

  if (!token) {
    console.log("Token vacío recibido");
    return res.json({ ok: false });
  }

  if (!tokens.includes(token)) {
    tokens.push(token);
    console.log("Nuevo dispositivo:", token);
  }

  console.log("Tokens registrados:", tokens.length);

  res.json({ ok: true });

});


app.post("/alerta", async (req, res) => {

  const { tipo, lat, lng } = req.body;

  console.log("ALERTA:", tipo, lat, lng);

  if (tokens.length === 0) {
    console.log("No hay dispositivos registrados");
    return res.json({ success: false, motivo: "sin tokens" });
  }

  try {

    const response = await admin.messaging().sendEachForMulticast({

      tokens: tokens,

      notification: {
        title: "🚨 Villa Segura",
        body: "Alerta de " + tipo
      },

      data: {
        tipo: tipo,
        lat: String(lat),
        lng: String(lng)
      }

    });

    console.log("Enviados:", response.successCount);

    res.json({
      success: true,
      enviados: response.successCount
    });

  } catch (error) {

    console.log("Error FCM:", error);

    res.json({
      success: false
    });

  }

});


const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
