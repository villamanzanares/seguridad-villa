import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// servir archivos public
app.use(express.static(path.join(__dirname, "public")));

// servir sonidos
app.use("/sounds", express.static(path.join(__dirname, "public/sounds")));

console.log("Servidor iniciado correctamente");

// guardar tokens
const tokens = [];

// registrar token
app.post("/register-token", (req, res) => {

  const { token } = req.body;

  if (token && !tokens.includes(token)) {
    tokens.push(token);
  }

  console.log("Tokens registrados:", tokens.length);

  res.json({
    success: true
  });

});

// recibir alerta
app.post("/send-alert", (req, res) => {

  const { type } = req.body;

  console.log("ALERTA RECIBIDA:", type);

  res.json({
    success: true,
    messageId: "SIMULADO"
  });

});

// puerto
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Servidor escuchando en puerto", PORT);
});
