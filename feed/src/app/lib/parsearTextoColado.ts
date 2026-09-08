/**
 * Parser de TEXTO COLADO em formato rotulado
 *
 * Formato esperado:
 *   KICKER: TESE 1
 *   HEADLINE: Por décadas, algo foi assunto de poucos.
 *   CORPO: Aqui você desenvolve...
 *   DESTAQUE: E então aconteceu a virada.
 *   NUMERO: +32%
 *   LAYOUT: foto_cheia
 *   CORFUNDO: preto
 *
 * Separação entre slides:
 *   - linha em branco dupla (\n\n\n ou \n\n)
 *   - divisor "---"
 *   - marcadores tipo "SLIDE 1", "SLIDE 2", "===SLIDE==="
 *
 * Multi-linha: se um campo continua em várias linhas, basta indentar ou continuar
 * sem novo rótulo até encontrar outro CAMPO: ou divisor.
 */

import type { SlideData, LayoutId } from "../components/temas/tipos";
import { criarSlideVazio } from "../components/temas/tipos";

// Rótulos aceitos (case-insensitive, com ou sem acento)
const ROTULOS: Record<string, keyof SlideData> = {
  KICKER: "kicker",
  HEADLINE: "headline",
  TITULO: "headline",
  TÍTULO: "headline",
  CORPO: "corpo",
  TEXTO: "corpo",
  DESTAQUE: "destaque",
  HIGHLIGHT: "destaque",
  NUMERO: "numero",
  NÚMERO: "numero",
  NUMBER: "numero",
  LEGENDA: "legendaFoto",
  LEGENDAFOTO: "legendaFoto",
  PILL: "textoPill",
  CTA: "textoPill",
  TEXTOPILL: "textoPill",
  LAYOUT: "layout",
  CORFUNDO: "corFundo",
  FUNDO: "corFundo",
  IMGPROMPT: "imgPrompt",
  IMAGEM: "imgPrompt",
  IMAGEMPROMPT: "imgPrompt",
  PROMPTIMAGEM: "imgPrompt",
};

// SUBHEAD/subtítulo: 2ª parte do título — anexada ao headline (não é campo próprio)
const ROTULOS_SUBHEAD = new Set(["SUBHEAD", "SUBHEADLINE", "SUBTITULO", "SUBTITLE"]);

// Cores de fundo válidas
const CORES_FUNDO_VALIDAS: SlideData["corFundo"][] = [
  "preto",
  "amarelo",
  "bege",
  "branco",
];

// Layouts válidos por tema (lista plana — qualquer um aceito, o tema valida depois)
const LAYOUTS_VALIDOS: LayoutId[] = [
  // Classic
  "foto_cheia",
  "foto_cheia_final",
  "split_horizontal",
  "split_invertido",
  "tipografia_pura",
  "dupla_foto",
  // Refined
  "foto_retrato",
  "texto_topo_foto_amarelo",
  "texto_topo_foto_bege",
  "serif_central",
  "headline_amarela_preto",
  "foto_full_cta",
  // Tweet
  "tweet_texto",
  "tweet_imagem",
  "tweet_numero",
  "tweet_final",
  "tweet_editorial",
  "tweet_sandwich",
  // Keynote
  "keynote_foto_full",
  "keynote_headline_gigante",
  "keynote_dupla_foto",
  "keynote_fundo_claro",
  "keynote_foto_destaque",
  "keynote_cta",
];

export class ErroParseTexto extends Error {
  constructor(message: string, public detalhes?: string) {
    super(message);
    this.name = "ErroParseTexto";
  }
}

/**
 * Resultado do parsing
 */
export interface ResultadoParse {
  slides: SlideData[];
  /** Avisos não-fatais (campo desconhecido, layout inválido, etc.) */
  avisos: string[];
}

/**
 * Parseia um texto colado em slides estruturados.
 */
