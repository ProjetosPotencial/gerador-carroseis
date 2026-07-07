import type { FeedSlideData } from "./tipos";
import { PARCELE_AQUI_CORES, FONTE_KUFAM } from "./tipos";
import LogoParceleAqui from "../components/LogoParceleAqui";
import TexturaOverlay from "../components/TexturaOverlay";
import BlocoTextoWrapper from "../components/BlocoTextoWrapper";
import FotoDraggable from "../components/FotoDraggable";

/**
 * Template "IPVA / IPTU — Organize seus impostos" — Feed 1080x1350
 *
 * Estrutura (de cima pra baixo):
 *  - Foto de fundo cobrindo 100% da peça
 *  - Pílula superior creme (#FFF9E8) com texto preto (~y=489, centralizada na coluna esquerda)
 *  - Headline AMARELO grande (#FFCB31)
 *  - Subhead CREME (#FFF9E8)
 *  - Tagline CREME (#FFF9E8) embaixo
 *  - Footer creme com curva orgânica + URL preto + logo amarelo (canto inferior direito)
 *
 * Coordenadas extraídas do SVG original (Feed_-_1080x1350_-_7.svg).
 */
export default function TemplateIpvaIptuFeed({
  slide,
  escala = 1,
  onSlideChange,
}: {
  slide: FeedSlideData;
  escala?: number;
  onSlideChange?: (patch: Partial<FeedSlideData>) => void;
}) {
  const e = (n: number) => `${n * escala}px`;

  const corHeadline = slide.corHeadline || PARCELE_AQUI_CORES.amareloPrincipal;
  const corSubhead = slide.corSubhead || PARCELE_AQUI_CORES.cremeFooter;
  const corPilulaFundo = PARCELE_AQUI_CORES.cremeFooter;
  const corPilulaTexto = PARCELE_AQUI_CORES.marromTexto;
  const corCremeFooter = PARCELE_AQUI_CORES.cremeFooter;
  const corUrl = PARCELE_AQUI_CORES.marromTexto;

  const escalaGeral = slide.escalaGeral ?? 1;

  return (
    <div
      style={{
        position: "relative",
        width: e(1080),
        height: e(1350),
        backgroundColor: "#000",
        fontFamily: FONTE_KUFAM,
        overflow: "hidden",
      }}
    >
      {/* ============ FOTO DE FUNDO (100% da peça) ============ */}
      {slide.fotoUrl ? (
        <FotoDraggable
          src={slide.fotoUrl}
          width={1080 * escala}
          height={1350 * escala}
          zoom={slide.fotoZoom ?? 1}
          offsetX={slide.fotoOffsetX ?? 0}
          offsetY={slide.fotoOffsetY ?? 0}
          onPositionChange={
            onSlideChange
              ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y })
              : undefined
          }
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            fontSize: e(20),
            letterSpacing: "0.1em",
          }}
        >
          [ FOTO DE FUNDO ]
        </div>
      )}

      {/* ============ OVERLAY ESCURO PARA LEGIBILIDADE ============ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* ============ TEXTURA OVERLAY (v7.7.2) ============ */}
      <TexturaOverlay
        visivel={slide.mostrarTextura !== false}
        opacity={slide.opacidadeTextura ?? 0.75}
        modo={slide.modoTextura ?? "overlay"}
      />

      {/* ============ PÍLULA SUPERIOR ============ */}
{/* BLOCO DE TEXTO (com offsetY pra ajuste fino) */}
<BlocoTextoWrapper offsetY={slide.offsetYBloco} escala={escala}>
      {slide.mostrarPilula !== false && slide.pilula && (
        <div
          style={{
            position: "absolute",
            top: e(489),
            left: e(148),
            backgroundColor: corPilulaFundo,
            borderRadius: e(24.5),
            color: corPilulaTexto,
            fontSize: e(20 * escalaGeral),
            fontWeight: 700,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap",
            // Padding manual pra centralizar opticamente a Kufam (que tem
            // baseline diferente da maioria das fontes — usar flex + alignItems
            // não fica visualmente centralizado por causa do descender alto).
            // Padding-top maior que padding-bottom compensa o offset visual.
            paddingTop: e(14),
            paddingBottom: e(11),
            paddingLeft: e(28),
            paddingRight: e(28),
            // line-height ajusta o espaço vertical do texto
            lineHeight: 1,
            // display inline-block pra width auto + altura via padding
            display: "inline-block",
            // garante que não transborde se texto for muito longo
            maxWidth: e(800),
            overflow: "hidden",
            textOverflow: "ellipsis",
            boxSizing: "border-box",
          }}
        >
          {slide.pilula}
        </div>
      )}

      {/* ============ HEADLINE GRANDE (AMARELO) ============ */}
      {slide.headline && (
        <div
          style={{
            position: "absolute",
            top: e(560),
            left: e(140),
            right: e(140),
            color: corHeadline,
            fontSize: e(165 * escalaGeral),
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            whiteSpace: "pre-line",
          }}
        >
          {slide.headline}
        </div>
      )}

      {/* ============ SUBHEAD (CREME) ============ */}
      {slide.subhead && (
        <div
          style={{
            position: "absolute",
            top: e(740),
            left: e(140),
            right: e(140),
            color: corSubhead,
            fontSize: e(72 * escalaGeral),
            fontWeight: 500,
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            whiteSpace: "pre-line",
            textAlign: "right",
          }}
        >
          {slide.subhead}
        </div>
      )}

      {/* ============ TAGLINE (CREME, MENOR) ============ */}
      {slide.tagline && (
        <div
          style={{
            position: "absolute",
            top: e(905),
            left: e(140),
            right: e(140),
            color: corSubhead,
            fontSize: e(38 * escalaGeral),
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            whiteSpace: "pre-line",
          }}
        >
          {slide.tagline}
        </div>
      )}

      {/* ============ FOOTER CREME CURVO ============ */}
</BlocoTextoWrapper>

      {slide.mostrarFooter !== false && (
        <>
          {/* Path SVG do footer com curva orgânica no canto esquerdo (extraído do Figma) */}
          <svg
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: e(1080),
              height: e(1350),
              pointerEvents: "none",
            }}
            viewBox="0 0 1080 1350"
            preserveAspectRatio="none"
          >
            <path
              d="M1080 1025H240C107.452 1025 0 1132.45 0 1265V1351H1080V1025Z"
              fill={corCremeFooter}
            />
          </svg>

          {/* URL no canto inferior esquerdo */}
          <div
            style={{
              position: "absolute",
              left: e(99),
              bottom: e(96),
              color: corUrl,
              fontSize: e(34 * escalaGeral),
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            parceleaqui.com.br
          </div>

          {/* Logo no canto inferior direito */}
          <div
            style={{
              position: "absolute",
              right: e(112),
              bottom: e(108),
            }}
          >
            <LogoParceleAqui
              tamanho={104 * escala}
              cor={PARCELE_AQUI_CORES.amareloLogo}
              corCirculo={PARCELE_AQUI_CORES.pretoTexto}
              corSombra={PARCELE_AQUI_CORES.amareloEscuro}
            />
          </div>
        </>
      )}
    </div>
  );
}
