// Configuração fixa do estudante (turma e chamada não podem ser alteradas na tela)
const CONFIG_ALUNO = {
  turma: "8B",
  numeroChamada: 32,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Dados brutos originais do 8º Ano (usados quando ainda não há dados salvos na API)
const dadosBoletim = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// Estado da sessão mantido somente em memória (nunca salvo em localStorage ou URL)
let pinSessao = "";
let disciplinasAtuais = [];
let modoEdicao = false;

// Instâncias dos gráficos (camada apenas de leitura)
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Converte qualquer nota válida dos dados antigos para a escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor === "boolean") {
    return null;
  }

  let numero;

  if (typeof valor === "string") {
    const textoLimpo = valor.trim().replace(",", ".");
    if (textoLimpo === "") {
      return null;
    }
    numero = Number(textoLimpo);
  } else if (typeof valor === "number") {
    numero = valor;
  } else {
    return null;
  }

  if (Number.isNaN(numero) || !Number.isFinite(numero) || numero < 0 || numero > 100) {
    return null;
  }

  if (numero > 10) {
    numero = numero / 10;
  }

  return numero;
}

// Valida nota digitada pelo aluno no editor (aceita somente vazio ou número de 0 a 10)
function validarNotaEditor(textoDigitado) {
  const texto = String(textoDigitado).trim();

  if (texto === "") {
    return { valido: true, valor: null };
  }

  if (!/^\d+([.,]\d+)?$/.test(texto)) {
    return { valido: false, valor: null };
  }

  const numero = Number(texto.replace(",", "."));

  if (Number.isNaN(numero) || !Number.isFinite(numero) || numero < 0 || numero > 10) {
    return { valido: false, valor: null };
  }

  return { valido: true, valor: numero };
}

// Valida falta digitada pelo aluno no editor (aceita somente inteiro >= 0)
function validarFaltaEditor(textoDigitado) {
  const texto = String(textoDigitado).trim();

  if (texto === "" || !/^\d+$/.test(texto)) {
    return { valido: false, valor: null };
  }

  const numero = Number(texto);

  if (!Number.isInteger(numero) || numero < 0) {
    return { valido: false, valor: null };
  }

  return { valido: true, valor: numero };
}

// Formata o número com 1 casa decimal e vírgula (ex: 8.2 -> "8,2")
function formatarNota(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

// Calcula a média usando apenas as notas disponíveis
function calcularMedia(listaNotas) {
  let soma = 0;
  let quantidadeValidas = 0;

  listaNotas.forEach(function (nota) {
    if (nota !== null) {
      soma = soma + nota;
      quantidadeValidas = quantidadeValidas + 1;
    }
  });

  if (quantidadeValidas === 0) {
    return null;
  }

  return soma / quantidadeValidas;
}

// Soma as faltas dos três trimestres
function somarFaltas(listaFaltas) {
  let total = 0;
  listaFaltas.forEach(function (falta) {
    total = total + falta;
  });
  return total;
}

// Define o texto e o visual da situação com base na média mínima 6,0
function definirSituacao(media) {
  if (media === null) {
    return { texto: "Nota ainda não disponível", classe: "badge-neutro" };
  }

  if (media >= 6.0) {
    return { texto: "Bom desempenho", classe: "badge-bom" };
  }

  return { texto: "Atenção", classe: "badge-atencao" };
}

// Prepara lista normalizada a partir de dados locais ou recebidos da API
function normalizarListaDisciplinas(listaBruta) {
  return listaBruta.map(function (item) {
    const faltasBrutas = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const faltasNormalizadas = [0, 1, 2].map(function (indice) {
      const valor = Number(faltasBrutas[indice]);
      return Number.isInteger(valor) && valor >= 0 ? valor : 0;
    });

    return {
      disciplina: typeof item.disciplina === "string" ? item.disciplina : "Disciplina",
      tri1: normalizarNota(item.tri1),
      tri2: normalizarNota(item.tri2),
      tri3: normalizarNota(item.tri3),
      faltas: faltasNormalizadas
    };
  });
}

// Exibe mensagens de status com cor adequada
function exibirMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = "mensagem-status";
  if (tipo) {
    elemento.classList.add(tipo);
  }
}

