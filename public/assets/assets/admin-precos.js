let eventos = [];
let servicos = [];
let mesasCadeiras = [];

const API = "https://trabalho-extensionista-fundamentos-production.up.railway.app";

// Carregar preços do servidor
function carregarPrecos() {
    fetch(`${API}/precos`)
        .then(r => {
            if (!r.ok) throw new Error("Erro ao buscar preços");
            return r.json();
        })
        .then(data => {
            eventos = data.eventos || [];

            servicos = [];
            mesasCadeiras = [];

            (data.servicos || []).forEach(s => {
                if (s.incluidas !== undefined && s.extras !== undefined && s.preco_extra !== undefined) {
                    mesasCadeiras.push(s);
                } else {
                    servicos.push(s);
                }
            });

            atualizarTabelas();
        })
        .catch(err => console.error("Erro ao carregar preços:", err));
}

function atualizarTabelas() {
    const tEventos = document.getElementById("tabelaEventos");
    const tServicos = document.getElementById("tabelaServicos");
    const tMesas = document.getElementById("tabelaItens");

    tEventos.innerHTML = "";
    tServicos.innerHTML = "";
    tMesas.innerHTML = "";

    // EVENTOS
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

    // SERVIÇOS SIMPLES
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

    // MESAS E CADEIRAS
    mesasCadeiras.forEach(m => {
        tMesas.innerHTML += `
            <tr>
                <td>${m.nome}</td>

                <td><input type="number" class="form-control" value="${m.incluidas}"
                    onchange="editarMesas(${m.id}, 'incluidas', Number(this.value))"></td>

                <td><input type="number" class="form-control" value="${m.extras}"
                    onchange="editarMesas(${m.id}, 'extras', Number(this.value))"></td>

                <td><input type="number" class="form-control" value="${m.preco_extra}"
                    onchange="editarMesas(${m.id}, 'preco_extra', Number(this.value))"></td>

            </tr>
        `;
    });
}

// Editar
function editarEvento(id, campo, valor) {
    eventos = eventos.map(e => e.id === id ? { ...e, [campo]: valor } : e);
}

function editarServico(id, campo, valor) {
    servicos = servicos.map(s => s.id === id ? { ...s, [campo]: valor } : s);
}

function editarMesas(id, campo, valor) {
    mesasCadeiras = mesasCadeiras.map(m => m.id === id ? { ...m, [campo]: valor } : m);
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
    const dados = {
        eventos,
        servicos: [...servicos, ...mesasCadeiras] // junta tudo novamente
    };

    fetch(`${API}/precos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    })
        .then(r => r.json())
        .then(resp => {
            if (resp.status === "ok") {
                alert(resp.mensagem || "Preços atualizados!");
            } else {
                alert("Erro: " + (resp.mensagem || "Falha ao salvar"));
            }
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao salvar preços");
        });
}

carregarPrecos();