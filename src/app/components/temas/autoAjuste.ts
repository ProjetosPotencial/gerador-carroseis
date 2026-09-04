/**
 * MOTOR DE AUTO-AJUSTE TIPOGRÁFICO — v7.28
 * ============================================================
 * Resolve a causa raiz da diagramação manual: até a v7.27 o corpo da fonte
 * era uma constante por layout (`tamanho = 88`) e o texto simplesmente
 * transbordava a área útil. O ajuste sobrava pro operador, slide a slide,
 * via escalaGeral / headlineEscala / tamanhoPx / tracking / caps.
 *
 * Aqui o tamanho passa a ser CALCULADO: mede o texto de verdade no DOM e
 * faz busca binária no corpo da fonte até caber na caixa (altura e teto de
 * linhas). Quando não cabe nem no piso, não encolhe até ficar ilegível:
 * devolve um veredito dizendo quantos caracteres precisam sair da copy.
 *
 * Uso típico (dentro dos primitivos):
 *   const r = ajustarTexto(texto, estiloCss, { largura, maxLinhas: 4, min: 44, max: 104, lineHeight: 0.98 });
 *   <div style={{ ...estiloCss, fontSize: r.fontSize }}>{texto}</div>
 */

// ============================================================
// TIPOS
// ============================================================

export interface EstiloMedicao {
  fontFamily: string;
  fontWeight: number | string;
  letterSpacing: string;
  textTransform: string;
  fontStyle?: string;
}

export interface CaixaAjuste {
  /** Largura disponível em px. Obrigatória: sem largura não há quebra de linha. */
  largura: number;
  /** Altura útil em px. Opcional — quando ausente, só o teto de linhas manda. */
  alturaMax?: number;
  /** Teto de linhas. É a trava que protege todos os layouts sem caixa declarada. */
  maxLinhas: number;
  /** Piso do corpo da fonte. Abaixo disso o texto deixa de ser legível no feed. */
  min: number;
  /** Teto do corpo da fonte, normalmente o tamanho base do layout. */
  max: number;
  lineHeight: number;
  /** true mantém as quebras manuais (\n) que o operador digitou. */
  preLine?: boolean;
}

export interface ResultadoAjuste {
  /** Corpo da fonte calculado, em px. */
  fontSize: number;
  /** Coube na caixa respeitando altura e teto de linhas. */
  coube: boolean;
  /** Quantas linhas o texto ocupa no tamanho calculado. */
  linhas: number;
  /** Altura ocupada em px. */
  altura: number;
  /** Quando não coube: estimativa de caracteres a cortar da copy. */
  cortarCaracteres: number;
  /** true quando o texto encolheu além de 15% do teto (sinal de copy longa). */
  apertado: boolean;
  /** true quando sobra mais de metade da caixa (dá pra escrever mais). */
  folgado: boolean;
}

// ============================================================
// NÓ DE MEDIÇÃO
// ============================================================

let no: HTMLDivElement | null = null;

function obterNo(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  if (no && no.isConnected) return no;
  no = document.createElement("div");
  no.setAttribute("data-medicao-tipografica", "");
  no.style.cssText = [
    "position:fixed",
    "left:-99999px",
    "top:0",
    "visibility:hidden",
    "pointer-events:none",
    "margin:0",
    "padding:0",
    "border:0",
    "contain:layout style",
    "word-break:normal",
    "overflow-wrap:break-word",
  ].join(";");
  document.body.appendChild(no);
  return no;
}

/** Cache de medições. A chave carrega tudo que altera o resultado. */
const cache = new Map<string, ResultadoAjuste>();
const LIMITE_CACHE = 900;

function chave(texto: string, e: EstiloMedicao, c: CaixaAjuste, geracaoFontes: number): string {
  return [
    geracaoFontes,
    texto,
    e.fontFamily,
    e.fontWeight,
    e.letterSpacing,
    e.textTransform,
    e.fontStyle || "",
    Math.round(c.largura),
    c.alturaMax ? Math.round(c.alturaMax) : "-",
    c.maxLinhas,
    c.min,
    c.max,
    c.lineHeight,
    c.preLine ? 1 : 0,
  ].join("|");
}

