const express = require("express");
const admin = require("firebase-admin");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


/* REGISTRAR DISPOSITIVO */

app.post("/guardar-token", async (req, res) => {

  const token = req.body.token;

  if (!token) {
    console.log("Token vacío");
    return res.json({ ok:false });
  }

  try {

    await db.collection("tokens").doc(token).set({
      token: token,
      fecha: Date.now()
    });

    console.log("Token guardado:", token);

    res.json({ ok:true });

  } catch(err) {

    console.log("Error guardando token:", err);

    res.json({ ok:false });

  }

});


/* ENVIAR ALERTA */

app.post("/alerta", async (req, res) => {

  const { tipo, lat, lng } = req.body;

  console.log("ALERTA:", tipo, lat, lng);

  try {

    const snapshot = await db.collection("tokens").get();

    const tokens = [];

    snapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    console.log("Tokens encontrados:", tokens.length);

    if(tokens.length === 0){

      console.log("No hay dispositivos registrados");

      return res.json({ success:false });

    }

    const response = await admin.messaging().sendEachForMulticast({

      tokens: tokens,

      webpush: {
        notification: {
          title: "🚨 Villa Segura",
          body: "Alerta de " + tipo,
          icon: "/icon.png"
        }
      },

      data: {
        tipo: tipo,
        lat: String(lat),
        lng: String(lng)
      }

    });

    console.log("Enviados:", response.successCount);

    res.json({
      success:true,
      enviados:response.successCount
    });

  } catch(err){

    console.log("Error enviando alerta:", err);

    res.json({ success:false });

  }

});


const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log("Servidor corriendo en puerto", PORT);

});