// Controla a visibilidade dos botões Alterar, Salvar e Cancelar
function atualizarBotoesEdicao() {
  const btnAlterar = document.getElementById("btn-alterar");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");

  if (modoEdicao) {
    btnAlterar.classList.add("oculto");
    btnSalvar.classList.remove("oculto");
    btnCancelar.classList.remove("oculto");
  } else {
    btnAlterar.classList.remove("oculto");
    btnSalvar.classList.add("oculto");
    btnCancelar.classList.add("oculto");
  }
}

// Cria uma célula de trimestre (somente leitura ou com campos de edição)
function criarCelulaTrimestre(nota, falta, triIndice, nomeDisciplina) {
  const td = document.createElement("td");
  td.className = "centro";

  if (!modoEdicao) {
    if (nota === null) {
      td.classList.add("nota-ausente");
    }
    td.textContent = formatarNota(nota);
    return td;
  }

  const containerEdicao = document.createElement("div");
  containerEdicao.className = "celula-edicao";

  // Campo de edição da nota do trimestre
  const labelNota = document.createElement("label");
  labelNota.className = "campo-mini";

  const spanNota = document.createElement("span");
  spanNota.textContent = "Nota";

  const inputNota = document.createElement("input");
  inputNota.type = "text";
  inputNota.className = "input-edicao";
  inputNota.placeholder = "0 a 10";
  inputNota.dataset.campo = "nota";
  inputNota.dataset.tri = String(triIndice);
  inputNota.value = nota === null ? "" : String(nota).replace(".", ",");
  inputNota.setAttribute("aria-label", "Nota " + (triIndice + 1) + "º trimestre de " + nomeDisciplina);

  inputNota.addEventListener("input", function () {
    inputNota.classList.remove("input-invalido");
  });

  labelNota.appendChild(spanNota);
  labelNota.appendChild(inputNota);

  // Campo de edição das faltas do trimestre
  const labelFalta = document.createElement("label");
  labelFalta.className = "campo-mini";

  const spanFalta = document.createElement("span");
  spanFalta.textContent = "Faltas";

  const inputFalta = document.createElement("input");
  inputFalta.type = "text";
  inputFalta.inputMode = "numeric";
  inputFalta.className = "input-edicao";
  inputFalta.dataset.campo = "falta";
  inputFalta.dataset.tri = String(triIndice);
  inputFalta.value = String(falta);
  inputFalta.setAttribute("aria-label", "Faltas " + (triIndice + 1) + "º trimestre de " + nomeDisciplina);

  inputFalta.addEventListener("input", function () {
    inputFalta.classList.remove("input-invalido");
  });

  labelFalta.appendChild(spanFalta);
  labelFalta.appendChild(inputFalta);

  containerEdicao.appendChild(labelNota);
  containerEdicao.appendChild(labelFalta);
  td.appendChild(containerEdicao);

  return td;
}

// Preenche a tabela e os cards na tela sem duplicar elementos
function montarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");
  corpoTabela.innerHTML = "";

  let somaMediasGerais = 0;
  let disciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  disciplinasAtuais.forEach(function (item, indice) {
    const n1 = item.tri1;
    const n2 = item.tri2;
    const n3 = item.tri3;

    const media = calcularMedia([n1, n2, n3]);
    const faltasDisciplina = somarFaltas(item.faltas);
    const situacao = definirSituacao(media);

    totalFaltasGeral = totalFaltasGeral + faltasDisciplina;

    if (media !== null) {
      somaMediasGerais = somaMediasGerais + media;
      disciplinasComMedia = disciplinasComMedia + 1;

      if (media >= 6.0) {
        qtdBomDesempenho = qtdBomDesempenho + 1;
      } else {
        qtdAtencao = qtdAtencao + 1;
      }
    }

    const linha = document.createElement("tr");
    linha.dataset.indice = String(indice);

    // Coluna Disciplina (inserida com textContent por segurança)
    const tdDisciplina = document.createElement("td");
    const strongDisciplina = document.createElement("strong");
    strongDisciplina.textContent = item.disciplina;
    tdDisciplina.appendChild(strongDisciplina);
    linha.appendChild(tdDisciplina);

    // Colunas 1º, 2º e 3º Trimestres
    linha.appendChild(criarCelulaTrimestre(n1, item.faltas[0], 0, item.disciplina));
    linha.appendChild(criarCelulaTrimestre(n2, item.faltas[1], 1, item.disciplina));
    linha.appendChild(criarCelulaTrimestre(n3, item.faltas[2], 2, item.disciplina));

    // Coluna Média
    const tdMedia = document.createElement("td");
    tdMedia.className = "centro" + (media === null ? " nota-ausente" : "");
    const strongMedia = document.createElement("strong");
    strongMedia.textContent = formatarNota(media);
    tdMedia.appendChild(strongMedia);
    linha.appendChild(tdMedia);

    // Coluna Total de Faltas
    const tdFaltas = document.createElement("td");
    tdFaltas.className = "centro";
    tdFaltas.textContent = String(faltasDisciplina);
    linha.appendChild(tdFaltas);

    // Coluna Situação
    const tdSituacao = document.createElement("td");
    const spanBadge = document.createElement("span");
    spanBadge.className = "badge " + situacao.classe;
    spanBadge.textContent = situacao.texto;
    tdSituacao.appendChild(spanBadge);
    linha.appendChild(tdSituacao);

    corpoTabela.appendChild(linha);
  });

  // Atualiza os cards de resumo
  const mediaGeral = disciplinasComMedia > 0 ? somaMediasGerais / disciplinasComMedia : null;

  document.getElementById("media-geral").textContent = formatarNota(mediaGeral);
  document.getElementById("total-faltas").textContent = String(totalFaltasGeral);
  document.getElementById("qtd-bom").textContent = String(qtdBomDesempenho);
  document.getElementById("qtd-atencao").textContent = String(qtdAtencao);

  // Percentual de frequência apenas demonstrativo (fictício) para esta etapa;
  // será tratado e calculado de outra forma no futuro.
  document.getElementById("frequencia-valor").textContent = "92%";
  document.getElementById("frequencia-texto").textContent = "Frequência adequada";
}

