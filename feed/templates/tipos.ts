// ============================================================
// TIPOS DO MÓDULO FEED/STORIES (v7.7)
// ============================================================

/**
 * ID único de cada template Feed/Stories.
 *
 * Nomenclatura: `<formato>_<descrição da estrutura>`. Os IDs descrevem a
 * ESTRUTURA VISUAL, não o conteúdo (que vai mudar a cada uso). Exemplos:
 *  - feed_pilula_headline   → foto + pílula superior + headline grande
 *  - feed_icone_cta         → foto + ícone + CTA outline
 *  - feed_amarelo_ilustracao → fundo amarelo + ilustração isométrica
 *  - feed_central_asset     → headline central + asset (cartões etc)
 *
 * v7.7.6: renomeados — antes eram "ipva_iptu_*", "rotativo_*", "oque_e_*",
 * "ate3_cartoes_*", o que misturava conteúdo de exemplo com estrutura visual.
 */
export type FeedTemplateId =
  // Implementados
  | "feed_pilula_headline"
  | "stories_pilula_headline"
  | "feed_icone_cta"
  | "stories_icone_cta"
  // Em construção (placeholders)
  | "feed_amarelo_ilustracao"
  | "stories_amarelo_ilustracao"
  | "feed_central_asset"
  | "stories_central_asset";

/** Formato da peça (impacta dimensões de export). */
export type FeedFormato = "feed" | "stories";

/** Dimensões em pixels reais (export PNG). */
export const DIMENSOES: Record<FeedFormato, { w: number; h: number }> = {
  feed: { w: 1080, h: 1350 },
  stories: { w: 1080, h: 1920 },
};

/**
 * Dados editáveis de um slide Feed/Stories.
 * Cada template usa só as propriedades que faz sentido pra ele;
 * as demais ficam undefined.
 */
export interface FeedSlideData {
  /** Identificador único do slide na lista. */
  id: string;
  /** Template usado por este slide. */
  templateId: FeedTemplateId;

  // ============ TEXTOS EDITÁVEIS ============
  /** Pílula superior pequena (ex: "Gestão financeira pessoal"). */
  pilula?: string;
  /** Headline principal (ex: "Organize"). */
  headline?: string;
  /** Subhead (ex: "seus impostos"). */
  subhead?: string;
  /** Tagline ou frase de complemento (ex: "Parcele IPVA e IPTU com inteligência"). */
  tagline?: string;
  /** Texto do botão / CTA (ex: "Conheça agora"). */
  cta?: string;

  // ============ FOTO ============
  /** URL da foto principal (Unsplash ou data:base64 do upload). */
  fotoUrl?: string;
  /** Posição/zoom da foto (object-position CSS, ex: "center", "top right"). */
  fotoPosicao?: string;

  // ============ GERAÇÃO DE IMAGEM COM IA (v7.8) ============
  /** Prompt de CENA da imagem (campo IMGPROMPT do "Colar texto"). Só a cena. */
  imgPrompt?: string;
  /** Estado da geração: idle | gerando | ok | erro. */
  imgStatus?: "idle" | "gerando" | "ok" | "erro";
  /** Mensagem curta de erro da última geração. */
  imgErro?: string;
  /** Origem da foto atual: "ia" (gerada) ou "manual" (upload/URL). */
  fotoOrigem?: "ia" | "manual";

  // ============ COR DO BLOB / DESTAQUE ============
  /** Cor do blob amarelo / footer / botão accent. Default depende do template. */
  corAccent?: string;

  // ============ OVERRIDES TIPOGRÁFICOS ============
  /** Multiplicador de tamanho aplicado a todos os textos (1 = padrão). */
  escalaGeral?: number;
  /** Override de cor do headline. */
  corHeadline?: string;
  /** Override de cor do subhead. */
  corSubhead?: string;

