const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Permitir requisições do frontend
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, "public")));

// Diretórios da galeria
const GALERIA_JSON = path.join(__dirname, "public/assets/data/galeria.json");
const IMG_DIR = path.join(__dirname, "public/assets/img");
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

// Config multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMG_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `foto_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Funções utilitárias
function lerGaleria() {
  if (!fs.existsSync(GALERIA_JSON)) return [];
  try { return JSON.parse(fs.readFileSync(GALERIA_JSON, "utf-8")); }
  catch { return []; }
}
function salvarGaleria(galeria) {
  fs.writeFileSync(GALERIA_JSON, JSON.stringify(galeria, null, 2));
}

// Rotas da galeria
app.post("/upload", upload.array("fotos[]"), (req, res) => {
  const galeria = lerGaleria();
  req.files.forEach(f => galeria.push(`/assets/img/${f.filename}`));
  salvarGaleria(galeria);
  res.json({ status: "ok", galeria });
});

app.post("/substituir", upload.single("foto"), (req, res) => {
  const { old } = req.body;
  if (!old || !req.file) return res.json({ status: "erro", mensagem: "Dados incompletos" });

  const galeria = lerGaleria();
  const index = galeria.indexOf(old);
  if (index === -1) return res.json({ status: "erro", mensagem: "Imagem não encontrada" });

  const oldPath = path.join(__dirname, "public", old); 
  try {
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  } catch (err) {
    console.error("Erro ao remover imagem antiga:", err);
  }

  galeria[index] = `/assets/img/${req.file.filename}`;
  salvarGaleria(galeria);
  res.json({ status: "ok", galeria });
});

app.post("/excluir", (req, res) => {
  const { excluir } = req.body;
  if (!excluir) return res.json({ status: "erro", mensagem: "Nenhum arquivo informado" });

  const galeria = lerGaleria();
  const index = galeria.indexOf(excluir);
  if (index === -1) return res.json({ status: "erro", mensagem: "Imagem não encontrada" });

  const filePath = path.join(__dirname, "public", excluir);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);


  galeria.splice(index, 1);
  salvarGaleria(galeria);
  res.json({ status: "ok", galeria });
});

// Rotas de preços
const PRECOS_JSON = path.join(__dirname, "public/assets/data/precos.json");

app.get("/precos", (req, res) => {
  if (!fs.existsSync(PRECOS_JSON)) return res.json({ eventos: [], servicos: [] });
  try { res.json(JSON.parse(fs.readFileSync(PRECOS_JSON, "utf-8"))); }
  catch { res.json({ eventos: [], servicos: [] }); }
});

app.post("/precos", (req, res) => {
  const dados = req.body;
  if (!dados || !dados.eventos || !dados.servicos)
    return res.status(400).json({ status: "erro", mensagem: "Dados inválidos" });

  fs.writeFileSync(PRECOS_JSON, JSON.stringify(dados, null, 2));
  res.json({ status: "ok", mensagem: "Preços atualizados com sucesso!" });
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));