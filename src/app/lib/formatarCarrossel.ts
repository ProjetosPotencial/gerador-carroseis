import type { SlideData, LayoutId } from "../components/CarrosselSlide";
import type { TemaConfig } from "../components/temas/tipos";

/**
 * Helpers para o fluxo "formatação via IA externa":
 *  - `gerarPromptParaIA` gera o texto que o usuário cola em Claude.ai / ChatGPT / Gemini
 *  - `parsearRespostaIA` recebe a resposta (em JSON) e devolve slides prontos
 *
 * Nenhuma chamada de API é feita pelo app. O usuário cuida do vai-e-vem.
 */

// ============================================================
// GERADOR DO PROMPT
// ============================================================

export interface OpcoesPrompt {
  tema: string;
  numeroSlides: number;
  marca: string;
  /** Tema visual ativo — o prompt lista os layouts desse tema */
  temaVisual: TemaConfig;
}

export function gerarPromptParaIA(opcoes: OpcoesPrompt): string {
  const { tema, numeroSlides, marca, temaVisual } = opcoes;

  const layoutsLista = temaVisual.layouts
    .map((l) => `• "${l.id}" — ${l.descricao}`)
    .join("\n");

  const coresFundoPossiveis = '"preto", "amarelo", "bege" ou "branco"';

  return `Você é copywriter especialista em carrosséis editoriais de Instagram no estilo "${temaVisual.nome}".

ESCREVA UM CARROSSEL DE ${numeroSlides} SLIDES SOBRE:
${tema}

MARCA QUE ASSINA: ${marca}

---

ESTRUTURA FIXA — sempre 7 slides, EXATAMENTE nesta ordem, com este layout e cor de fundo:
• Slide 1 — CAPA (layout "foto_cheia", corFundo "preto"): tese central provocativa. kicker + headline forte + destaque.
• Slide 2 — CONTEXTO (layout "split_horizontal", corFundo "preto"): como chegamos até aqui. kicker + headline + corpo + destaque.
• Slide 3 — DADO/VIRADA (layout "split_horizontal", corFundo "amarelo"): número ou fato que sustenta a tese. kicker + headline + corpo + destaque.
• Slide 4 — DESENVOLVIMENTO (layout "tipografia_pura", corFundo "amarelo"): aprofunda o argumento. kicker + headline gigante + corpo + destaque.
• Slide 5 — PERFIL/IMPLICAÇÃO (layout "split_horizontal", corFundo "preto"): quem ou o que muda. kicker + headline + corpo + destaque.
• Slide 6 — APROFUNDAMENTO (layout "foto_cheia", corFundo "preto"): reforço visual do argumento. kicker + headline + destaque.
• Slide 7 — CTA FINAL (layout "foto_cheia_final", corFundo "preto"): fechamento com chamada. kicker + headline + corpo + destaque + textoPill (ex: "@marca · SIGA").

NÃO invente outros layouts nem mude a ordem. Use exatamente os 7 acima. Preencha TODOS os campos de texto de cada slide — não deixe conteúdo de fora.

REGRAS DE COPY:
• Kicker: 1-5 palavras em CAIXA ALTA, sem ponto final. Ex: "TESE Nº 1", "MITO", "CONCLUSÃO"
• Headline: 2-8 palavras POR LINHA. Use \\n para quebrar linhas. Pense manchete de revista.
• Corpo: 2-4 frases curtas, linguagem direta, sem jargão
• Destaque: 1 frase de impacto que sintetiza o slide
• Numero (opcional): ex "+32%", "3,4 MI"
• EVITE clichês: "em um mundo cada vez mais...", "você não está sozinho", "cada vez mais importante"
• TOM: autoral, provocativo, editorial — NÃO corporativo

LAYOUTS DISPONÍVEIS NO TEMA "${temaVisual.nome}" (use o ID exato):
${layoutsLista}

COR DE FUNDO: já fixada na estrutura acima (slides 1, 2, 5, 6 e 7 = "preto"; slides 3 e 4 = "amarelo"). Mantenha assim.

---

RESPONDA APENAS COM UM ARRAY JSON VÁLIDO. Sem markdown, sem \`\`\`json, sem comentários, sem texto antes ou depois.

Formato de cada slide:
{
  "layout": "${temaVisual.layouts[0].id}",
  "corFundo": "preto",
  "kicker": "...",
  "headline": "...",
  "corpo": "...",
  "destaque": "...",
  "numero": "",
  "legendaFoto": "",
  "mostrarPill": false,
  "textoPill": ""
}

Gere EXATAMENTE ${numeroSlides} slides. Todos os campos são obrigatórios — use "" quando não se aplica. Retorne SOMENTE o array.`;
}

