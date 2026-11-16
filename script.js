// Dados brutos do 8º Ano
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

// Converte qualquer nota válida para a escala de 0 a 10
function normalizarNota(valor) {
  // Se estiver vazio, nulo ou indefinido, a nota ainda não foi lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Evita aceitar valores booleanos (true ou false)
  if (typeof valor === "boolean") {
    return null;
  }

  let numero;

  // Se vier como texto (ex: "7,8"), troca vírgula por ponto e vira número
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

  // Se não for número válido ou estiver fora de 0 a 100, é inválido
  if (Number.isNaN(numero) || !Number.isFinite(numero) || numero < 0 || numero > 100) {
    return null;
  }

  // Valores maiores que 10 até 100 são divididos por 10 (ex: 82 -> 8.2)
  if (numero > 10) {
    numero = numero / 10;
  }

  return numero;
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

  // Se nenhuma nota foi lançada ainda, não há média
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

// Preenche a tabela e os cards na tela
function montarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");
  corpoTabela.innerHTML = "";

  let somaMediasGerais = 0;
  let disciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  // Percorre cada disciplina do array dadosBoletim
  dadosBoletim.forEach(function (item) {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const media = calcularMedia([n1, n2, n3]);
    const faltasDisciplina = somarFaltas(item.faltas);
    const situacao = definirSituacao(media);

    // Soma os totais para os cards superiores
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

    // Cria uma linha (<tr>) para a disciplina na tabela
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td class="centro ${n1 === null ? "nota-ausente" : ""}">${formatarNota(n1)}</td>
      <td class="centro ${n2 === null ? "nota-ausente" : ""}">${formatarNota(n2)}</td>
      <td class="centro ${n3 === null ? "nota-ausente" : ""}">${formatarNota(n3)}</td>
      <td class="centro ${media === null ? "nota-ausente" : ""}"><strong>${formatarNota(media)}</strong></td>
      <td class="centro">${faltasDisciplina}</td>
      <td><span class="badge ${situacao.classe}">${situacao.texto}</span></td>
    `;

    corpoTabela.appendChild(linha);
  });

  // Atualiza os textos dos cards no topo da página
  const mediaGeral = disciplinasComMedia > 0 ? somaMediasGerais / disciplinasComMedia : null;

  document.getElementById("media-geral").textContent = formatarNota(mediaGeral);
  document.getElementById("total-faltas").textContent = totalFaltasGeral;
  document.getElementById("qtd-bom").textContent = qtdBomDesempenho;
  document.getElementById("qtd-atencao").textContent = qtdAtencao;

  // Percentual de frequência apenas demonstrativo (fictício) para esta primeira etapa;
  // será tratado e calculado de outra forma no futuro.
  document.getElementById("frequencia-valor").textContent = "92%";
  document.getElementById("frequencia-texto").textContent = "Frequência adequada";
}

// Inicia o boletim na página
montarBoletim();