// ============================================================
// PRONTIDÃO DAS FONTES
// ============================================================
// Medir antes das webfonts carregarem produz número errado (as métricas da
// fonte de fallback são outras). O contador abaixo invalida o cache e força
// recálculo quando as fontes ficam prontas.

let geracaoFontes = 0;
const ouvintes = new Set<() => void>();

export function assinarFontes(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function geracaoAtualFontes(): number {
  return geracaoFontes;
}

function bumpFontes() {
  geracaoFontes += 1;
  cache.clear();
  ouvintes.forEach((f) => {
    try {
      f();
    } catch {
      /* ouvinte quebrado não derruba os outros */
    }
  });
}

if (typeof document !== "undefined" && (document as any).fonts) {
  const fontes: any = (document as any).fonts;
  fontes.ready?.then?.(() => bumpFontes());
  fontes.addEventListener?.("loadingdone", () => bumpFontes());
}

// ============================================================
// MEDIÇÃO
// ============================================================

interface Medida {
  altura: number;
  linhas: number;
  largura: number;
}

function medir(texto: string, e: EstiloMedicao, c: CaixaAjuste, fontSize: number): Medida {
  const n = obterNo();
  if (!n) {
    // SSR ou ambiente sem DOM: estimativa grosseira só pra não quebrar.
    const porLinha = Math.max(1, Math.floor(c.largura / (fontSize * 0.52)));
    const linhas = Math.max(1, Math.ceil(texto.length / porLinha));
    return { altura: linhas * fontSize * c.lineHeight, linhas, largura: c.largura };
  }
  n.style.width = c.largura + "px";
  n.style.fontFamily = e.fontFamily;
  n.style.fontWeight = String(e.fontWeight);
  n.style.letterSpacing = e.letterSpacing || "normal";
  n.style.textTransform = e.textTransform || "none";
  n.style.fontStyle = e.fontStyle || "normal";
  n.style.lineHeight = String(c.lineHeight);
  n.style.whiteSpace = c.preLine ? "pre-line" : "normal";
  n.style.fontSize = fontSize + "px";
  n.textContent = texto;

  const altura = n.scrollHeight;
  const alturaLinha = fontSize * c.lineHeight;
  const linhas = Math.max(1, Math.round(altura / alturaLinha));
  return { altura, linhas, largura: n.scrollWidth };
}

// ============================================================
// AJUSTE
// ============================================================

/**
 * Calcula o maior corpo de fonte que cabe na caixa.
 * Busca binária em 14 passos: converge com precisão sub-pixel e roda em
 * microssegundos porque a medição acontece num nó fora do fluxo de layout.
 */
export function ajustarTexto(
  texto: string,
  estilo: EstiloMedicao,
  caixa: CaixaAjuste
): ResultadoAjuste {
  const t = (texto || "").trim();
  if (!t) {
    return { fontSize: caixa.max, coube: true, linhas: 0, altura: 0, cortarCaracteres: 0, apertado: false, folgado: false };
  }
  if (!(caixa.largura > 0)) {
    // Sem largura conhecida ainda (primeiro render antes da medição do container).
    return { fontSize: caixa.max, coube: true, linhas: 1, altura: 0, cortarCaracteres: 0, apertado: false, folgado: false };
  }

  const k = chave(t, estilo, caixa, geracaoFontes);
  const emCache = cache.get(k);
  if (emCache) return emCache;

  const cabe = (m: Medida): boolean => {
    if (m.linhas > caixa.maxLinhas) return false;
    if (caixa.alturaMax != null && m.altura > caixa.alturaMax + 0.5) return false;
    // Palavra única mais larga que a caixa: estoura na horizontal.
    if (m.largura > caixa.largura + 1) return false;
    return true;
  };

  // Atalho: se já cabe no teto, nem precisa buscar.
  const noTeto = medir(t, estilo, caixa, caixa.max);
  let resultado: ResultadoAjuste;

  if (cabe(noTeto)) {
    const refAltura = caixa.alturaMax ?? caixa.maxLinhas * caixa.max * caixa.lineHeight;
    resultado = {
      fontSize: caixa.max,
      coube: true,
      linhas: noTeto.linhas,
      altura: noTeto.altura,
      cortarCaracteres: 0,
      apertado: false,
      folgado: noTeto.altura < refAltura * 0.5,
    };
  } else {
    let lo = caixa.min;
    let hi = caixa.max;
    let melhor: number | null = null;
    let melhorMedida: Medida | null = null;

    for (let i = 0; i < 14; i++) {
      const meio = (lo + hi) / 2;
      const m = medir(t, estilo, caixa, meio);
      if (cabe(m)) {
        melhor = meio;
        melhorMedida = m;
        lo = meio;
      } else {
        hi = meio;
      }
    }

    if (melhor == null) {
      // Não cabe nem no piso. O motor para de encolher e devolve o veredito:
      // o problema é a copy, não a formatação.
      const noPiso = medir(t, estilo, caixa, caixa.min);
      const limiteAltura = caixa.alturaMax ?? caixa.maxLinhas * caixa.min * caixa.lineHeight;
      const razao = Math.min(
        limiteAltura / Math.max(1, noPiso.altura),
        caixa.maxLinhas / Math.max(1, noPiso.linhas)
      );
      resultado = {
        fontSize: caixa.min,
        coube: false,
        linhas: noPiso.linhas,
        altura: noPiso.altura,
        cortarCaracteres: Math.max(1, Math.round(t.length * (1 - Math.min(1, razao)))),
        apertado: true,
        folgado: false,
      };
    } else {
      const px = Math.round(melhor * 10) / 10;
      resultado = {
        fontSize: px,
        coube: true,
        linhas: melhorMedida ? melhorMedida.linhas : 1,
        altura: melhorMedida ? melhorMedida.altura : 0,
        cortarCaracteres: 0,
        apertado: px < caixa.max * 0.85,
        folgado: false,
      };
    }
  }

  if (cache.size > LIMITE_CACHE) cache.clear();
  cache.set(k, resultado);
  return resultado;
}

// ============================================================
// PISO E TETO PADRÃO POR ELEMENTO
// ============================================================
// Aplicados quando o layout não declara caixa própria. São o que permite
// ligar o motor nos 33 layouts existentes sem reescrever nenhum deles.

export type ElementoAjustavel = "kicker" | "headline" | "corpo" | "destaque" | "pill" | "numero";

export interface PadraoElemento {
  maxLinhas: number;
  /** Fração do tamanho base que serve de piso. */
  pisoRelativo: number;
  /** Piso absoluto em px, o que for maior. */
  pisoAbsoluto: number;
}

export const PADROES: Record<ElementoAjustavel, PadraoElemento> = {
  kicker: { maxLinhas: 2, pisoRelativo: 0.7, pisoAbsoluto: 10 },
  headline: { maxLinhas: 5, pisoRelativo: 0.45, pisoAbsoluto: 28 },
  corpo: { maxLinhas: 7, pisoRelativo: 0.7, pisoAbsoluto: 16 },
  destaque: { maxLinhas: 4, pisoRelativo: 0.7, pisoAbsoluto: 16 },
  pill: { maxLinhas: 1, pisoRelativo: 0.75, pisoAbsoluto: 10 },
  numero: { maxLinhas: 1, pisoRelativo: 0.5, pisoAbsoluto: 24 },
};

export function pisoPara(elemento: ElementoAjustavel, tamanhoBase: number): number {
  const p = PADROES[elemento];
  return Math.max(p.pisoAbsoluto, Math.round(tamanhoBase * p.pisoRelativo));
}

// ============================================================
// DIAGNÓSTICO POR SLIDE
// ============================================================
// Alimenta o selo "pronto para publicar" na interface. Cada bloco reporta o
// que aconteceu com ele; a UI lê o consolidado do slide.

export interface OcorrenciaBloco {
  elemento: ElementoAjustavel;
  coube: boolean;
  fontSize: number;
  linhas: number;
  cortarCaracteres: number;
  apertado: boolean;
  folgado: boolean;
}

export type NivelDiagnostico = "ok" | "atencao" | "erro";

export interface DiagnosticoSlide {
  nivel: NivelDiagnostico;
  mensagem: string;
  blocos: OcorrenciaBloco[];
}

const diagnosticos = new Map<string, Map<ElementoAjustavel, OcorrenciaBloco>>();
const ouvintesDiag = new Set<() => void>();
let agendado = false;

function notificarDiag() {
  if (agendado) return;
  agendado = true;
  const disparar = () => {
    agendado = false;
    ouvintesDiag.forEach((f) => {
      try {
        f();
      } catch {
        /* ignora */
      }
    });
  };
  if (typeof queueMicrotask === "function") queueMicrotask(disparar);
  else setTimeout(disparar, 0);
}

export function registrarOcorrencia(slideId: string, o: OcorrenciaBloco): void {
  if (!slideId) return;
  let m = diagnosticos.get(slideId);
  if (!m) {
    m = new Map();
    diagnosticos.set(slideId, m);
  }
  const anterior = m.get(o.elemento);
  if (
    anterior &&
    anterior.coube === o.coube &&
    anterior.fontSize === o.fontSize &&
    anterior.linhas === o.linhas &&
    anterior.cortarCaracteres === o.cortarCaracteres &&
    anterior.apertado === o.apertado &&
    anterior.folgado === o.folgado
  ) {
    return;
  }
  m.set(o.elemento, o);
  notificarDiag();
}

export function limparDiagnostico(slideId: string): void {
  if (diagnosticos.delete(slideId)) notificarDiag();
}

export function assinarDiagnostico(fn: () => void): () => void {
  ouvintesDiag.add(fn);
  return () => ouvintesDiag.delete(fn);
}

const NOMES: Record<ElementoAjustavel, string> = {
  kicker: "kicker",
  headline: "headline",
  corpo: "corpo",
  destaque: "destaque",
  pill: "pill",
  numero: "número",
};

export function diagnosticoDoSlide(slideId: string): DiagnosticoSlide {
  const m = diagnosticos.get(slideId);
  const blocos = m ? Array.from(m.values()) : [];

  const estouraram = blocos.filter((b) => !b.coube);
  if (estouraram.length) {
    const detalhe = estouraram
      .map((b) => `${NOMES[b.elemento]}: corte ~${b.cortarCaracteres} caracteres`)
      .join(" · ");
    return { nivel: "erro", mensagem: `Não cabe. ${detalhe}`, blocos };
  }

  const apertados = blocos.filter((b) => b.apertado);
  if (apertados.length) {
    return {
      nivel: "atencao",
      mensagem:
        `Coube encolhendo ${apertados.map((b) => NOMES[b.elemento]).join(", ")}. ` +
        "Legível, mas com menos presença no feed.",
      blocos,
    };
  }

  const folgados = blocos.filter((b) => b.folgado && b.elemento === "headline");
  if (folgados.length) {
    return { nivel: "atencao", mensagem: "Sobra caixa na headline. Dá pra escrever mais.", blocos };
  }

  return { nivel: "ok", mensagem: "Pronto para publicar", blocos };
}

/** Consolida vários slides (usado no selo da semana e antes do export em lote). */
export function diagnosticoDeVarios(slideIds: string[]): DiagnosticoSlide {
  const todos: OcorrenciaBloco[] = [];
  let piorNivel: NivelDiagnostico = "ok";
  const mensagens: string[] = [];

  slideIds.forEach((id, i) => {
    const d = diagnosticoDoSlide(id);
    todos.push(...d.blocos);
    if (d.nivel === "erro") {
      piorNivel = "erro";
      mensagens.push(`slide ${i + 1}: ${d.mensagem}`);
    } else if (d.nivel === "atencao" && piorNivel !== "erro") {
      piorNivel = "atencao";
      mensagens.push(`slide ${i + 1}: ${d.mensagem}`);
    }
  });

  if (piorNivel === "ok") {
    return { nivel: "ok", mensagem: `${slideIds.length} slides prontos para publicar`, blocos: todos };
  }
  return { nivel: piorNivel, mensagem: mensagens.slice(0, 4).join(" | "), blocos: todos };
}
