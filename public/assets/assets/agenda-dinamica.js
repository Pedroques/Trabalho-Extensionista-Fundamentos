document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("button[onclick='enviarWhatsApp()']");
  btn.disabled = false;
});

let dataAtual = new Date();
let datasIndisponiveis = [];

// ============================
// 1) CARREGAR PREÇOS E SERVIÇOS DO JSON
// ============================
async function carregarPrecos() {
  const res = await fetch("data/precos.json");
  const precos = await res.json();

  // ============================
  // TIPOS DE EVENTO
  // ============================
  const tipoEvento = document.getElementById("tipoEvento");
  tipoEvento.innerHTML = "";
  precos.eventos.forEach(ev => {
    const option = document.createElement("option");
    option.value = ev.preco;
    option.textContent = `${ev.nome} – R$ ${ev.preco}`;
    tipoEvento.appendChild(option);
  });

  // ============================
  // SERVIÇOS COMUNS (checkboxes)
  // ============================
  const servicosDiv = document.getElementById("listaServicos");
  servicosDiv.innerHTML = "";

  precos.servicos.forEach(serv => {

    // ignorar mobília -> tratado separado
    if (serv.nome === "Mesas" || serv.nome === "Cadeiras") return;

    // ignorar rechaud -> select especial
    if (serv.nome.includes("Rechaud")) return;

    servicosDiv.innerHTML += `
      <label>
        <input type="checkbox" class="serv" data-price="${serv.preco}" />
        ${serv.nome} – R$ ${serv.preco}
      </label><br>
    `;
  });

  // ============================
  // MOBÍLIA — MESAS E CADEIRAS
  // ============================
  const mesasItem = precos.servicos.find(s => s.nome === "Mesas");
  const cadeirasItem = precos.servicos.find(s => s.nome === "Cadeiras");

  if (!mesasItem || !cadeirasItem) {
    console.error("❌ ERRO: JSON não contém 'Mesas' ou 'Cadeiras'");
    return;
  }

  const inputMesas = document.getElementById("mesas");
  const inputCadeiras = document.getElementById("cadeiras");

  // valores iniciais
  inputMesas.value = mesasItem.incluidas;
  inputCadeiras.value = cadeirasItem.incluidas;

  // limites (mínimo = incluídas | máximo = incluídas + extras)
  inputMesas.min = mesasItem.incluidas;
  inputMesas.max = mesasItem.incluidas + mesasItem.extras;

  inputCadeiras.min = cadeirasItem.incluidas;
  inputCadeiras.max = cadeirasItem.incluidas + cadeirasItem.extras;

  // atualizar textos do HTML
  document.getElementById("labelMesas").textContent =
    `Mesas (${mesasItem.incluidas} inclusas):`;
  document.getElementById("mesasInfo").textContent =
    `Até +${mesasItem.extras} extras (R$ ${mesasItem.preco_extra} cada)`;

  document.getElementById("labelCadeiras").textContent =
    `Cadeiras (${cadeirasItem.incluidas} inclusas):`;
  document.getElementById("cadeirasInfo").textContent =
    `Até +${cadeirasItem.extras} extras (R$ ${cadeirasItem.preco_extra} cada)`;

  // salvar globalmente para cálculo
  window.mesasConfig = mesasItem;
  window.cadeirasConfig = cadeirasItem;

  // Mostrar os preços de extras na tela
document.getElementById("mesasExtrasValor").textContent = mesasItem.preco_extra;
document.getElementById("cadeirasExtrasValor").textContent = cadeirasItem.preco_extra;


  // ============================
  // RECHAUD
  // ============================
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

  // Serviços normais
  document.querySelectorAll(".serv:checked").forEach(s => {
    totalServicos += Number(s.dataset.price);
  });

  // Rechaud
  totalServicos += Number(document.getElementById("rechaud").value);

  // Mesas/Cadeiras
  const mesas = Number(document.getElementById("mesas").value);
  const cadeiras = Number(document.getElementById("cadeiras").value);

  const mesasExtras = Math.max(0, mesas - window.mesasConfig.incluidas);
  const cadeirasExtras = Math.max(0, cadeiras - window.cadeirasConfig.incluidas);

  const valorMesasExtras = mesasExtras * window.mesasConfig.preco_extra;
  const valorCadeirasExtras = cadeirasExtras * window.cadeirasConfig.preco_extra;

  totalServicos += valorMesasExtras + valorCadeirasExtras;

  // Atualizar DOM
  document.getElementById("valorLocacaoResumo").textContent = valorEvento;
  document.getElementById("valorLocacaoResumoTotal").textContent = valorEvento;
  document.getElementById("servicosValor").textContent = totalServicos;
  document.getElementById("totalValor").textContent = valorEvento + totalServicos;
}

