import type { FeedSlideData, FeedTemplateId, TemplateInfo } from "./templates/tipos";
import TemplateFeedPilulaHeadline from "./templates/feed_pilula_headline";
import TemplateStoriesPilulaHeadline from "./templates/stories_pilula_headline";
import TemplateFeedIconeCta from "./templates/feed_icone_cta";
import TemplateStoriesIconeCta from "./templates/stories_icone_cta";

/**
 * Renderiza um slide Feed/Stories baseado no templateId.
 *
 * Templates implementados (v7.7.6):
 *  - feed_pilula_headline      ✅ (1080×1350) — antes "ipva_iptu_feed"
 *  - stories_pilula_headline   ✅ (1080×1920) — antes "ipva_iptu_stories"
 *  - feed_icone_cta            ✅ (1080×1350) — antes "rotativo_feed"
 *  - stories_icone_cta         ✅ (1080×1920) — antes "rotativo_stories" (era placeholder)
 *
 * Templates pendentes (placeholder com aviso):
 *  - feed_amarelo_ilustracao / stories_amarelo_ilustracao  (era "oque_e_*")
 *  - feed_central_asset / stories_central_asset            (era "ate3_cartoes_*")
 *
 * Nomenclatura: IDs descrevem ESTRUTURA VISUAL, não conteúdo. Os textos do
 * exemplo são sugestões — o usuário edita pra qualquer assunto.
 */
export default function FeedSlide({
  slide,
  escala = 1,
  onSlideChange,
}: {
  slide: FeedSlideData;
  escala?: number;
  onSlideChange?: (patch: Partial<FeedSlideData>) => void;
}) {
  switch (slide.templateId) {
    case "feed_pilula_headline":
      return <TemplateFeedPilulaHeadline slide={slide} escala={escala} onSlideChange={onSlideChange} />;
    case "stories_pilula_headline":
      return <TemplateStoriesPilulaHeadline slide={slide} escala={escala} onSlideChange={onSlideChange} />;
    case "feed_icone_cta":
      return <TemplateFeedIconeCta slide={slide} escala={escala} onSlideChange={onSlideChange} />;
    case "stories_icone_cta":
      return <TemplateStoriesIconeCta slide={slide} escala={escala} onSlideChange={onSlideChange} />;
    default:
      return <TemplatePlaceholder slide={slide} escala={escala} />;
  }
}

/**
 * Placeholder para templates ainda não implementados.
 * Mantém estrutura visual consistente (1080×1350 ou 1080×1920) com
 * mensagem clara de "em construção".
 */
