let reservas = [];
const API = "https://trabalho-extensionista-fundamentos-production.up.railway.app";

// Carregar reservas do servidor
async function carregarReservas() {
    try {
        const response = await fetch(`${API}/reservas`);
        if (!response.ok) throw new Error("Falha ao carregar reservas");
        reservas = await response.json();
        atualizarTabela();
    } catch (error) {
        console.error("Erro ao carregar reservas:", error);
        alert("Erro ao carregar reservas. Veja o console para detalhes.");
    }
}

// Atualizar tabela
function atualizarTabela(lista = reservas) {
    const tabela = document.getElementById("reservasTabela");
    tabela.innerHTML = "";

    lista.forEach(reserva => {
        const badge = {
            pendente: '<span class="badge bg-warning">Pendente</span>',
            confirmada: '<span class="badge bg-success">Confirmada</span>',
            cancelada: '<span class="badge bg-danger">Cancelada</span>'
        }[reserva.status];

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${reserva.nome}</td>
            <td>${reserva.evento}</td>
            <td>${reserva.data}</td>
            <td>${reserva.horario}</td>
            <td>${badge}</td>
            <td></td>
        `;

        const tdAcoes = tr.querySelector("td:last-child");

        // Botão confirmar
        if (reserva.status !== "confirmada") {
            const btnConfirmar = document.createElement("button");
            btnConfirmar.className = "btn btn-success btn-sm me-2";
            btnConfirmar.innerHTML = '<i class="bi bi-check-lg"></i>';
            btnConfirmar.addEventListener("click", () => confirmarReserva(reserva.id));
            tdAcoes.appendChild(btnConfirmar);
        }

        // Botão cancelar
        if (reserva.status !== "cancelada") {
            const btnCancelar = document.createElement("button");
            btnCancelar.className = "btn btn-danger btn-sm";
            btnCancelar.innerHTML = '<i class="bi bi-x-lg"></i>';
            btnCancelar.addEventListener("click", () => cancelarReserva(reserva.id));
            tdAcoes.appendChild(btnCancelar);
        }

        tabela.appendChild(tr);
    });
}

// Confirmar reserva
async function confirmarReserva(id) {
    reservas = reservas.map(r =>
        r.id === id ? { ...r, status: "confirmada" } : r
    );

    atualizarTabela();

    await salvarAlteracoes();

    alert("Reserva confirmada! A data agora está bloqueada.");
}

// Cancelar reserva (LIBERA A DATA)
async function cancelarReserva(id) {
    reservas = reservas.map(r =>
        r.id === id ? { ...r, status: "cancelada" } : r
    );

    atualizarTabela();

    await salvarAlteracoes();

    alert("Reserva cancelada! A data foi liberada.");
}

// Salvar alterações no servidor
async function salvarAlteracoes() {
    try {
        const res = await fetch(`${API}/reservas/atualizar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reservas)
        });

        const json = await res.json();

        if (json.status !== "ok") {
            alert("Erro ao salvar alterações no servidor!");
        }
    } catch (err) {
        console.error("Erro ao salvar reservas:", err);
        alert("Erro ao salvar alterações.");
    }
}

// Filtrar reservas por data
function filtrarReservas() {
    const inicio = document.getElementById("dataInicial").value;
    const fim = document.getElementById("dataFinal").value;

    if (!inicio || !fim) {
        alert("Selecione as duas datas para filtrar.");
        return;
    }

    const filtrado = reservas.filter(r => r.data >= inicio && r.data <= fim);
    atualizarTabela(filtrado);
}

// Carregar ao iniciar
carregarReservas();