export function parsearTextoColado(textoCru: string): ResultadoParse {
  if (!textoCru || !textoCru.trim()) {
    throw new ErroParseTexto("Cole algum conteúdo no campo antes de aplicar.");
  }

  // Normaliza quebras de linha
  let texto = textoCru.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  // 1. Detecta o divisor de slides usado e quebra
  const blocos = quebrarEmBlocos(texto);

  if (blocos.length === 0) {
    throw new ErroParseTexto(
      "Não encontrei nenhum slide no texto colado. Verifique se cada slide tem pelo menos um rótulo (HEADLINE:, KICKER:, etc.)."
    );
  }

  const avisos: string[] = [];
  const slides: SlideData[] = [];

  blocos.forEach((bloco, indice) => {
    const slide = parsearBloco(bloco, indice, avisos);
    if (slide) slides.push(slide);
  });

  if (slides.length === 0) {
    throw new ErroParseTexto(
      "Encontrei blocos de texto mas nenhum tinha rótulos válidos (HEADLINE:, KICKER:, etc.)."
    );
  }

  return { slides, avisos };
}

// ============================================================
// QUEBRA EM BLOCOS DE SLIDES
// ============================================================

function quebrarEmBlocos(texto: string): string[] {
  // Estratégia 1: Marcadores explícitos "SLIDE 1", "SLIDE 2", ou "===SLIDE==="
  const regexSlideMarker = /^[\s]*(?:={3,}\s*)?(?:SLIDE)\s*(?:[#:.]?\s*\d+)?(?:\s*={3,})?[\s]*$/im;
  if (regexSlideMarker.test(texto)) {
    return texto
      .split(/^[\s]*(?:={3,}\s*)?(?:SLIDE)\s*(?:[#:.]?\s*\d+)?(?:\s*={3,})?[\s]*$/im)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
  }

  // Estratégia 2: Divisor "---" (markdown horizontal rule)
  const regexDivisor = /^[\s]*-{3,}[\s]*$/m;
  if (regexDivisor.test(texto)) {
    return texto
      .split(/^[\s]*-{3,}[\s]*$/m)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
  }

  // Estratégia 3: Linha em branco dupla (parágrafos separados)
  const regexLinhaBrancoDupla = /\n\s*\n\s*\n+/;
  if (regexLinhaBrancoDupla.test(texto)) {
    return texto
      .split(/\n\s*\n\s*\n+/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
  }

  // Estratégia 4: Linha em branco simples (entre blocos com rótulos)
  // Só aplica se cada parágrafo tiver pelo menos um rótulo
  const blocos = texto
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  // Verifica se cada bloco parece ser um slide (tem pelo menos 1 rótulo)
  const todosTemRotulos = blocos.every((b) => temAlgumRotulo(b));

  if (todosTemRotulos && blocos.length > 1) {
    return blocos;
  }

  // Estratégia 5: tudo é um único slide
  return [texto.trim()];
}

function temAlgumRotulo(bloco: string): boolean {
  const linhas = bloco.split("\n");
  return linhas.some((linha) => extrairRotulo(linha) !== null);
}

// ============================================================
// PARSE DE UM BLOCO INDIVIDUAL EM SLIDE
// ============================================================

function parsearBloco(bloco: string, indice: number, avisos: string[]): SlideData | null {
  const linhas = bloco.split("\n");
  // Começa com slide vazio (vamos sobrescrever os campos encontrados)
  const slide = criarSlideVazio("foto_cheia", "preto");
  slide.id = `colado_${Date.now()}_${indice}_${Math.random().toString(36).substring(2, 6)}`;

  let campoAtual: keyof SlideData | null = null;
  let bufferCampo: string[] = [];
  let encontrouAlgumCampo = false;

  const flush = () => {
    if (campoAtual && bufferCampo.length > 0) {
      const valor = bufferCampo.join("\n").trim();
      aplicarCampo(slide, campoAtual, valor, avisos);
      encontrouAlgumCampo = true;
    }
    bufferCampo = [];
  };

  for (const linha of linhas) {
    const rotulo = extrairRotulo(linha);

    if (rotulo) {
      // Encontrou novo rótulo — flush do anterior e começa novo
      flush();
      campoAtual = rotulo.campo;
      // Se o valor já vem na mesma linha, adiciona ao buffer
      if (rotulo.valorInline) {
        bufferCampo.push(rotulo.valorInline);
      }
    } else if (campoAtual) {
      // Continua o campo atual em multi-linha
      bufferCampo.push(linha);
    }
    // Se não tem campo atual e linha não é rótulo, ignora (pode ser título "SLIDE 1")
  }

  // Flush final
  flush();

  // Norma de título: sem ponto final; 1ª frase vira vírgula (item de estilo do cliente)
  if (slide.headline) slide.headline = normalizarTitulo(slide.headline);

  if (!encontrouAlgumCampo) {
    avisos.push(`Slide ${indice + 1}: nenhum rótulo válido encontrado, ignorado.`);
    return null;
  }

  return slide;
}

// ============================================================
// NORMA DE TÍTULO (headline)
// ============================================================

/**
 * Regras de título do cliente:
 * - nunca terminar com ponto final;
 * - se houver duas frases, a primeira termina em vírgula e a segunda sem ponto.
 * Ex.: "Recebimento à vista. Família paga em 12x." -> "Recebimento à vista, Família paga em 12x"
 */
function normalizarTitulo(h: string): string {
  let s = h.replace(/\s+$/, "");        // remove brancos finais
  s = s.replace(/\.\s*$/, "");          // remove ponto final
  s = s.replace(/\.(?=\s)/g, ",");      // ponto no meio (fim de frase) vira vírgula
  return s;
}

// ============================================================
// EXTRAÇÃO DE RÓTULO
// ============================================================

interface RotuloExtraido {
  campo: keyof SlideData;
  valorInline: string;
}

function extrairRotulo(linha: string): RotuloExtraido | null {
  // Regex captura: ROTULO: valor   ou   ROTULO :  valor   ou   ROTULO valor
  const match = linha.match(/^[\s]*([A-ZÁÉÍÓÚÂÊÔÃÕÇ_]+)\s*[:：]\s*(.*)$/);
  if (!match) return null;

  const rotuloBruto = match[1].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const valorInline = match[2].trim();

  const campo = ROTULOS[rotuloBruto];
  if (!campo) {
    if (ROTULOS_SUBHEAD.has(rotuloBruto)) {
      return { campo: "__subhead" as any, valorInline };
    }
    return null;
  }

  return { campo, valorInline };
}

// ============================================================
// APLICAÇÃO DO CAMPO NO SLIDE (com validações)
// ============================================================

function aplicarCampo(
  slide: SlideData,
  campo: keyof SlideData,
  valor: string,
  avisos: string[]
): void {
  if (!valor) return;

  // SUBHEAD: 2ª linha do título — anexa ao headline já existente
  if ((campo as any) === "__subhead") {
    slide.headline = slide.headline ? `${slide.headline}\n${valor}` : valor;
    return;
  }

  switch (campo) {
    case "kicker":
    case "headline":
    case "corpo":
    case "destaque":
    case "numero":
    case "legendaFoto":
    case "textoPill":
    case "imgPrompt":
      (slide as any)[campo] = valor;
      if (campo === "textoPill") {
        slide.mostrarPill = true;
      }
      if (campo === "imgPrompt") {
        slide.imgStatus = "idle";
      }
      break;

    case "layout":
      const layoutNormalizado = valor.toLowerCase().trim().replace(/[\s-]+/g, "_");
      if (LAYOUTS_VALIDOS.includes(layoutNormalizado as LayoutId)) {
        slide.layout = layoutNormalizado as LayoutId;
      } else {
        avisos.push(
          `Layout "${valor}" não reconhecido. Valores válidos: ${LAYOUTS_VALIDOS.slice(0, 5).join(", ")}, ...`
        );
      }
      break;

    case "corFundo":
      const corNormalizada = valor.toLowerCase().trim();
      if (CORES_FUNDO_VALIDAS.includes(corNormalizada as SlideData["corFundo"])) {
        slide.corFundo = corNormalizada as SlideData["corFundo"];
      } else {
        avisos.push(
          `Cor de fundo "${valor}" não reconhecida. Use: preto, amarelo, bege ou branco.`
        );
      }
      break;

    default:
      // Outros campos do SlideData não são suportados pelo parser de texto
      break;
  }
}

// ============================================================
// SINCRONIZAÇÃO COM SLIDES EXISTENTES
// ============================================================

/**
 * Combina os slides parseados com os slides atuais do app.
 * - Se o texto tem MAIS slides → adiciona novos no fim
 * - Se o texto tem MENOS slides → remove os extras (mas preserva fotos no que sobra)
 * - Sempre preserva fotos e overrides já configurados nos slides existentes
 */
/**
 * v7.9.1: aplica o CONTEÚDO colado (só os textos) sobre uma ESTRUTURA base
 * (layouts + cores da estrutura padrão do tema). Usado pelo "Colar conteúdo"
 * para sempre começar do template padrão, na cor da vez, e só preencher o texto.
 * O layout/cor do texto colado é ignorado — a estrutura manda.
 */
export function aplicarNaEstrutura(base: SlideData[], conteudo: SlideData[]): SlideData[] {
  return conteudo.map((c, i) => {
    const b = base[i];
    if (!b) return c; // conteúdo além da estrutura padrão: usa como veio
    return {
      ...b,
      kicker: c.kicker,
      headline: c.headline,
      corpo: c.corpo,
      destaque: c.destaque,
      numero: c.numero,
      legendaFoto: c.legendaFoto,
      textoPill: c.textoPill,
      mostrarPill: c.mostrarPill,
      imgPrompt: c.imgPrompt,
      imgStatus: c.imgStatus,
    };
  });
}

export function sincronizarSlides(
  slidesAtuais: SlideData[],
  slidesParseados: SlideData[]
): SlideData[] {
  return slidesParseados.map((novo, i) => {
    const atual = slidesAtuais[i];
    if (atual) {
      // Preserva fotos e configs visuais do slide existente
      return {
        ...novo,
        id: atual.id, // mantém ID estável
        fotoUrl: atual.fotoUrl,
        fotoUrl2: atual.fotoUrl2,
        fotoOrigem: atual.fotoOrigem,
        imgStatus: atual.fotoUrl ? atual.imgStatus : novo.imgStatus,
        imgErro: atual.fotoUrl ? atual.imgErro : undefined,
        // Preserva customizações visuais se já existirem
        corKicker: atual.corKicker,
        corHeadline: atual.corHeadline,
        corDestaque: atual.corDestaque,
        fonteHeadline: atual.fonteHeadline,
        headlineCaps: atual.headlineCaps,
        headlineEscala: atual.headlineEscala,
      };
    }
    return novo;
  });
}

// ============================================================
// EXEMPLO DE FORMATO (pra mostrar pro usuário no UI)
// ============================================================

export const EXEMPLO_TEXTO_COLADO = `KICKER: TESE EDITORIAL Nº 1
HEADLINE: Por décadas, algo foi
assunto de poucos.
CORPO: Aqui você desenvolve o contexto histórico do tema em 2-3 frases.
DESTAQUE: E então aconteceu a virada.
LAYOUT: foto_cheia
CORFUNDO: amarelo
IMGPROMPT: pessoa brasileira lendo perto de uma janela ampla, luz natural de manhã, espaço livre à esquerda para texto

---

KICKER: O DADO QUE VIROU A CHAVE
HEADLINE: +32%
NUMERO: +32%
CORPO: Justifique o número com 2-3 frases.
DESTAQUE: foi a métrica que ninguém estava acompanhando.
LAYOUT: tipografia_pura
CORFUNDO: preto

---

KICKER: SIGA, SALVE, COMPARTILHE
HEADLINE: Continue
por dentro.
DESTAQUE: Novos estudos toda semana.
PILL: @POTENCIAL · SIGA
LAYOUT: foto_cheia
CORFUNDO: preto
IMGPROMPT: mãos segurando um celular com app financeiro aberto, fundo neutro desfocado, luz suave`;
