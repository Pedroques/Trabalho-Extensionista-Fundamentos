let eventos = [];
let servicos = [];

// Carregar dados do servidor
function carregarPrecos() {
    fetch("/public/assets/data/precos.json")
        .then(r => r.json())
        .then(data => {
            eventos = data.eventos;
            servicos = data.servicos;
            atualizarTabelas();
        })
        .catch(err => console.error("Erro ao carregar preços:", err));
}

// Renderizar tabelas
function atualizarTabelas() {
    const tEventos = document.getElementById("tabelaEventos");
    const tServicos = document.getElementById("tabelaServicos");

    tEventos.innerHTML = "";
    tServicos.innerHTML = "";

    eventos.forEach(e => {
        tEventos.innerHTML += `
            <tr>
                <td><input type="text" class="form-control" value="${e.nome}"
                    onchange="editarEvento(${e.id}, 'nome', this.value)"></td>

                <td><input type="number" class="form-control" value="${e.preco}"
                    onchange="editarEvento(${e.id}, 'preco', Number(this.value))"></td>

                <td>
                    <button class="btn btn-danger btn-sm" onclick="removerEvento(${e.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    servicos.forEach(s => {
        tServicos.innerHTML += `
            <tr>
                <td><input type="text" class="form-control" value="${s.nome}"
                    onchange="editarServico(${s.id}, 'nome', this.value)"></td>

                <td><input type="number" class="form-control" value="${s.preco}"
                    onchange="editarServico(${s.id}, 'preco', Number(this.value))"></td>

                <td>
                    <button class="btn btn-danger btn-sm" onclick="removerServico(${s.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

// Editar valores
function editarEvento(id, campo, valor) {
    eventos = eventos.map(e => e.id === id ? { ...e, [campo]: valor } : e);
}

function editarServico(id, campo, valor) {
    servicos = servicos.map(s => s.id === id ? { ...s, [campo]: valor } : s);
}

// Adicionar
function adicionarEvento() {
    eventos.push({ id: Date.now(), nome: "Novo Evento", preco: 0 });
    atualizarTabelas();
}

function adicionarServico() {
    servicos.push({ id: Date.now(), nome: "Novo Serviço", preco: 0 });
    atualizarTabelas();
}

// Remover
function removerEvento(id) {
    if (confirm("Deseja remover este evento?")) {
        eventos = eventos.filter(e => e.id !== id);
        atualizarTabelas();
    }
}

function removerServico(id) {
    if (confirm("Deseja remover este serviço?")) {
        servicos = servicos.filter(s => s.id !== id);
        atualizarTabelas();
    }
}

// Salvar no servidor
function salvarPrecos() {
    const dados = { eventos, servicos };

    fetch("/save-precos.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    })
    .then(r => r.text())
    .then(msg => alert(msg))
    .catch(err => alert("Erro ao salvar preços"));
}

// Carregar ao iniciar
carregarPrecos();