// Gráfico 1: Média por disciplina (barras horizontais)
function atualizarGraficoMedias() {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  if (graficoMedias) {
    graficoMedias.destroy();
  }

  const nomesDisciplinas = disciplinasAtuais.map(function (item) {
    return item.disciplina;
  });

  const mediasDisciplinas = disciplinasAtuais.map(function (item) {
    return calcularMedia([item.tri1, item.tri2, item.tri3]);
  });

  graficoMedias = new Chart(canvas, {
    type: "bar",
    data: {
      labels: nomesDisciplinas,
      datasets: [
        {
          label: "Média",
          data: mediasDisciplinas,
          backgroundColor: "#0284c7",
          hoverBackgroundColor: "#1d4ed8",
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (contexto) {
              const valor = contexto.parsed.x;
              if (valor === null || valor === undefined) {
                return contexto.label + ": Sem nota";
              }
              return contexto.label + ": " + formatarNota(valor);
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: {
            color: "#475569",
            font: { size: 11 }
          },
          grid: {
            color: "#e2e8f0"
          }
        },
        y: {
          ticks: {
            autoSkip: false,
            color: "#1e293b",
            font: { size: 10 }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Gráfico 2: Evolução da média geral por trimestre (linha)
function atualizarGraficoEvolucao() {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
  }

  const notasTri1 = disciplinasAtuais.map(function (item) {
    return item.tri1;
  });
  const notasTri2 = disciplinasAtuais.map(function (item) {
    return item.tri2;
  });
  const notasTri3 = disciplinasAtuais.map(function (item) {
    return item.tri3;
  });

  const mediaTri1 = calcularMedia(notasTri1);
  const mediaTri2 = calcularMedia(notasTri2);
  const mediaTri3 = calcularMedia(notasTri3);

  graficoEvolucao = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [
        {
          label: "Média Geral",
          data: [mediaTri1, mediaTri2, mediaTri3],
          borderColor: "#1d4ed8",
          backgroundColor: "rgba(29, 78, 216, 0.12)",
          pointBackgroundColor: "#0284c7",
          pointBorderColor: "#1d4ed8",
          pointRadius: 5,
          pointHoverRadius: 6,
          borderWidth: 2.5,
          tension: 0.25,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (contexto) {
              const valor = contexto.parsed.y;
              if (valor === null || valor === undefined) {
                return contexto.label + ": Sem nota";
              }
              return contexto.label + ": " + formatarNota(valor);
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: {
            color: "#475569",
            font: { size: 11 }
          },
          grid: {
            color: "#e2e8f0"
          }
        },
        x: {
          ticks: {
            color: "#1e293b",
            font: { size: 11, weight: "600" }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Gráfico 3: Faltas por trimestre (barras verticais)
function atualizarGraficoFaltas() {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  if (graficoFaltas) {
    graficoFaltas.destroy();
  }

  let faltasTri1 = 0;
  let faltasTri2 = 0;
  let faltasTri3 = 0;

  disciplinasAtuais.forEach(function (item) {
    const faltas = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    faltasTri1 = faltasTri1 + (Number(faltas[0]) || 0);
    faltasTri2 = faltasTri2 + (Number(faltas[1]) || 0);
    faltasTri3 = faltasTri3 + (Number(faltas[2]) || 0);
  });

  const totalFaltas = faltasTri1 + faltasTri2 + faltasTri3;
  const referenciaInterna = 350;
  const situacaoCritica = totalFaltas >= referenciaInterna;

  const badgeEstado = document.getElementById("estadoFaltas");
  const cardFaltas = document.getElementById("card-grafico-faltas");

  if (badgeEstado && cardFaltas) {
    if (situacaoCritica) {
      badgeEstado.classList.remove("oculto");
      cardFaltas.classList.add("estado-perigo");
    } else {
      badgeEstado.classList.add("oculto");
      cardFaltas.classList.remove("estado-perigo");
    }
  }

  const corBarra = situacaoCritica ? "#dc2626" : "#0284c7";
  const corBarraHover = situacaoCritica ? "#b91c1c" : "#1d4ed8";

  graficoFaltas = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [
        {
          label: "Faltas",
          data: [faltasTri1, faltasTri2, faltasTri3],
          backgroundColor: corBarra,
          hoverBackgroundColor: corBarraHover,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (contexto) {
              const valor = contexto.parsed.y;
              const palavra = valor === 1 ? "falta" : "faltas";
              return contexto.label + ": " + valor + " " + palavra;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: "#475569",
            font: { size: 11 }
          },
          grid: {
            color: "#e2e8f0"
          }
        },
        x: {
          ticks: {
            color: "#1e293b",
            font: { size: 11, weight: "600" }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Atualiza os três gráficos a partir dos dados já carregados em memória
function atualizarGraficos() {
  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}

// Faz login na API usando turma, número de chamada e PIN digitado
async function abrirBoletim() {
  const inputPin = document.getElementById("input-pin");
  const btnEntrar = document.getElementById("btn-entrar");
  const mensagemLogin = document.getElementById("mensagem-login");

  const pinDigitado = inputPin.value.trim();

  if (pinDigitado === "") {
    exibirMensagem(mensagemLogin, "Digite seu PIN para entrar.", "msg-erro");
    return;
  }

  btnEntrar.disabled = true;
  exibirMensagem(mensagemLogin, "Conectando...", "msg-info");

  try {
    const resposta = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/abrir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      exibirMensagem(mensagemLogin, "Turma, chamada ou PIN inválidos.", "msg-erro");
      return;
    }

    if (resposta.status === 429) {
      exibirMensagem(mensagemLogin, "Muitas tentativas. Aguarde um minuto e tente novamente.", "msg-erro");
      return;
    }

    if (!resposta.ok) {
      exibirMensagem(mensagemLogin, "Não foi possível conectar ao servidor. Tente novamente.", "msg-erro");
      return;
    }

    const resultado = await resposta.json();

    // Guarda o PIN apenas em memória e limpa o campo da tela
    pinSessao = pinDigitado;
    inputPin.value = "";
    exibirMensagem(mensagemLogin, "", "");

    // Se não houver dados salvos na API, usa os dados fictícios locais;
    // se houver dados na API, usa exclusivamente os dados recebidos da API.
    if (resultado.dados === null || resultado.dados === undefined) {
      disciplinasAtuais = normalizarListaDisciplinas(dadosBoletim);
    } else if (Array.isArray(resultado.dados)) {
      disciplinasAtuais = normalizarListaDisciplinas(resultado.dados);
    } else if (Array.isArray(resultado.dados.disciplinas)) {
      disciplinasAtuais = normalizarListaDisciplinas(resultado.dados.disciplinas);
    } else {
      disciplinasAtuais = normalizarListaDisciplinas(dadosBoletim);
    }

    document.getElementById("area-login").classList.add("oculto");
    document.getElementById("conteudo-boletim").classList.remove("oculto");

    modoEdicao = false;
    atualizarBotoesEdicao();
    montarBoletim();
    atualizarGraficos();
  } catch (erro) {
    exibirMensagem(mensagemLogin, "Não foi possível conectar ao servidor. Tente novamente.", "msg-erro");
  } finally {
    btnEntrar.disabled = false;
  }
}

// Valida todos os campos editados e envia para a API
async function salvarAlteracoes() {
  const corpoTabela = document.getElementById("corpo-tabela");
  const mensagemEdicao = document.getElementById("mensagem-edicao");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");

  const linhas = corpoTabela.querySelectorAll("tr");
  const novasDisciplinas = [];
  let existeCampoInvalido = false;

  linhas.forEach(function (linha, indice) {
    const disciplinaAtual = disciplinasAtuais[indice];
    const inputsNota = linha.querySelectorAll('input[data-campo="nota"]');
    const inputsFalta = linha.querySelectorAll('input[data-campo="falta"]');

    const notasValidadas = [null, null, null];
    const faltasValidadas = [0, 0, 0];

    inputsNota.forEach(function (input) {
      const tri = Number(input.dataset.tri);
      const resultadoNota = validarNotaEditor(input.value);

      if (!resultadoNota.valido) {
        input.classList.add("input-invalido");
        existeCampoInvalido = true;
      } else {
        input.classList.remove("input-invalido");
        notasValidadas[tri] = resultadoNota.valor;
      }
    });

    inputsFalta.forEach(function (input) {
      const tri = Number(input.dataset.tri);
      const resultadoFalta = validarFaltaEditor(input.value);

      if (!resultadoFalta.valido) {
        input.classList.add("input-invalido");
        existeCampoInvalido = true;
      } else {
        input.classList.remove("input-invalido");
        faltasValidadas[tri] = resultadoFalta.valor;
      }
    });

    novasDisciplinas.push({
      disciplina: disciplinaAtual.disciplina,
      tri1: notasValidadas[0],
      tri2: notasValidadas[1],
      tri3: notasValidadas[2],
      faltas: faltasValidadas
    });
  });

  if (existeCampoInvalido) {
    exibirMensagem(
      mensagemEdicao,
      "Existem campos inválidos destacados em vermelho. Notas devem ser de 0 a 10 (ou vazio) e faltas devem ser inteiros (0 ou maior).",
      "msg-erro"
    );
    return;
  }

  btnSalvar.disabled = true;
  btnCancelar.disabled = true;
  exibirMensagem(mensagemEdicao, "Salvando...", "msg-info");

  try {
    const resposta = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/salvar", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      if (resposta.status === 401) {
        exibirMensagem(mensagemEdicao, "Sessão inválida ou PIN expirado. Atualize a página e entre novamente.", "msg-erro");
      } else if (resposta.status === 429) {
        exibirMensagem(mensagemEdicao, "Muitas tentativas. Aguarde um minuto e tente novamente.", "msg-erro");
      } else {
        exibirMensagem(mensagemEdicao, "Não foi possível salvar as alterações. Tente novamente.", "msg-erro");
      }
      return;
    }

    disciplinasAtuais = novasDisciplinas;
    modoEdicao = false;
    atualizarBotoesEdicao();
    montarBoletim();
    atualizarGraficos();
    exibirMensagem(mensagemEdicao, "Dados salvos com sucesso.", "msg-sucesso");
  } catch (erro) {
    exibirMensagem(mensagemEdicao, "Não foi possível conectar ao servidor. Tente salvar novamente.", "msg-erro");
  } finally {
    btnSalvar.disabled = false;
    btnCancelar.disabled = false;
  }
}

// Configura os eventos dos botões e do campo de PIN ao carregar a página
function iniciarEventos() {
  const btnEntrar = document.getElementById("btn-entrar");
  const inputPin = document.getElementById("input-pin");
  const btnAlterar = document.getElementById("btn-alterar");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const mensagemEdicao = document.getElementById("mensagem-edicao");

  btnEntrar.addEventListener("click", abrirBoletim);

  inputPin.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      abrirBoletim();
    }
  });

  btnAlterar.addEventListener("click", function () {
    modoEdicao = true;
    exibirMensagem(mensagemEdicao, "", "");
    atualizarBotoesEdicao();
    montarBoletim();
  });

  btnCancelar.addEventListener("click", function () {
    modoEdicao = false;
    exibirMensagem(mensagemEdicao, "", "");
    atualizarBotoesEdicao();
    montarBoletim();
  });

  btnSalvar.addEventListener("click", salvarAlteracoes);
}

iniciarEventos();daw