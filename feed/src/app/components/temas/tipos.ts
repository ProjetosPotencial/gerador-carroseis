import type React from "react";

// ============================================================
// TIPOS COMPARTILHADOS ENTRE TODOS OS TEMAS DE CARROSSEL
// ============================================================

/**
 * IDs dos temas disponíveis. Cada tema tem seus próprios layouts.
 * Novos temas são adicionados aqui + arquivo correspondente em /temas.
 */
export type TemaId = "brands_decoded_classic" | "editorial_refined" | "tweet_style" | "keynote_minimal" | "editorial_pontencial";

/** ID genérico de layout — cada tema define o seu conjunto */
export type LayoutId = string;

/** Famílias de fonte disponíveis. */
export type FonteId =
  | "archivo"
  | "inter"
  | "impact"
  | "instrument_serif"
  | "poppins"
  | "kufam"
  | "jetbrains_mono";

/** Alias retrocompatível pra fontes do headline (v6 e anteriores). */
export type FonteHeadline = FonteId;

export const FONTE_FAMILIAS: Record<FonteId, string> = {
  archivo: "'Archivo', 'Helvetica Neue', sans-serif",
  inter: "'Inter', sans-serif",
  impact: "Impact, 'Arial Black', sans-serif",
  instrument_serif: "'Instrument Serif', 'Playfair Display', Georgia, serif",
  poppins: "'Poppins', sans-serif",
  kufam: "'Kufam', sans-serif",
  jetbrains_mono: "'JetBrains Mono', ui-monospace, monospace",
};

export const FONTE_LABELS: Record<FonteId, string> = {
  archivo: "Archivo (padrão)",
  inter: "Inter",
  impact: "Impact",
  instrument_serif: "Instrument Serif",
  poppins: "Poppins",
  kufam: "Kufam",
  jetbrains_mono: "JetBrains Mono",
};

/** Pesos de fonte disponíveis. */
export type PesoFonte = 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const PESO_LABELS: Record<PesoFonte, string> = {
  300: "Light (300)",
  400: "Regular (400)",
  500: "Medium (500)",
  600: "Semibold (600)",
  700: "Bold (700)",
  800: "Extrabold (800)",
  900: "Black (900)",
};

/** Modos de capitalização. */
export type ModoCaps = "caps" | "minusculas" | "title" | "padrao";

export const CAPS_LABELS: Record<ModoCaps, string> = {
  padrao: "Padrão do layout",
  caps: "TUDO MAIÚSCULAS",
  minusculas: "tudo minúsculas",
  title: "Título Capitalizado",
};

/** Override tipográfico de um elemento (kicker, headline, corpo, etc.) */
export interface TipografiaOverride {
  /** Multiplicador de tamanho relativo ao default do layout (1 = padrão, 1.2 = +20%) */
  escala?: number;
  /** Tamanho absoluto em px — quando definido, ignora escala */
  tamanhoPx?: number;
  /** Família de fonte */
  fonte?: FonteId;
  /** Peso (300-900) */
  peso?: PesoFonte;
  /** Modo de capitalização */
  caps?: ModoCaps;
  /** Letter-spacing em px (positivo afasta, negativo aproxima) */
  tracking?: number;
}

// ============================================================
// SLIDE DATA — estado de cada slide, independente de tema
// ============================================================

export interface SlideData {
  id: string;
  layout: LayoutId;

  // Textos
  kicker: string;
  headline: string;
  corpo: string;
  destaque: string;
  numero: string;           // ex.: "+32%" — big number opcional
  legendaFoto: string;
  textoPill: string;
  mostrarPill: boolean;

  // Fotos
  fotoUrl: string;
  fotoUrl2: string;

  // ============ GERAÇÃO DE IMAGEM COM IA (v7.8) ============
  imgPrompt?: string;
  imgStatus?: "idle" | "gerando" | "ok" | "erro";
  imgErro?: string;
  fotoOrigem?: "ia" | "manual";

  /** v7.7.23: zoom da foto principal (1-3, default 1). */
  fotoZoom?: number;
  /** v7.7.23: offset X da foto em % (-50 a +50, default 0). */
  fotoOffsetX?: number;
  /** v7.7.23: offset Y da foto em % (-50 a +50, default 0). */
  fotoOffsetY?: number;

  // Flags genéricas (cada tema decide como usar)
  corFundo: "preto" | "amarelo" | "bege" | "branco"; // paleta do slide