// Recalcular total ao alterar inputs
document.addEventListener("change", e => {
  if (
    e.target.classList.contains("serv") ||
    e.target.id === "rechaud" ||
    e.target.id === "tipoEvento" ||
    e.target.id === "mesas" ||
    e.target.id === "cadeiras"
  ) {
    atualizarTotal();
  }
});

// ============================
// 5) WHATSAPP
// ============================
async function enviarWhatsApp() {
  const numero = "5531996784862";

  // -------------------------------
  // VALIDAR NOME E E-MAIL
  // -------------------------------
  const nome = document.getElementById("nomeCliente").value.trim();
  const email = document.getElementById("emailCliente").value.trim();

  if (!nome) return alert("Por favor, preencha seu nome.");
  if (!email) return alert("Por favor, preencha seu e-mail.");
  if (!email.includes("@")) return alert("Digite um e-mail válido.");

  // -------------------------------
  // VALIDAR DATA E HORÁRIO
  // -------------------------------
  const dia = document.querySelector(".day.selected");
  if (!dia) return alert("Selecione uma data.");

  const dataISO = dia.dataset.selecionado;
  const dataBR = dataISO.split("-").reverse().join("/");

  const horario = document.getElementById("horario").value;
  if (!horario) return alert("Selecione o horário.");

  // -------------------------------
  // CAPTURAR DADOS DO EVENTO
  // -------------------------------
  const tipoEventoTexto = document.getElementById("tipoEvento").selectedOptions[0].text;
  const valorEvento = Number(document.getElementById("valorLocacaoResumo").innerText);

  let servicosSelecionados = [];
  document.querySelectorAll(".serv:checked").forEach(s => {
    servicosSelecionados.push(s.parentElement.innerText.trim());
  });

  const rechaud = document.getElementById("rechaud").value;
  if (rechaud > 0) servicosSelecionados.push("Rechaud");

  // Mesas / Cadeiras
  const mesas = document.getElementById("mesas").value;
  const cadeiras = document.getElementById("cadeiras").value;

  servicosSelecionados.push(`Mesas: ${mesas}`);
  servicosSelecionados.push(`Cadeiras: ${cadeiras}`);

  const total = Number(document.getElementById("totalValor").innerText);

  // -------------------------------
// SALVAR NO backend (server.js)
// -------------------------------
const novaReserva = {
  nome,
  email,
  evento: tipoEventoTexto,
  servicos: servicosSelecionados,
  total,
  data: dataISO,
  horario,
  status: "pendente"
};

try {
  await fetch("/reservas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novaReserva)
  });
} catch (err) {
  console.error("Erro ao salvar reserva:", err);
  alert("Não foi possível salvar sua reserva. Tente novamente.");
  return;
}

  // -------------------------------
  // MENSAGEM PARA O WHATSAPP
  // -------------------------------
  const mensagem =
`Olá! Quero fazer uma reserva.

👤 *Nome:* ${nome}
📧 *E-mail:* ${email}

📅 *Data:* ${dataBR}
⏰ *Horário:* ${horario}

🎉 *Tipo de Evento:* ${tipoEventoTexto}
💰 *Locação:* R$ ${valorEvento}

🛠 *Serviços:*
${servicosSelecionados.join("\n")}

💵 *Total:* R$ ${total}

Acabei de enviar minha solicitação pelo site 😊`;

  const texto = encodeURIComponent(mensagem);

  const link1 = `https://wa.me/${numero}?text=${texto}`;
  const link2 = `https://api.whatsapp.com/send?phone=${numero}&text=${texto}`;

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