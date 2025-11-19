let fotos = [];

// Carregar fotos do JSON
function carregarFotos() {
    return fetch("/public/assets/data/galeria.json")
        .then(r => r.json())
        .then(data => {
            fotos = data.map((url, index) => ({
                id: index + 1,
                url: url
            }));
            atualizarGaleria();
        });
}


function salvarGaleria() {
    const lista = fotos.map(f => f.url);

    fetch("/public/assets/data/salvar_galeria.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(lista)
    })
    .then(r => r.text())
    .then(res => {
        alert("Galeria atualizada com sucesso!");
    });
}

// Upload (apenas front-end)
function uploadFotos() {
    const input = document.getElementById("inputFotos");
    let files = Array.from(input.files);

    if (files.length === 0) {
        alert("Selecione ao menos uma foto.");
        return;
    }

    files.forEach(file => {
        const url = URL.createObjectURL(file);

        fotos.push({
            id: Date.now() + Math.random(),
            url: url
        });
    });

    input.value = "";
    atualizarGaleria();
    salvarGaleria();
}

// Excluir imagem
function excluirFoto(id) {
    if (confirm("Deseja excluir esta foto da galeria?")) {
        fotos = fotos.filter(f => f.id !== id);
        atualizarGaleria();
        salvarGaleria();
    }
}

// Inicializar
carregarFotos();