  // ============ AVANÇADO: por elemento (v7.7.1) ============
  /** Peso fonte do headline (400-900). Default depende do template. */
  pesoHeadline?: number;
  /** Tamanho fonte do headline em px (no espaço 1080×1350/1920). */
  tamHeadline?: number;
  /** Italic no headline. */
  italicHeadline?: boolean;

  /** Peso fonte do subhead. */
  pesoSubhead?: number;
  /** Tamanho fonte do subhead em px. */
  tamSubhead?: number;
  /** Italic no subhead. */
  italicSubhead?: boolean;

  /** Peso fonte da tagline. */
  pesoTagline?: number;
  /** Tamanho fonte da tagline em px. */
  tamTagline?: number;
  /** Italic na tagline. */
  italicTagline?: boolean;

  // ============ CTA (botão) — v7.7.1 ============
  /** Cor do texto/borda do CTA. Default branco em foto, preto em fundo claro. */
  corCTA?: string;
  /** Peso fonte do CTA. */
  pesoCTA?: number;
  /** Tamanho fonte do CTA em px. */
  tamCTA?: number;
  /** Italic no CTA. */
  italicCTA?: boolean;

  // ============ ÍCONE — v7.7.1 ============
  /** Tamanho do ícone em px (templates que usam ícone, ex: Rotativo). */
  tamIcone?: number;
  /** Cor do ícone. */
  corIcone?: string;
  /** v7.7.2: Espessura do traço do ícone (lucide strokeWidth). 0.5-3, default 2. */
  espessuraIcone?: number;
  /**
   * v7.7.19: Nome do ícone Lucide (string PascalCase, ex: "RefreshCcw",
   * "DollarSign", "ShoppingCart"). Default depende do template.
   * Ver lista em https://lucide.dev/icons/
   */
  iconeNome?: string;

  // ============ FOTO — drag + zoom (v7.7.19) — pendente UI ============
  /**
   * Zoom da foto (1.0 = 100%, 1.5 = 150%, 3.0 = 300%). Default 1.0.
   * Quando >1, a foto fica maior que o canvas e o usuário pode arrastá-la
   * pra reposicionar.
   */
  fotoZoom?: number;
  /**
   * Offset X da foto em % (-50 a +50). Quando 0, fotoPosicao center.
   * Salvo automaticamente quando o usuário arrasta a foto no preview.
   */
  fotoOffsetX?: number;
  /** Offset Y da foto em % (-50 a +50). */
  fotoOffsetY?: number;

  // ============ ENTRELINHAS (line-height) — v7.7.9 ============
  /**
   * Line-height por elemento (controle deslizante 0.8 a 1.4 no painel).
   * Quando undefined, usa o default do template (variando por elemento).
   */
  lineHeightHeadline?: number;
  lineHeightSubhead?: number;
  lineHeightTagline?: number;
  lineHeightCTA?: number;

  // ============ CONTROLES TIPOGRÁFICOS PROFISSIONAIS — v7.7.10 ============
  /**
   * Letter-spacing (tracking) por elemento, em "em".
   * Range -0.05 a 0.1, step 0.005. Default depende do template.
   */
  letterSpacingPilula?: number;
  letterSpacingHeadline?: number;
  letterSpacingSubhead?: number;
  letterSpacingTagline?: number;
  letterSpacingCTA?: number;

  /** Alinhamento horizontal por elemento. Default depende do template. */
  alignPilula?: "left" | "center" | "right";
  alignHeadline?: "left" | "center" | "right";
  alignSubhead?: "left" | "center" | "right";
  alignTagline?: "left" | "center" | "right";
  alignCTA?: "left" | "center" | "right";

  /** Text-transform por elemento. */
  transformPilula?: "none" | "uppercase" | "lowercase" | "capitalize";
  transformHeadline?: "none" | "uppercase" | "lowercase" | "capitalize";
  transformSubhead?: "none" | "uppercase" | "lowercase" | "capitalize";
  transformTagline?: "none" | "uppercase" | "lowercase" | "capitalize";
  transformCTA?: "none" | "uppercase" | "lowercase" | "capitalize";

