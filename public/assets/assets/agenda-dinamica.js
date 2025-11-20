let dataAtual = new Date();
let datasIndisponiveis = [];

// ============================
// 1) CARREGAR PREÇOS E SERVIÇOS DO JSON
// ============================
async function carregarPrecos() {
  const res = await fetch("data/precos.json");
  const precos = await res.json();

  // Preencher tipos de evento
  const tipoEvento = document.getElementById("tipoEvento");
  tipoEvento.innerHTML = "";
  precos.eventos.forEach(ev => {
    const option = document.createElement("option");
    option.value = ev.preco;
    option.textContent = `${ev.nome} – R$ ${ev.preco}`;
    tipoEvento.appendChild(option);
  });

  // Preencher serviços
  const servicosDiv = document.getElementById("listaServicos");
  servicosDiv.innerHTML = "";
  precos.servicos.forEach(serv => {
    if (serv.nome.includes("Rechaud")) return; 

    servicosDiv.innerHTML += `
      <label>
        <input type="checkbox" class="serv" data-price="${serv.preco}" />
        ${serv.nome} – R$ ${serv.preco}
      </label><br>
    `;
  });

  // Rechaud
  const rechaudSelect = document.getElementById("rechaud");
  const rechaudItem = precos.servicos.find(s => s.nome.includes("Rechaud"));
  rechaudSelect.innerHTML = `
    <option value="0">Nenhum (R$ 0)</option>
    <option value="${rechaudItem.preco}">${rechaudItem.nome} – R$ ${rechaudItem.preco}</option>
  `;

  atualizarTotal();
}

// ============================
// 2) CARREGAR DATAS BLOQUEADAS DO JSON
// ============================
async function carregarDatas() {
  const res = await fetch("data/reservas.json");
  const reservas = await res.json();

  datasIndisponiveis = reservas.map(r => r.data);
}

// ============================
// 3) GERAR CALENDÁRIO
// ============================
function mudarMes(direcao) {
  dataAtual.setMonth(dataAtual.getMonth() + direcao);
  gerarCalendario();
}

function gerarCalendario() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  const hoje = new Date();

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  document.getElementById("mesAno").textContent = `${meses[mes]} de ${ano}`;

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();

  const tabela = document.createElement("table");
  tabela.className = "table text-center";

  let linha = document.createElement("tr");

  for (let i = 0; i < primeiroDia; i++) 
    linha.appendChild(document.createElement("td"));

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const td = document.createElement("td");
    td.textContent = dia;
    td.classList.add("day");

    const dataISO = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const dataObj = new Date(dataISO);

    const bloqueada = dataObj < hoje || datasIndisponiveis.includes(dataISO);

    if (bloqueada) {
      td.classList.add("disabled");
    } else {
      td.addEventListener("click", () => selecionarDia(td, dataISO));
    }

    linha.appendChild(td);

    if ((dia + primeiroDia) % 7 === 0) {
      tabela.appendChild(linha);
      linha = document.createElement("tr");
    }
  }

  tabela.appendChild(linha);
  calendar.appendChild(tabela);
}

function selecionarDia(td, dataISO) {
  if (td.classList.contains("disabled")) return;

  document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
  td.classList.add("selected");

  const dataBR = dataISO.split("-").reverse().join("/");
  document.getElementById("tituloData").textContent =
    `1. Selecione a Data — Escolhida: ${dataBR}`;

  td.dataset.selecionado = dataISO;
}

// ============================
// 4) CÁLCULO TOTAL
// ============================
function atualizarTotal() {
  const valorEvento = Number(document.getElementById("tipoEvento").value);

  let totalServicos = 0;
  document.querySelectorAll(".serv:checked").forEach(s => {
    totalServicos += Number(s.dataset.price);
  });

  totalServicos += Number(document.getElementById("rechaud").value);

  document.getElementById("valorLocacaoResumo").textContent = valorEvento;
  document.getElementById("valorLocacaoResumoTotal").textContent = valorEvento;
  document.getElementById("servicosValor").textContent = totalServicos;

  document.getElementById("totalValor").textContent = valorEvento + totalServicos;
}

document.addEventListener("change", e => {
  if (e.target.classList.contains("serv") ||
      e.target.id === "rechaud" ||
      e.target.id === "tipoEvento") {
    atualizarTotal();
  }
});

// ============================
// 5) WHATSAPP
// ============================
function enviarWhatsApp() {
  const numero = "5531996784862";

  const dia = document.querySelector(".day.selected");
  if (!dia) return alert("Selecione uma data.");

  const dataISO = dia.dataset.selecionado;
  const dataBR = dataISO.split("-").reverse().join("/");

  const horario = document.getElementById("horario").value;
  if (!horario) return alert("Selecione o horário.");

  const tipoEventoTexto = document.getElementById("tipoEvento").selectedOptions[0].text;
  const valorEvento = document.getElementById("valorLocacaoResumo").innerText;

  let servicos = [];
  document.querySelectorAll(".serv:checked").forEach(s => {
    servicos.push("- " + s.parentElement.innerText.trim());
  });

  const rechaud = document.getElementById("rechaud").value;
  if (rechaud > 0) servicos.push("- Rechaud");

  const total = document.getElementById("totalValor").innerText;

  const mensagem =
`Olá! Quero fazer uma reserva.

📅 *Data:* ${dataBR}
⏰ *Horário:* ${horario}

🎉 *Tipo de Evento:* ${tipoEventoTexto}
💰 *Valor da Locação:* R$ ${valorEvento}

🛠 *Serviços adicionais:*
${servicos.length ? servicos.join("\n") : "- Nenhum"}

💵 *Total:* R$ ${total}

Pode confirmar a disponibilidade?`;

  const mensagemCodificada = encodeURIComponent(mensagem);

  const link1 = `https://wa.me/${numero}?text=${mensagemCodificada}`;

  const link2 = `https://api.whatsapp.com/send?phone=${numero}&text=${mensagemCodificada}`;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isIOS) {
    window.location.href = link1;
    return;
  }

  
  const win = window.open(link1, "_blank");

  
  setTimeout(() => {
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = link2;
    }
  }, 500);
}



// ========== INICIALIZAÇÃO ==========
(async function init() {
  await carregarPrecos();
  await carregarDatas();
  gerarCalendario();
})();
