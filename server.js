import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (error) { console.error("❌ Error parseando JSON:", error); }

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("🔥 Firebase OK");
}

// MEMORIA DE TOKENS Y USUARIOS
let usuarios = []; // {nombre, telefono, direccion, casaDepto, villa, token}

// FRONTEND
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));

// GUARDAR TOKEN + DATOS VECINO
app.post("/guardar-token", (req, res) => {
  const { token, nombre, telefono, direccion, casaDepto, villa } = req.body;
  if (!token || !nombre) return res.status(400).json({ error: "Datos incompletos" });

  const existente = usuarios.find(u => u.token === token);
  if (!existente) {
    usuarios.push({ token, nombre, telefono, direccion, casaDepto, villa });
    console.log("📱 Usuario guardado:", nombre, villa);
  } else {
    Object.assign(existente, { nombre, telefono, direccion, casaDepto, villa });
  }

  res.json({ ok: true });
});

// ENVIAR ALERTA A TODOS
app.post("/enviar-alerta", async (req, res) => {
  try {
    const { tipo, usuario } = req.body;

    if (usuarios.length === 0) return res.status(400).json({ error: "No hay usuarios registrados" });

    const mensaje = {
      notification: { 
        title: `🚨 ${tipo.toUpperCase()}`,
        body: `${usuario.nombre} - ${usuario.direccion} / ${usuario.casaDepto}`
      },
      data: { ...usuario, tipo },
      tokens: usuarios.map(u => u.token)
    };

    const response = await admin.messaging().sendEachForMulticast(mensaje);
    console.log(`✅ Alertas enviadas: ${response.successCount} de ${usuarios.length}`);
    res.json({ ok: true });

  } catch (error) { console.error("❌ Error:", error); res.status(500).json({ error: error.message }); }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
