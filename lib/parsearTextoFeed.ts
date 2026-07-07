/**
 * Parser de texto colado para módulo Feed/Stories.
 *
 * Formato esperado:
 *
 *   SLIDE 1
 *   TEMPLATE: feed_pilula_headline
 *   PILULA: Gestão financeira pessoal
 *   HEADLINE: Organize
 *   SUBHEAD: seus impostos
 *   TAGLINE: Parcele IPVA e IPTU com inteligência.
 *
 *   ---
 *
 *   SLIDE 2
 *   TEMPLATE: feed_icone_cta
 *   HEADLINE: Rotativo
 *   SUBHEAD: ou estratégia?
 *   TAGLINE: Entenda a diferença.
 *   CTA: Faça a escolha inteligente
 *
 * Separadores: "---" ou "SLIDE N" inicial.
 * Campos suportados: TEMPLATE, PILULA, HEADLINE, SUBHEAD, TAGLINE, CTA
 *
 * Tudo case-insensitive. Multi-linha: continuar sem rótulo até próximo CAMPO: ou divisor.
 *
 * v7.7.6: IDs dos templates renomeados (ipva_iptu_* → feed_pilula_headline,
 * rotativo_* → feed_icone_cta etc). IDs antigos continuam aceitos como ALIAS
 * pra não quebrar textos salvos pelos usuários.
 */

import type { FeedSlideData, FeedTemplateId } from "../components/feed/templates/tipos";

const TEMPLATES_VALIDOS: FeedTemplateId[] = [
  "feed_pilula_headline",
  "stories_pilula_headline",
  "feed_icone_cta",
  "stories_icone_cta",
  "feed_amarelo_ilustracao",
  "stories_amarelo_ilustracao",
  "feed_central_asset",
  "stories_central_asset",
];

/**
 * Aliases: IDs antigos → IDs novos.
 * Retrocompat pra textos colados em versões anteriores ao renaming v7.7.6.
 */
const ALIAS_TEMPLATES: Record<string, FeedTemplateId> = {
  ipva_iptu_feed: "feed_pilula_headline",
  ipva_iptu_stories: "stories_pilula_headline",
  rotativo_feed: "feed_icone_cta",
  rotativo_stories: "stories_icone_cta",
  oque_e_feed: "feed_amarelo_ilustracao",
  oque_e_stories: "stories_amarelo_ilustracao",
  ate3_cartoes_feed: "feed_central_asset",
  ate3_cartoes_stories: "stories_central_asset",
};

const ROTULOS: Record<string, keyof FeedSlideData> = {
  TEMPLATE: "templateId",
  PILULA: "pilula",
  PÍLULA: "pilula",
  KICKER: "pilula",
  HEADLINE: "headline",
  TITULO: "headline",
  TÍTULO: "headline",
  SUBHEAD: "subhead",
  SUBTITULO: "subhead",
  SUBTÍTULO: "subhead",
  TAGLINE: "tagline",
  DESTAQUE: "tagline",
  CTA: "cta",
  BOTAO: "cta",
  BOTÃO: "cta",
  // v7.8: prompt de cena para geração de imagem com IA
  IMGPROMPT: "imgPrompt",
  IMAGEM: "imgPrompt",
  IMAGEMPROMPT: "imgPrompt",
  PROMPTIMAGEM: "imgPrompt",
};

function ehDivisor(linha: string): boolean {
  const t = linha.trim();
  if (t === "" || t === "---" || t === "===") return true;
  if (/^[\-=]{3,}$/.test(t)) return true;
  if (/^slide\s*\d+\s*$/i.test(t)) return true;
  if (/^={2,}\s*slide\s*\d*\s*={2,}$/i.test(t)) return true;
  return false;
}

function parseRotulo(linha: string): { campo: keyof FeedSlideData; valor: string } | null {
  const m = linha.match(/^\s*([A-ZÀ-Ú]+)\s*[:：]\s*(.*)$/i);
  if (!m) return null;
  const rotulo = m[1].toUpperCase();
  const campo = ROTULOS[rotulo];
  if (!campo) return null;
  return { campo, valor: m[2].trim() };
}

/**
 * Resolve um templateId entrado pelo usuário, aceitando IDs novos e antigos
 * (com alias). Retorna o ID novo, ou null se não for reconhecido.
 */
function resolverTemplateId(valor: string): FeedTemplateId | null {
  const limpo = valor.toLowerCase().trim();
  if ((TEMPLATES_VALIDOS as string[]).includes(limpo)) {
    return limpo as FeedTemplateId;
  }
  if (ALIAS_TEMPLATES[limpo]) {
    return ALIAS_TEMPLATES[limpo];
  }
  return null;
}