  // Customizações locais por slide (sobrescrevem as globais do tema)
  corKicker?: string;
  corHeadline?: string;
  corDestaque?: string;
  /** v7.5: cor dos textos da Topbar (marca + textos do topo) */
  corTopbar?: string;
  /** v7.25: texto do topbar (override do marca). */
  textoTopbar?: string;
  /** v7.25: tamanho do texto do topbar (px). */
  tamTopbar?: number;
  /** v7.5: cor do texto/rodapé inferior (ex: "▶ BRANDS PAGE 5/000") */
  corRodape?: string;
  /** v7.5: cor da numeração do slide ("01 / 06") */
  corNumero?: string;
  fonteHeadline?: FonteHeadline;

  // ============ VISIBILIDADE DE ELEMENTOS (v7.6) ============
  /** Mostrar setinha indicativa de "deslize" (default true). */
  mostrarSetinha?: boolean;
  /** Mostrar Topbar (marca + numeração no topo). Default true. */
  mostrarTopbar?: boolean;
  /** Mostrar rodapé (texto inferior, ex. "▶ BRANDS PAGE 5/000"). Default true. */
  mostrarRodape?: boolean;

  // ============ SETINHA E TEXTURA (v7.7.2) ============
  /** Tamanho da setinha em px (default 56). */
  tamSetinha?: number;
  /** Cor da setinha (override; default usa accent do tema). */
  corSetinha?: string;
  /** Espessura do stroke do círculo da setinha (default 3). */
  espessuraSetinha?: number;
  /** Mostrar textura overlay granulada (default false no carrossel). */
  mostrarTextura?: boolean;
  /** Opacidade da textura (0-1, default 0.75). */
  opacidadeTextura?: number;
  /** Override: forçar CAPS (true) ou minúsculas (false). undefined = usa default do layout */
  headlineCaps?: boolean;
  /** Override: multiplicador do tamanho default do layout (1 = padrão, 1.2 = +20%, 0.8 = -20%) */
  headlineEscala?: number;

  // ============ TIPOGRAFIA AVANÇADA POR ELEMENTO (v7) ============
  /** Multiplicador global aplicado a todos os elementos (modo simples) */
  escalaGeral?: number;
  /** Override tipográfico do KICKER */
  tipoKicker?: TipografiaOverride;
  /** Override tipográfico do HEADLINE (complementa fonteHeadline/headlineCaps/headlineEscala) */
  tipoHeadline?: TipografiaOverride;
  /** Override tipográfico do CORPO */
  tipoCorpo?: TipografiaOverride;
  /** Override tipográfico do DESTAQUE */
  tipoDestaque?: TipografiaOverride;
  /** Override tipográfico do BIG NUMBER */
  tipoNumero?: TipografiaOverride;
  /** Override tipográfico do PILL/CTA */
  tipoPill?: TipografiaOverride;
}

/** Cria um novo slide vazio com valores default. */
export function criarSlideVazio(layout: LayoutId, corFundo: SlideData["corFundo"] = "preto"): SlideData {
  return {
    id: Math.random().toString(36).substring(2, 10),
    layout,
    kicker: "",
    headline: "",
    corpo: "",
    destaque: "",
    numero: "",
    legendaFoto: "",
    textoPill: "",
    mostrarPill: false,
    fotoUrl: "",
    fotoUrl2: "",
    corFundo,
  };
}

// ============================================================
// CONFIG DE CADA TEMA
// ============================================================

/** Define um layout dentro de um tema. */
export interface LayoutDef {
  id: LayoutId;
  nome: string;
  descricao: string;
  /** Se o layout usa foto (aparece no painel de upload). */
  usaFoto: boolean;
  /** Se o layout usa segunda foto (dupla_foto, etc). */
  usaDuasFotos?: boolean;
  /** Cores de fundo permitidas. Se omitido, usa paleta default do tema. */
  coresFundoPermitidas?: SlideData["corFundo"][];
  /** Componente React que renderiza o layout. */
  render: (props: LayoutRenderProps) => React.ReactElement;
}

/** Props que cada componente de layout recebe. */
export interface LayoutRenderProps {
  slide: SlideData;
  tema: TemaConfig;
  marca: string;
  numero: string; // "01 / 12"
  coresResolvidas: CoresResolvidas;
  /** Se este é o último slide do carrossel (pra esconder seta indicativa) */
  ehUltimo?: boolean;
  /** v7.7.23: callback de drag da foto principal. Quando undefined, drag desativado (modo export). */
  onSlideChange?: (patch: Partial<SlideData>) => void;
}

