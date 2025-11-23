const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ========================== DIRETÓRIOS E ARQUIVOS ==========================
const DATA_DIR = path.join(__dirname, "public/assets/data");
const IMG_DIR = path.join(__dirname, "public/assets/img");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

const GALERIA_JSON = path.join(DATA_DIR, "galeria.json");
const PRECOS_JSON = path.join(DATA_DIR, "precos.json");
const RESERVAS_JSON = path.join(DATA_DIR, "reservas.json");

if (!fs.existsSync(GALERIA_JSON)) fs.writeFileSync(GALERIA_JSON, "[]");
if (!fs.existsSync(PRECOS_JSON)) fs.writeFileSync(PRECOS_JSON, "[]");
if (!fs.existsSync(RESERVAS_JSON)) fs.writeFileSync(RESERVAS_JSON, "[]");

// ========================== MIDDLEWARES ==========================
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));
app.use(express.json());

// ========================== FUNÇÕES UTILITÁRIAS ==========================
function lerJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); }
    catch { return []; }
}

function salvarJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ========================== NORMALIZAR DATA ==========================
function normalizarData(dataStr) {
    if (!dataStr) return dataStr;

    // 2025-01-15 OK
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return dataStr;

    // Remover horários
    if (dataStr.includes("T")) {
        return dataStr.split("T")[0];
    }

    // 15/01/2025 → 2025-01-15
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
        const [dia, mes, ano] = dataStr.split("/");
        return `${ano}-${mes}-${dia}`;
    }

    return dataStr;
}

// ========================== MULTER ==========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMG_DIR),
    filename: (req, file, cb) =>
        cb(null, `foto_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// ========================== ROTAS ==========================

// -------- GALERIA --------
app.post("/upload", upload.array("fotos[]"), (req, res) => {
    const galeria = lerJSON(GALERIA_JSON);
    req.files.forEach(f => galeria.push(`/assets/img/${f.filename}`));
    salvarJSON(GALERIA_JSON, galeria);
    res.json({ status: "ok", galeria });
});

app.get("/galeria", (req, res) => {
    const galeria = lerJSON(GALERIA_JSON);
    res.json(galeria);
});

app.post("/substituir", upload.single("foto"), (req, res) => {
    const { old } = req.body;
    if (!req.file) return res.json({ status: "erro", mensagem: "Nenhuma imagem enviada." });

    const galeria = lerJSON(GALERIA_JSON);
    const index = galeria.indexOf(old);
    if (index === -1) return res.json({ status: "erro", mensagem: "Imagem não existe." });

    const oldPath = path.join(IMG_DIR, path.basename(old));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

    galeria[index] = `/assets/img/${req.file.filename}`;
    salvarJSON(GALERIA_JSON, galeria);

    res.json({ status: "ok", galeria });
});

app.post("/excluir", (req, res) => {
    const { excluir } = req.body;
    if (!excluir) return res.json({ status: "erro", mensagem: "Nenhum arquivo informado." });

    const galeria = lerJSON(GALERIA_JSON);
    const index = galeria.indexOf(excluir);
    if (index === -1) return res.json({ status: "erro", mensagem: "Imagem não encontrada." });

    const filePath = path.join(IMG_DIR, path.basename(excluir));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    galeria.splice(index, 1);
    salvarJSON(GALERIA_JSON, galeria);

    res.json({ status: "ok", galeria });
});

// -------- PREÇOS --------
app.get("/precos", (req, res) => {
    const data = lerJSON(PRECOS_JSON);
    res.json(data);
});

app.post("/precos", (req, res) => {
    const dados = req.body;
    if (!dados.eventos || !dados.servicos)
        return res.status(400).json({ status: "erro", mensagem: "Dados inválidos" });

    salvarJSON(PRECOS_JSON, dados);
    res.json({ status: "ok", mensagem: "Preços atualizados com sucesso!" });
});

// -------- RESERVAS --------
app.get("/reservas", (req, res) => {
    const reservas = lerJSON(RESERVAS_JSON);
    res.json(reservas);
});

// Atualiza TODAS
app.post("/reservas/atualizar", (req, res) => {
    const novasReservas = req.body;
    if (!Array.isArray(novasReservas))
        return res.status(400).json({
            status: "erro",
            mensagem: "Formato inválido. Esperado array de reservas."
        });

    salvarJSON(RESERVAS_JSON, novasReservas);
    res.json({ status: "ok", mensagem: "Reservas atualizadas com sucesso!" });
});

// -------- NOVA RESERVA --------
app.post("/reservas", (req, res) => {
    const reservas = lerJSON(RESERVAS_JSON);
    const novaReserva = req.body;

    if (!novaReserva.nome || !novaReserva.email || !novaReserva.evento) {
        return res.status(400).json({
            status: "erro",
            mensagem: "Dados incompletos para criar reserva."
        });
    }

    // NORMALIZA A DATA
    if (novaReserva.data)
        novaReserva.data = normalizarData(novaReserva.data);

    // Gera novo ID
    novaReserva.id = reservas.length > 0
        ? reservas[reservas.length - 1].id + 1
        : 1;

    novaReserva.status = "pendente";

    reservas.push(novaReserva);
    salvarJSON(RESERVAS_JSON, reservas);

    res.json({
        status: "ok",
        mensagem: "Reserva salva com sucesso!",
        reserva: novaReserva
    });
});

// ========================== SERVIR IMAGENS MANUALMENTE (Railway) ==========================
app.get("/assets/img/:file", (req, res) => {
    const filePath = path.join(IMG_DIR, req.params.file);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("Imagem não encontrada");
    }

    res.sendFile(filePath);
});

// ========================== STATIC SEMPRE POR ÚLTIMO ==========================
app.use(express.static(path.join(__dirname, "public")));

// ========================== INICIAR SERVIDOR ==========================
app.listen(PORT, () =>
    console.log(`API rodando na porta ${PORT}`)
);