export interface ResultadoParser {
  slides: FeedSlideData[];
  avisos: string[];
}

export function parsearTextoFeedStories(texto: string): ResultadoParser {
  const linhas = texto.replace(/\r\n/g, "\n").split("\n");
  const slides: FeedSlideData[] = [];
  const avisos: string[] = [];

  let slideAtual: Partial<FeedSlideData> | null = null;
  let ultimoCampo: keyof FeedSlideData | null = null;

  const finalizarSlide = () => {
    if (!slideAtual) return;
    if (!slideAtual.templateId) {
      avisos.push(
        `Slide ${slides.length + 1} sem TEMPLATE: definido — pulado. (Adicione "TEMPLATE: feed_pilula_headline" ou outro)`
      );
      slideAtual = null;
      return;
    }
    slides.push({
      id: Math.random().toString(36).substring(2, 10),
      templateId: slideAtual.templateId,
      pilula: slideAtual.pilula || "",
      headline: slideAtual.headline || "",
      subhead: slideAtual.subhead || "",
      tagline: slideAtual.tagline || "",
      cta: slideAtual.cta || "",
      fotoUrl: "",
      fotoPosicao: "center",
      mostrarPilula: !!slideAtual.pilula,
      mostrarCTA: !!slideAtual.cta,
      mostrarFooter: true,
      // v7.8: prompt de imagem (só a cena) para geração por IA
      imgPrompt: (slideAtual.imgPrompt || "").trim() || undefined,
      imgStatus: (slideAtual.imgPrompt || "").trim() ? "idle" : undefined,
    });
    slideAtual = null;
    ultimoCampo = null;
  };

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];

    if (ehDivisor(linha)) {
      finalizarSlide();
      continue;
    }

    const rotulado = parseRotulo(linha);
    if (rotulado) {
      if (!slideAtual) slideAtual = {};
      const { campo, valor } = rotulado;

      if (campo === "templateId") {
        const resolvido = resolverTemplateId(valor);
        if (resolvido) {
          slideAtual.templateId = resolvido;
          // Aviso amigável quando alias antigo foi usado
          if (resolvido !== valor.toLowerCase().trim()) {
            avisos.push(
              `Linha ${i + 1}: TEMPLATE "${valor}" foi reconhecido como "${resolvido}" (renomeado na v7.7.6).`
            );
          }
        } else {
          avisos.push(
            `Linha ${i + 1}: TEMPLATE "${valor}" não reconhecido. Templates válidos: ${TEMPLATES_VALIDOS.join(", ")}`
          );
        }
      } else {
        (slideAtual as Record<string, unknown>)[campo] = valor;
      }
      ultimoCampo = campo;
    } else if (ultimoCampo && ultimoCampo !== "templateId" && slideAtual) {
      const valorAtual = (slideAtual as Record<string, string>)[ultimoCampo] || "";
      const adicional = linha.trim();
      if (adicional) {
        (slideAtual as Record<string, string>)[ultimoCampo] = valorAtual
          ? `${valorAtual}\n${adicional}`
          : adicional;
      }
    }
  }

  finalizarSlide();

  if (slides.length === 0 && texto.trim()) {
    avisos.push(
      "Nenhum slide foi reconhecido. Verifique o formato — exemplo:\n\nSLIDE 1\nTEMPLATE: feed_pilula_headline\nHEADLINE: Organize\n..."
    );
  }

  return { slides, avisos };
}

/** Exemplo de texto pra mostrar como guia ao usuário. */
export const EXEMPLO_TEXTO_COLA = `SLIDE 1
TEMPLATE: feed_pilula_headline
PILULA: Gestão financeira pessoal
HEADLINE: Organize
SUBHEAD: seus impostos
TAGLINE: Parcele IPVA e IPTU com inteligência.
IMGPROMPT: pessoa brasileira organizando contas numa mesa clara perto da janela, luz natural de manhã, espaço livre à direita

---

SLIDE 2
TEMPLATE: stories_pilula_headline
PILULA: Gestão financeira pessoal
HEADLINE: Organize
SUBHEAD: seus impostos
TAGLINE: Parcele IPVA e IPTU com inteligência.

---

SLIDE 3
TEMPLATE: feed_icone_cta
HEADLINE: Rotativo
SUBHEAD: ou estratégia?
TAGLINE: Entenda a diferença.
CTA: Faça a escolha inteligente`;