// ============================================================
// PARSER DE RESPOSTA
// ============================================================

interface SlideIABruto {
  layout?: string;
  corFundo?: string; // "preto" | "amarelo" | "bege" | "branco"
  kicker?: string;
  headline?: string;
  corpo?: string;
  destaque?: string;
  numero?: string;
  legendaFoto?: string;
  mostrarPill?: boolean;
  textoPill?: string;
}

const LAYOUTS_VALIDOS: LayoutId[] = [
  // Tema Classic
  "foto_cheia",
  "foto_cheia_final",
  "split_horizontal",
  "split_invertido",
  "tipografia_pura",
  "dupla_foto",
  // Tema Refined
  "foto_retrato",
  "texto_topo_foto_amarelo",
  "texto_topo_foto_bege",
  "serif_central",
  "headline_amarela_preto",
  "foto_full_cta",
  // Tema Tweet
  "tweet_texto",
  "tweet_imagem",
  "tweet_numero",
  "tweet_final",
  // Tema Keynote
  "keynote_foto_retrato",
  "keynote_tipografia",
  "keynote_dupla_foto",
  "keynote_silhueta_claro",
  "keynote_foto_lateral",
  // Aliases legados
  "foto_cheia_titulo_embaixo",
];

const LAYOUT_ALIAS: Record<string, LayoutId> = {
  foto_cheia_titulo_embaixo: "foto_cheia",
};

export class ErroParseIA extends Error {
  constructor(msg: string, public detalhe?: string) {
    super(msg);
    this.name = "ErroParseIA";
  }
}

/**
 * Aceita a resposta crua da IA (com ou sem cercas markdown, com ou sem
 * texto antes/depois) e devolve slides prontos para uso.
 *
 * Estratégia de tolerância:
 *  1. Remove cercas ```json ... ``` ou ``` ... ```
 *  2. Procura o primeiro "[" e o último "]" — extrai só o array
 *  3. Se ainda assim JSON.parse falhar, tenta achar N objetos com regex
 */
export function parsearRespostaIA(textoCru: string): SlideData[] {
  if (!textoCru || !textoCru.trim()) {
    throw new ErroParseIA("Cole a resposta da IA antes de clicar em formatar.");
  }

  let limpo = textoCru.trim();

  // 1. Remove cercas markdown de qualquer posição
  limpo = limpo
    .replace(/```(?:json|javascript|js|ts)?\s*\n?/gi, "")
    .replace(/\n?\s*```\s*/g, "")
    .trim();

  // 2. Acha o PRIMEIRO [ que parece ser começo de array de objetos
  //    (ignora [ que aparece em frases como "Aqui está [o carrossel]:")
  let inicio = -1;
  for (let i = 0; i < limpo.length; i++) {
    if (limpo[i] !== "[") continue;
    let j = i + 1;
    while (j < limpo.length && /\s/.test(limpo[j])) j++;
    if (limpo[j] === "{") {
      inicio = i;
      break;
    }
  }

  if (inicio === -1) {
    throw new ErroParseIA(
      "Não encontrei um array JSON na resposta. Verifique se a IA seguiu o formato (deve começar com [ seguido de {).",
      limpo.slice(0, 300)
    );
  }

  // 3. Acha o ] que fecha o array contando brackets aninhados (ignorando strings)
  let nivel = 0;
  let emString = false;
  let escape = false;
  let fim = -1;
  for (let i = inicio; i < limpo.length; i++) {
    const c = limpo[i];
    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }
    if (c === '"') { emString = !emString; continue; }
    if (emString) continue;
    if (c === "[") nivel++;
    else if (c === "]") { nivel--; if (nivel === 0) { fim = i; break; } }
  }

  if (fim === -1) {
    throw new ErroParseIA(
      "Array JSON incompleto — parece faltar o ] de fechamento. A IA pode ter truncado a resposta.",
      limpo.slice(inicio, inicio + 300)
    );
  }

  const somenteArray = limpo.substring(inicio, fim + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(somenteArray);
  } catch (err: any) {
    throw new ErroParseIA(
      "JSON inválido — vírgula faltando, aspas desbalanceadas ou caractere especial não-escapado.",
      err?.message
    );
  }

  if (!Array.isArray(parsed)) {
    throw new ErroParseIA("A resposta não é um array. Esperado: [ {...}, {...} ]");
  }

  if (parsed.length === 0) {
    throw new ErroParseIA("O array está vazio. A IA não gerou nenhum slide.");
  }

  return parsed.map((bruto, i) => normalizarSlide(bruto as SlideIABruto, i));
}

