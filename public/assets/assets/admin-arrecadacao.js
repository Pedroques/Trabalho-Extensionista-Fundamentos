const API = "https://trabalho-extensionista-fundamentos-production.up.railway.app";

async function carregarArrecadacao() {
    try {
        const response = await fetch(`${API}/reservas`);
        if (!response.ok) throw new Error("Erro ao carregar reservas");

        const reservas = await response.json();
        const arrecadacao = calcularPorMes(reservas);

        preencherTabela(arrecadacao);

    } catch (e) {
        console.error(e);
        alert("Erro ao carregar arrecadação.");
    }
}

function calcularPorMes(reservas) {
    const dados = {};

    reservas.forEach(r => {
        if (r.status !== "confirmada") return;

        const data = new Date(r.data);
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");

        const chave = `${mes}/${ano}`;

        if (!dados[chave]) dados[chave] = 0;
        dados[chave] += r.total;
    });

    return dados;
}

function preencherTabela(arrecadacao) {
    const tabela = document.getElementById("tabelaArrecadacao");
    tabela.innerHTML = "";

    const mesesOrdenados = Object.keys(arrecadacao).sort();

    mesesOrdenados.forEach(mes => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${mes}</td>
            <td>R$ ${arrecadacao[mes].toLocaleString("pt-BR")}</td>
        `;
        tabela.appendChild(tr);
    });
}

carregarArrecadacao();