import type { FeedSlideData } from "./tipos";
import { PARCELE_AQUI_CORES, FONTE_KUFAM } from "./tipos";
import LogoParceleAqui from "../components/LogoParceleAqui";
import TexturaOverlay from "../components/TexturaOverlay";
import BlocoTextoWrapper from "../components/BlocoTextoWrapper";
import FotoDraggable from "../components/FotoDraggable";

/**
 * Template "IPVA / IPTU — Organize seus impostos" — Stories 1080×1920
 *
 * Mesmo padrão do Feed mas em proporção 9:16. Coordenadas extraídas do SVG
 * Stories_-_1080x1920_-_8.svg:
 *  - Pílula: x=141, y=921, w=343, h=49, rx=24.5 (centralizada no eixo Y)
 *  - Headline na faixa central baixa
 *  - Footer creme curvo: y=1481-1920 (curva no canto esquerdo)
 *  - Logo: y=1577-1673
 */
export default function TemplateIpvaIptuStories({
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
        height: e(1920),
        backgroundColor: "#000",
        fontFamily: FONTE_KUFAM,
        overflow: "hidden",
      }}
    >
      {/* FOTO DE FUNDO 100% */}
      {slide.fotoUrl ? (
        <FotoDraggable
          src={slide.fotoUrl}
          width={1080 * escala}
          height={1920 * escala}
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
            background: "linear-gradient(135deg, #2a2a2a, #0a0a0a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            fontSize: e(20),
          }}
        >
          [ FOTO DE FUNDO ]
        </div>
      )}

      {/* OVERLAY */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* v7.7.2: Textura granulada overlay */}
      <TexturaOverlay
        visivel={slide.mostrarTextura !== false}
        opacity={slide.opacidadeTextura ?? 0.75}
        modo={slide.modoTextura ?? "overlay"}
      />

      {/* PÍLULA */}
{/* BLOCO DE TEXTO (com offsetY pra ajuste fino) */}
<BlocoTextoWrapper offsetY={slide.offsetYBloco} escala={escala}>
      {slide.mostrarPilula !== false && slide.pilula && (
        <div
          style={{
            position: "absolute",
            top: e(921),
            left: e(141),
            backgroundColor: corPilulaFundo,
            borderRadius: e(24.5),
            color: corPilulaTexto,
            fontSize: e(20 * escalaGeral),
            fontWeight: 700,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap",
            paddingTop: e(14),
            paddingBottom: e(11),
            paddingLeft: e(28),
            paddingRight: e(28),
            lineHeight: 1,
            display: "inline-block",
            maxWidth: e(800),
            overflow: "hidden",
            textOverflow: "ellipsis",
            boxSizing: "border-box",
          }}
        >
          {slide.pilula}
        </div>
      )}

      {/* HEADLINE */}
      {slide.headline && (
        <div
          style={{
            position: "absolute",
            top: e(992),
            left: e(140),
            right: e(140),
            color: corHeadline,
            fontSize: e(180 * escalaGeral),
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: "-0.045em",
            whiteSpace: "pre-line",
          }}
        >
          {slide.headline}
        </div>
      )}

      {/* SUBHEAD */}
      {slide.subhead && (
        <div
          style={{
            position: "absolute",
            top: e(1177),
            left: e(140),
            right: e(140),
            color: corSubhead,
            fontSize: e(76 * escalaGeral),
            fontWeight: 700,
            fontStyle: "italic",
            lineHeight: 1.0,
            letterSpacing: "-0.025em",
            whiteSpace: "pre-line",
            textAlign: "right",
          }}
        >
          {slide.subhead}
        </div>
      )}

      {/* TAGLINE */}
      {slide.tagline && (
        <div
          style={{
            position: "absolute",
            top: e(1340),
            left: e(140),
            right: e(140),
            color: corSubhead,
            fontSize: e(40 * escalaGeral),
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            whiteSpace: "pre-line",
          }}
        >
          {slide.tagline}
        </div>
      )}

      {/* FOOTER CREME CURVO */}
</BlocoTextoWrapper>

      {slide.mostrarFooter !== false && (
        <>
          <svg
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: e(1080),
              height: e(1920),
              pointerEvents: "none",
            }}
            viewBox="0 0 1080 1920"
            preserveAspectRatio="none"
          >
            <path
              d="M1080 1481H320C143.269 1481 0 1624.27 0 1801V1920H1080V1481Z"
              fill={corCremeFooter}
            />
          </svg>

          {/* URL */}
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

          {/* Logo */}
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
