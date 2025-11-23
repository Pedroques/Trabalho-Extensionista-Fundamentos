// admin-galeria.js
// Gerencia galeria: carregar, enviar, excluir e substituir

const API = "https://trabalho-extensionista-fundamentos-production.up.railway.app";
let fotos = [];

// Carrega galeria do servidor
async function carregarFotos() {
    try {
        const res = await fetch(`${API}/galeria`);
        if (!res.ok) throw new Error(`Falha ao buscar galeria: ${res.status}`);

        fotos = await res.json();
        atualizarGaleria();
    } catch (err) {
        console.error("Erro ao carregar galeria:", err);
        fotos = [];
        atualizarGaleria();
    }
}

function atualizarGaleria() {
    const container = document.getElementById("galeriaContainer");
    container.innerHTML = "";

    fotos.forEach((url, index) => {
        const col = document.createElement("div");
        col.className = "col-6 col-md-4 col-lg-3 mb-4";

        const inputId = `file-sub-${index}`;

        col.innerHTML = `
            <div class="card shadow-sm">
                <img src="${url}" class="card-img-top" alt="Foto ${index+1}">
                <div class="card-body text-center">
                    <div class="d-flex justify-content-center">
                        <button class="btn btn-danger btn-sm btn-action" onclick="excluirFoto('${encodeURIComponent(url)}')">
                            <i class="bi bi-trash"></i> Excluir
                        </button>
                        <button class="btn btn-warning btn-sm btn-action" onclick="triggerSubstituir('${inputId}')">
                            <i class="bi bi-arrow-repeat"></i> Substituir
                        </button>
                    </div>
                </div>
            </div>
            <input type="file" id="${inputId}" class="d-none" accept="image/*"
                onchange="uploadSubstituicao(event, ${index})" />
        `;

        container.appendChild(col);
    });
}

// Botão Enviar Fotos
document.getElementById("btnUpload").addEventListener("click", uploadFotos);

// Upload de novas fotos
async function uploadFotos() {
    const input = document.getElementById("inputFotos");
    const files = input.files;

    if (!files || files.length === 0) {
        alert("Selecione ao menos uma imagem.");
        return;
    }

    const status = document.getElementById("uploadStatus");
    status.textContent = "Enviando...";
    status.style.color = "#f3b76a";

    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
        fd.append("fotos[]", files[i]);
    }

    try {
        const res = await fetch(`${API}/upload`, {
            method: "POST",
            body: fd
        });

        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const json = await res.json();

        if (json.status === "ok") {
            fotos = json.galeria;
            atualizarGaleria();
            alert("Fotos enviadas com sucesso!");
        } else {
            alert("Erro: " + (json.mensagem || "Resposta inválida"));
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao enviar imagens. Veja console.");
    } finally {
        status.textContent = "";
        status.style.color = "";
        input.value = "";
    }
}

// Excluir foto
async function excluirFoto(encodedUrl) {
    const url = decodeURIComponent(encodedUrl);
    if (!confirm("Deseja excluir esta imagem permanentemente?")) return;

    try {
        const res = await fetch(`${API}/excluir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ excluir: url })
        });

        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const json = await res.json();

        if (json.status === "ok") {
            fotos = json.galeria;
            atualizarGaleria();
        } else {
            alert("Erro ao excluir: " + (json.mensagem || "Resposta inválida"));
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao excluir imagem.");
    }
}

// Abrir input para substituir
function triggerSubstituir(inputId) {
    document.getElementById(inputId)?.click();
}

// Substituir foto
async function uploadSubstituicao(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm("Confirma substituir esta imagem? A imagem antiga será removida.")) {
        event.target.value = "";
        return;
    }

    const fd = new FormData();
    fd.append("foto", file);
    fd.append("old", fotos[index]);

    try {
        const res = await fetch(`${API}/substituir`, {
            method: "POST",
            body: fd
        });

        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const json = await res.json();

        if (json.status === "ok") {
            fotos = json.galeria;
            atualizarGaleria();
            alert("Imagem substituída com sucesso!");
        } else {
            alert("Erro ao substituir: " + json.mensagem);
        }
    } catch (err) {
        console.error(err);
        alert("Erro na substituição.");
    } finally {
        event.target.value = "";
    }
}

carregarFotos();