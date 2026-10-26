// === DADOS DO BOLETIM (ARRAY DE OBJETOS) ===
// Guardamos todas as disciplinas e suas notas/faltas nesta lista
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

// Função obrigatória para normalizar qualquer formato de nota para a escala 0 a 10
function normalizarNota(valor) {
  // Trata notas ausentes
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Converte texto com vírgula para número com ponto
  let num = typeof valor === "string" ? parseFloat(valor.replace(",", ".")) : Number(valor);

  // Verifica se o valor é numérico
  if (isNaN(num)) {
    return null;
  }

  // Se a nota estiver na escala 0-100, divide por 10
  if (num > 10 && num <= 100) {
    num = num / 10;
  }

  // Se estiver na escala correta (0 a 10), retorna a nota
  if (num >= 0 && num <= 10) {
    return num;
  }

  // Qualquer outro valor é inválido
  return null;
}

// Função auxiliar para exibir a nota formatada na tela
function formatarExibicaoNota(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace(".", ",");
}

// Função principal para calcular médias e montar o boletim no HTML
function carregarBoletim() {
  // Acessamos os elementos do HTML usando o DOM
  const tabelaBody = document.getElementById("tabela-boletim");
  const cardMediaGeral = document.getElementById("card-media-geral");
  const cardTotalFaltas = document.getElementById("card-total-faltas");
  const cardBomDesempenho = document.getElementById("card-bom-desempenho");
  const cardAtencao = document.getElementById("card-atencao");

  let somaMediasValidas = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let totalBomDesempenho = 0;
  let totalAtencao = 0;

  tabelaBody.innerHTML = "";

  // forEach: Passamos por cada uma das 15 disciplinas
  dadosBoletim.forEach((item) => {
    // Normalizamos as notas dos 3 trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Somamos as faltas da disciplina
    const faltasDisciplina = item.faltas.reduce((acumulador, falta) => acumulador + falta, 0);
    totalFaltasGeral += faltasDisciplina;

    // Filtramos apenas as notas disponíveis (que não são null)
    const notasDisponiveis = [n1, n2, n3].filter((n) => n !== null);

    let mediaTexto = "—";
    let situacaoTexto = "Nota ainda não disponível";
    let classeSituacao = "situacao-indisponivel";

    // Estrutura de condição (if/else) para calcular a média e definir a situação
    if (notasDisponiveis.length > 0) {
      const somaNotas = notasDisponiveis.reduce((acumulador, nota) => acumulador + nota, 0);
      const media = somaNotas / notasDisponiveis.length;

      mediaTexto = media.toFixed(1).replace(".", ",");
      somaMediasValidas += media;
      qtdDisciplinasComMedia++;

      if (media >= 6.0) {
        situacaoTexto = "Bom desempenho";
        classeSituacao = "situacao-bom";
        totalBomDesempenho++;
      } else {
        situacaoTexto = "Atenção";
        classeSituacao = "situacao-atencao";
        totalAtencao++;
      }
    }

    // Criamos a linha da tabela no HTML via JS (DOM)
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.disciplina}</td>
      <td>${formatarExibicaoNota(n1)}</td>
      <td>${formatarExibicaoNota(n2)}</td>
      <td>${formatarExibicaoNota(n3)}</td>
      <td><strong>${mediaTexto}</strong></td>
      <td>${faltasDisciplina}</td>
      <td class="${classeSituacao}">${situacaoTexto}</td>
    `;
    tabelaBody.appendChild(tr);
  });

  // Atualizamos os cards de resumo no topo
  if (qtdDisciplinasComMedia > 0) {
    const mediaGeral = somaMediasValidas / qtdDisciplinasComMedia;
    cardMediaGeral.innerText = mediaGeral.toFixed(1).replace(".", ",");
  } else {
    cardMediaGeral.innerText = "—";
  }

  cardTotalFaltas.innerText = totalFaltasGeral;
  cardBomDesempenho.innerText = totalBomDesempenho;
  cardAtencao.innerText = totalAtenc