function TemplatePlaceholder({
  slide,
  escala,
}: {
  slide: FeedSlideData;
  escala: number;
}) {
  const eh_stories = slide.templateId.startsWith("stories_");
  const w = 1080 * escala;
  const h = (eh_stories ? 1920 : 1350) * escala;

  const tplInfo = TEMPLATES_DISPONIVEIS.find((t) => t.id === slide.templateId);

  return (
    <div
      style={{
        width: w,
        height: h,
        background: "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#888",
        fontFamily: "'Kufam', system-ui, sans-serif",
        padding: 40 * escala,
        textAlign: "center",
        gap: 20 * escala,
      }}
    >
      <div
        style={{
          fontSize: 28 * escala,
          fontWeight: 700,
          color: "#FFC528",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Em construção
      </div>
      <div style={{ fontSize: 22 * escala, color: "#ccc", lineHeight: 1.4 }}>
        {tplInfo?.nome || slide.templateId}
      </div>
      <div
        style={{
          fontSize: 16 * escala,
          color: "#666",
          marginTop: 16 * escala,
          maxWidth: 400 * escala,
          lineHeight: 1.5,
        }}
      >
        Este template estará disponível em breve.
        <br />
        Use os modelos <strong style={{ color: "#FFC528" }}>Pílula + Headline</strong> ou{" "}
        <strong style={{ color: "#FFC528" }}>Ícone + CTA</strong> nesta versão.
      </div>
    </div>
  );
}

// ============================================================
// REGISTRY DE TEMPLATES — usado pelo dropdown e painel direito
// ============================================================

export const TEMPLATES_DISPONIVEIS: TemplateInfo[] = [
  // ===== IMPLEMENTADOS =====
  {
    id: "feed_pilula_headline",
    nome: "Pílula + Headline grande — Feed (1080×1350)",
    descricao:
      "Foto + pílula superior + headline grande + subhead alinhado direita + tagline + rodapé",
    formato: "feed",
    camposUsados: ["pilula", "headline", "subhead", "tagline", "foto"],
    exemplo: {
      templateId: "feed_pilula_headline",
      pilula: "Gestão financeira pessoal",
      headline: "Organize",
      subhead: "seus impostos",
      tagline: "Parcele IPVA e IPTU com inteligência.",
      cta: "",
      fotoUrl: "",
      fotoPosicao: "center",
      mostrarPilula: true,
      mostrarFooter: true,
      mostrarCTA: false,
    },
  },
  {
    id: "stories_pilula_headline",
    nome: "Pílula + Headline grande — Stories (1080×1920)",
    descricao: "Versão stories: foto vertical + mesma estrutura do Feed",
    formato: "stories",
    camposUsados: ["pilula", "headline", "subhead", "tagline", "foto"],
    exemplo: {
      templateId: "stories_pilula_headline",
      pilula: "Gestão financeira pessoal",
      headline: "Organize",
      subhead: "seus impostos",
      tagline: "Parcele IPVA e IPTU com inteligência.",
      cta: "",
      fotoUrl: "",
      fotoPosicao: "center",
      mostrarPilula: true,
      mostrarFooter: true,
      mostrarCTA: false,
    },
  },
  {
    id: "feed_icone_cta",
    nome: "Ícone + CTA outline — Feed (1080×1350)",
    descricao:
      "Foto + ícone superior + headline + subhead + tagline + CTA pílula outline + rodapé",
    formato: "feed",
    camposUsados: ["headline", "subhead", "tagline", "cta", "foto"],
    exemplo: {
      templateId: "feed_icone_cta",
      pilula: "",
      headline: "Rotativo",
      subhead: "ou estratégia?",
      tagline: "Entenda a diferença.",
      cta: "Faça a escolha inteligente",
      fotoUrl: "",
      fotoPosicao: "center",
      mostrarPilula: false,
      mostrarFooter: true,
      mostrarCTA: true,
    },
  },
  {
    id: "stories_icone_cta",
    nome: "Ícone + CTA outline — Stories (1080×1920)",
    descricao: "Versão stories: foto vertical + mesma estrutura do Feed",
    formato: "stories",
    camposUsados: ["headline", "subhead", "tagline", "cta", "foto"],
    exemplo: {
      templateId: "stories_icone_cta",
      pilula: "",
      headline: "Rotativo",
      subhead: "ou estratégia?",
      tagline: "Entenda a diferença.",
      cta: "Faça a escolha inteligente",
      fotoUrl: "",
      fotoPosicao: "center",
      mostrarPilula: false,
      mostrarFooter: true,
      mostrarCTA: true,
    },
  },

  // ===== EM CONSTRUÇÃO (placeholders) =====
  {
    id: "feed_amarelo_ilustracao",
    nome: "Fundo amarelo + ilustração — Feed (em breve)",
    descricao: "Em construção · fundo amarelo cheio + ilustrações isométricas",
    formato: "feed",
    camposUsados: ["headline", "subhead", "cta"],
    exemplo: {
      templateId: "feed_amarelo_ilustracao",
      headline: "O que é o\nParcele aqui?",
      subhead: "Plataforma digital\npara parcelar boletos.",
      cta: "Conheça agora",
      fotoUrl: "",
      mostrarPilula: false,
      mostrarFooter: true,
      mostrarCTA: true,
    },
  },
  {
    id: "stories_amarelo_ilustracao",
    nome: "Fundo amarelo + ilustração — Stories (em breve)",
    descricao: "Em construção · versão vertical do anterior",
    formato: "stories",
    camposUsados: ["headline", "subhead", "cta"],
    exemplo: {
      templateId: "stories_amarelo_ilustracao",
      headline: "O que é o\nParcele aqui?",
      subhead: "Plataforma digital\npara parcelar boletos.",
      cta: "Conheça agora",
      fotoUrl: "",
      mostrarPilula: false,
      mostrarFooter: true,
      mostrarCTA: true,
    },
  },
  {
    id: "feed_central_asset",
    nome: "Headline central + asset — Feed (em breve)",
    descricao: "Em construção · headline central + asset (cartões etc) + footer",
    formato: "feed",
    camposUsados: ["headline", "subhead", "tagline", "cta", "foto"],
    exemplo: {
      templateId: "feed_central_asset",
      headline: "Use até 3 cartões",
      subhead: "no mesmo boleto",
      tagline: "Combine seus limites",
      cta: "Simule agora",
      fotoUrl: "",
      mostrarPilula: false,
      mostrarFooter: true,
      mostrarCTA: true,
    },
  },
  {
    id: "stories_central_asset",
    nome: "Headline central + asset — Stories (em breve)",
    descricao: "Em construção · versão vertical do anterior",
    formato: "stories",
    camposUsados: ["headline", "subhead", "tagline", "cta", "foto"],
    exemplo: {
      templateId: "stories_central_asset",
      headline: "Use até 3 cartões",
      subhead: "no mesmo boleto",
      tagline: "Combine seus limites",
      cta: "Simule agora",
      fotoUrl: "",
      mostrarPilula: false,
      mostrarFooter: true,
      mostrarCTA: true,
    },
  },
];

export function obterTemplate(id: FeedTemplateId): TemplateInfo | undefined {
  return TEMPLATES_DISPONIVEIS.find((t) => t.id === id);
}

export function templateImplementado(id: FeedTemplateId): boolean {
  return [
    "feed_pilula_headline",
    "stories_pilula_headline",
    "feed_icone_cta",
    "stories_icone_cta",
  ].includes(id);
}