/** Cores efetivas usadas no slide (slide > tema). */
export interface CoresResolvidas {
  fundo: string;
  texto: string;         // cor do texto padrão sobre o fundo
  accent: string;        // amarelo/destaque do tema
  kicker: string;
  headline: string;
  destaque: string;
  corpo: string;
  topbar: string;
  /** v7.5: cor do rodapé (texto inferior, ex: "▶ BRANDS PAGE 5/000") */
  rodape: string;
  /** v7.5: cor da numeração ("01 / 06") */
  numero: string;
}

/** Config de um tema completo. */
export interface TemaConfig {
  id: TemaId;
  nome: string;
  descricao: string;

  // Paleta base
  cores: {
    preto: string;
    branco: string;
    bege: string;
    amarelo: string;     // accent principal
  };

  // Defaults (podem ser sobrescritos por slide)
  fonteHeadlineDefault: FonteHeadline;
  fonteCorpo: string;                    // sempre fixo — fonte do corpo
  corKickerDefault: string;              // cor sobre fundo "escuro default"
  corHeadlineDefault: string;
  corDestaqueDefault: string;

  // Layouts disponíveis nesse tema
  layouts: LayoutDef[];

  // Slides iniciais sugeridos quando o usuário escolhe esse tema
  slidesExemplo: SlideData[];
}

// ============================================================
// HELPERS DE RESOLUÇÃO DE CORES
// ============================================================

/**
 * Calcula as cores efetivas de um slide baseado em:
 *   1. Tema (defaults)
 *   2. Cor de fundo do slide (preto/amarelo/bege/branco → resolvem contraste)
 *   3. Overrides explícitos do slide (corKicker, corHeadline, corDestaque)
 */
export function resolverCores(slide: SlideData, tema: TemaConfig): CoresResolvidas {
  const { cores } = tema;

  // Mapeia "corFundo" do slide para a cor real
  const fundoMap: Record<SlideData["corFundo"], string> = {
    preto: cores.preto,
    amarelo: cores.amarelo,
    bege: cores.bege,
    branco: cores.branco,
  };
  const fundo = fundoMap[slide.corFundo] || cores.preto;

  // Texto default sobre esse fundo (contraste automático)
  const fundoEscuro = slide.corFundo === "preto";
  const textoPadrao = fundoEscuro ? cores.branco : cores.preto;

  // Accent: em fundo amarelo, o accent vira preto (senão ficaria invisível)
  const accentEfetivo = slide.corFundo === "amarelo" ? cores.preto : cores.amarelo;

  // Cor padrão da Topbar/rodapé/numeração — segue contraste mas pode ser sobrescrita
  const topbarPadrao = fundoEscuro ? cores.amarelo : cores.preto;

  return {
    fundo,
    texto: textoPadrao,
    accent: accentEfetivo,
    topbar: slide.corTopbar || topbarPadrao,
    rodape: slide.corRodape || textoPadrao,
    numero: slide.corNumero || slide.corTopbar || topbarPadrao,
    kicker: slide.corKicker || (fundoEscuro ? cores.amarelo : cores.preto),
    headline: slide.corHeadline || (fundoEscuro ? cores.amarelo : cores.preto),
    destaque: slide.corDestaque || accentEfetivo,
    corpo: textoPadrao,
  };
}

/** Resolve a fonte do headline (slide > tema). */
export function resolverFonteHeadline(slide: SlideData, tema: TemaConfig): string {
  const fam = slide.fonteHeadline || tema.fonteHeadlineDefault;
  return FONTE_FAMILIAS[fam];
}

/**
 * Resolve se o headline usa caps.
 * `padraoLayout` é o comportamento default do layout.
 * Se o slide tiver override explícito, usa ele.
 */
export function resolverCapsHeadline(slide: SlideData, padraoLayout: boolean): boolean {
  if (slide.headlineCaps === undefined) return padraoLayout;
  return slide.headlineCaps;
}

/**
 * Aplica o multiplicador de escala ao tamanho base do headline.
 * Mínimo de 20px por segurança (pra layouts com tamanho pequeno não sumirem).
 */
export function resolverTamanhoHeadline(slide: SlideData, tamanhoBase: number): number {
  const escala = slide.headlineEscala ?? 1;
  return Math.max(20, Math.round(tamanhoBase * escala));
}

// ============================================================
// TIPOGRAFIA AVANÇADA POR ELEMENTO (v7)
// ============================================================

/** Identificadores de elementos tipográficos. */
export type ElementoTipo = "kicker" | "headline" | "corpo" | "destaque" | "numero" | "pill";

/** Mapa elemento → campo do SlideData onde fica o override. */
const CAMPO_OVERRIDE_POR_ELEMENTO: Record<ElementoTipo, keyof SlideData> = {
  kicker: "tipoKicker",
  headline: "tipoHeadline",
  corpo: "tipoCorpo",
  destaque: "tipoDestaque",
  numero: "tipoNumero",
  pill: "tipoPill",
};