  /**
   * Margem inferior individual em px (empurra só este elemento pra baixo).
   * Step 8 (8-point grid). Default 0. Aplica nos templates _icone_cta como
   * espaço extra ABAIXO do elemento — útil pra ajuste fino sem mexer nos
   * gaps gerais.
   */
  mbPilula?: number;
  mbHeadline?: number;
  mbSubhead?: number;
  mbTagline?: number;
  mbCTA?: number;

  /**
   * Offset Y do bloco inteiro de texto (v7.7.17).
   * Move TODO o conteúdo verticalmente em px. Negativo = sobe, positivo = desce.
   * Range -200 a +200, step 8 (8pt grid). Default 0 (sem deslocamento).
   * Útil para ajustes finos de composição quando o bloco está ligeiramente
   * mal posicionado em relação à foto/textura/rodapé.
   */
  offsetYBloco?: number;

  // ============ PÍLULA (KICKER) — v7.7.10: agora com tipografia ============
  /** Tamanho fonte da pílula em px. Default depende do template (24 feed, 32 stories). */
  tamPilula?: number;
  /** Peso fonte da pílula. Default 700. */
  pesoPilula?: number;
  /** Italic na pílula. */
  italicPilula?: boolean;
  /** Line-height da pílula. Default 1.0. */
  lineHeightPilula?: number;
  /** Cor de texto da pílula (sobrepõe default marrom). */
  corPilula?: string;
  /** Cor de fundo da pílula (sobrepõe default creme). */
  corPilulaFundo?: string;

  // ============ ESPAÇAMENTOS (gaps verticais, 8pt grid) — v7.7.9 ============
  /**
   * Gaps verticais entre elementos do bloco de texto (templates _icone_cta).
   * Valores em px no espaço da peça (1080×1350/1920). Step 8 (8-point grid).
   * Quando undefined, usa default abaixo. Templates _pilula_headline têm
   * layout fixo por coordenadas absolutas — gaps não se aplicam a eles.
   *
   * Defaults:
   *  - gapIconeHeadline: 24
   *  - gapHeadlineSubhead: 32
   *  - gapSubheadCTA: 64 (sem tagline) | distribuído 60/40 com tagline
   *  - gapCTARodape: 72
   */
  gapIconeHeadline?: number;
  gapHeadlineSubhead?: number;
  gapSubheadCTA?: number;
  gapCTARodape?: number;

  // ============ TEXTURA OVERLAY — v7.7.2 ============
  /** Mostrar textura granulada por cima da peça (default true). */
  mostrarTextura?: boolean;
  /** Opacidade da textura (0-1). Default 0.75 (igual Figma). */
  opacidadeTextura?: number;
  /** Modo de mistura da textura. Default "overlay". */
  modoTextura?: "overlay" | "soft-light" | "multiply" | "normal";
  /** v7.7.4: Se TRUE, textura cobre só a foto (não invade rodapé amarelo). Default false. */
  mascaraTexturaSoFoto?: boolean;
  /** v7.7.4: Opacidade da textura SOMENTE no rodapé (override). @deprecated v7.7.6: rodapé é PNG separado, sempre por cima. */
  opacidadeTexturaRodape?: number;
  /** v7.7.4: Modo de blend da textura SOMENTE no rodapé (override). @deprecated v7.7.6 */
  modoTexturaRodape?: "overlay" | "soft-light" | "multiply" | "normal";

  // ============ RODAPÉ — v7.7.6 ============
  /**
   * Qual rodapé exibir. PNGs em /public/rodapes/.
   *  - "rodape_01" = amarelo cheio com grão (logo creme + URL preta)
   *  - "rodape_02" = creme com curva amarela à esquerda (logo amarelo + URL preta)
   * Default depende do template (ex: rotativo usa 01, ipva usa 02).
   */
  tipoRodape?: "rodape_01" | "rodape_02";