// ============================================================
// CHAMADA DIRETA À API (via Vercel Function /api/ia)
// ============================================================

export interface ChamarIAOpcoes {
  tema: string;
  numeroSlides: number;
  marca: string;
  temaVisual: TemaConfig;
  modelo?: string;
  /** Chave OpenRouter manual (opcional). Se omitida, usa a configurada na Vercel. */
  apiKey?: string;
}

export interface ChamarIAResultado {
  slides: SlideData[];
  modelo: string;
  respostaCrua: string;
  /** "manual" se usou a chave passada pelo usuário, "vercel" se usou a env var */
  fonteDaChave?: "manual" | "vercel";
}

export async function chamarIADireto(opcoes: ChamarIAOpcoes): Promise<ChamarIAResultado> {
  const prompt = gerarPromptParaIA({
    tema: opcoes.tema,
    numeroSlides: opcoes.numeroSlides,
    marca: opcoes.marca,
    temaVisual: opcoes.temaVisual,
  });

  let resp: Response;
  try {
    resp = await fetch("/api/ia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model: opcoes.modelo,
        ...(opcoes.apiKey ? { apiKey: opcoes.apiKey } : {}),
      }),
    });
  } catch (err: any) {
    throw new ErroParseIA(
      `Não foi possível chamar /api/ia. Verifique se o endpoint está publicado na Vercel (${err?.message || err}).`
    );
  }

  if (!resp.ok) {
    const erro = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    throw new ErroParseIA(erro.error || `Erro HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const textoCru = data?.texto || "";
  const modelo = data?.modelo || opcoes.modelo || "desconhecido";
  const fonteDaChave = data?.fonteDaChave;

  const slides = parsearRespostaIA(textoCru);
  return { slides, modelo, respostaCrua: textoCru, fonteDaChave };
}

function normalizarSlide(bruto: SlideIABruto, i: number): SlideData {
  let layoutBruto = bruto.layout as string;
  if (LAYOUT_ALIAS[layoutBruto]) layoutBruto = LAYOUT_ALIAS[layoutBruto];
  const layout: LayoutId = LAYOUTS_VALIDOS.includes(layoutBruto as LayoutId)
    ? (layoutBruto as LayoutId)
    : "tipografia_pura";

  const corFundoValida: SlideData["corFundo"] =
    bruto.corFundo === "amarelo" ? "amarelo"
    : bruto.corFundo === "bege" ? "bege"
    : bruto.corFundo === "branco" ? "branco"
    : "preto";

  return {
    id: `ia_${Date.now()}_${i}`,
    layout,
    corFundo: corFundoValida,
    kicker: typeof bruto.kicker === "string" ? bruto.kicker : "",
    headline: typeof bruto.headline === "string" ? bruto.headline : "",
    corpo: typeof bruto.corpo === "string" ? bruto.corpo : "",
    destaque: typeof bruto.destaque === "string" ? bruto.destaque : "",
    numero: typeof bruto.numero === "string" ? bruto.numero : "",
    fotoUrl: "",
    fotoUrl2: "",
    legendaFoto: typeof bruto.legendaFoto === "string" ? bruto.legendaFoto : "",
    mostrarPill: Boolean(bruto.mostrarPill),
    textoPill: typeof bruto.textoPill === "string" ? bruto.textoPill : "",
  };
}