/** Estilo CSS resolvido pra aplicar num elemento. */
export interface EstiloElemento {
  fontSize: number;       // px
  fontFamily: string;
  fontWeight: number;
  letterSpacing: string;  // ex.: "-0.5px" ou "0.05em"
  textTransform: "uppercase" | "lowercase" | "capitalize" | "none";
}

/** Configuração base de um elemento (default do layout/tema). */
export interface ConfigBaseElemento {
  tamanho: number;
  fonte?: FonteId;
  peso?: PesoFonte;
  caps?: boolean;          // default do layout: true ou false
  tracking?: number;       // px
}

/**
 * Resolve estilo final de um elemento aplicando overrides do slide.
 * Ordem de prioridade: slide.tipoXxx > slide.escalaGeral > base do layout.
 */
export function resolverEstiloElemento(
  slide: SlideData,
  elemento: ElementoTipo,
  base: ConfigBaseElemento
): EstiloElemento {
  const campo = CAMPO_OVERRIDE_POR_ELEMENTO[elemento];
  const override = (slide[campo] as TipografiaOverride | undefined) || {};
  const escalaGeral = slide.escalaGeral ?? 1;

  // === Tamanho ===
  let tamanho: number;
  if (override.tamanhoPx !== undefined) {
    // Override absoluto tem prioridade total
    tamanho = override.tamanhoPx;
  } else if (override.escala !== undefined) {
    tamanho = base.tamanho * override.escala * escalaGeral;
  } else {
    tamanho = base.tamanho * escalaGeral;
  }
  // Compatibilidade: se for headline e o slide tiver headlineEscala antigo, aplica
  if (elemento === "headline" && slide.headlineEscala !== undefined && override.escala === undefined && override.tamanhoPx === undefined) {
    tamanho = base.tamanho * slide.headlineEscala * escalaGeral;
  }
  tamanho = Math.max(10, Math.round(tamanho));

  // === Fonte ===
  let fonteId: FonteId;
  if (override.fonte) {
    fonteId = override.fonte;
  } else if (elemento === "headline" && slide.fonteHeadline) {
    // Compatibilidade com v6
    fonteId = slide.fonteHeadline;
  } else if (base.fonte) {
    fonteId = base.fonte;
  } else {
    fonteId = "archivo";
  }
  const fontFamily = FONTE_FAMILIAS[fonteId];

  // === Peso ===
  const peso = override.peso ?? base.peso ?? 700;

  // === Capitalização ===
  let textTransform: EstiloElemento["textTransform"] = "none";
  if (override.caps && override.caps !== "padrao") {
    if (override.caps === "caps") textTransform = "uppercase";
    else if (override.caps === "minusculas") textTransform = "lowercase";
    else if (override.caps === "title") textTransform = "capitalize";
  } else {
    // Sem override de caps: usa o padrão do layout
    // Compatibilidade: se for headline e tiver headlineCaps boolean, aplica
    if (elemento === "headline" && slide.headlineCaps !== undefined) {
      textTransform = slide.headlineCaps ? "uppercase" : "none";
    } else {
      textTransform = base.caps ? "uppercase" : "none";
    }
  }

  // === Tracking ===
  const trackingPx = override.tracking ?? base.tracking ?? 0;
  const letterSpacing = trackingPx === 0 ? "normal" : `${trackingPx}px`;

  return {
    fontSize: tamanho,
    fontFamily,
    fontWeight: peso,
    letterSpacing,
    textTransform,
  };
}

/** Converte um EstiloElemento em React.CSSProperties. */
export function estiloParaCss(estilo: EstiloElemento): React.CSSProperties {
  return {
    fontSize: estilo.fontSize,
    fontFamily: estilo.fontFamily,
    fontWeight: estilo.fontWeight,
    letterSpacing: estilo.letterSpacing,
    textTransform: estilo.textTransform,
  };
}

/**
 * Helper conveniente: resolve estilo de um elemento e retorna direto como CSSProperties.
 * Use em divs inline dos temas Tweet/Keynote pra aplicar overrides do slide automaticamente.
 *
 * Ex:
 *   <div style={{ ...aplicarTipoElemento(slide, "headline", { tamanho: 34, peso: 500 }), color: "red" }}>
 */
export function aplicarTipoElemento(
  slide: SlideData,
  elemento: ElementoTipo,
  base: ConfigBaseElemento
): React.CSSProperties {
  return estiloParaCss(resolverEstiloElemento(slide, elemento, base));
}