  // ============ GRADIENTE DE LEITURA — v7.7.6 ============
  /**
   * Gradiente sutil entre foto e textos (preto na base → transparente no topo)
   * pra garantir legibilidade dos textos sobre fotos claras/contrastadas.
   * Sempre clipado pra NÃO invadir o rodapé.
   */
  mostrarGradienteLeitura?: boolean;
  /** Opacidade do gradiente de leitura (0-1). Default 0.5. */
  opacidadeGradienteLeitura?: number;

  // ============ VISIBILIDADE ============
  /** Mostrar pílula superior (default true se template usa). */
  mostrarPilula?: boolean;
  /** Mostrar CTA (default true se template usa). */
  mostrarCTA?: boolean;
  /** Mostrar footer creme com URL + logo (default true se template usa). */
  mostrarFooter?: boolean;
  /** Mostrar ícone (default true se template usa ícone). */
  mostrarIcone?: boolean;
}

/** Cria um slide Feed vazio com defaults razoáveis. */
export function criarFeedSlideVazio(templateId: FeedTemplateId): FeedSlideData {
  return {
    id: Math.random().toString(36).substring(2, 10),
    templateId,
    pilula: "",
    headline: "",
    subhead: "",
    tagline: "",
    cta: "",
    fotoUrl: "",
    fotoPosicao: "center",
    corAccent: "#FFCB31",
    mostrarPilula: true,
    mostrarCTA: true,
    mostrarFooter: true,
  };
}

/** Metadados de cada template — pra mostrar no seletor de templates. */
export interface TemplateInfo {
  id: FeedTemplateId;
  nome: string;
  descricao: string;
  formato: FeedFormato;
  /** Campos editáveis que ESTE template usa (UI só mostra estes). */
  camposUsados: ("pilula" | "headline" | "subhead" | "tagline" | "cta" | "foto" | "corAccent")[];
  /** Slide de exemplo pra populá-lo automaticamente. */
  exemplo: Omit<FeedSlideData, "id">;
}

/** Paleta oficial Parcele Aqui (extraída dos SVGs). */
export const PARCELE_AQUI_CORES = {
  amareloPrincipal: "#FFCB31",
  amareloLogo: "#FFCC1B",
  amareloEscuro: "#DAA500",
  amareloEscuroAlt: "#E9D69F",
  cremeFooter: "#FFF9E8",
  marromTexto: "#371B01",
  pretoTexto: "#1C1815",
} as const;

/** Fonte oficial: Kufam (Google Fonts). */
export const FONTE_KUFAM = "'Kufam', system-ui, sans-serif";

/**
 * v7.7.6: Configuração dos rodapés PNG.
 * Cada rodapé tem altura definida em px no espaço da peça (1080×1350 ou 1080×1920).
 * O ponto Y de início do rodapé = altura_peca - alturaRodape.
 *
 * Coordenadas calculadas das dimensões reais dos PNGs do Figma:
 *   rodape_01_feed: PNG 3240x1386 → 1080×462 (y=888 a y=1350)
 *   rodape_01_stories: PNG 3237x1398 → 1080×466 (y=1454 a y=1920)
 *   rodape_02_feed: PNG 3240x975 → 1080×325 (y=1025 a y=1350)
 *   rodape_02_stories: PNG 3240x1317 → 1080×439 (y=1481 a y=1920)
 */
export type TipoRodape = "rodape_01" | "rodape_02";

export const ALTURAS_RODAPE: Record<TipoRodape, Record<FeedFormato, number>> = {
  rodape_01: { feed: 462, stories: 466 },
  rodape_02: { feed: 325, stories: 439 },
};

export function obterAlturaRodape(tipo: TipoRodape, formato: FeedFormato): number {
  return ALTURAS_RODAPE[tipo][formato];
}
