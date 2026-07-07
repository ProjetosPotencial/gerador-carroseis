import type { FeedSlideData } from "./tipos";
import {
  PARCELE_AQUI_CORES,
  FONTE_KUFAM,
  obterAlturaRodape,
  type TipoRodape,
} from "./tipos";
import RodapePNG from "../components/RodapePNG";
import TexturaOverlay from "../components/TexturaOverlay";
import GradienteLeitura from "../components/GradienteLeitura";
import BlocoTextoWrapper from "../components/BlocoTextoWrapper";
import FotoDraggable from "../components/FotoDraggable";

/**
 * Template "Pílula + Headline grande" — Feed 1080×1350 (v7.7.7)
 *
 * v7.7.7:
 *  - Foto cobre 100% da peça (vai atrás do rodapé via alpha) — elimina faixa
 *    preta lateral que aparecia com rodape_01 amarelo.
 *  - Textos com posições absolutas (layout fixo do Figma) preservados.
 *
 * v7.7.20:
 *  - Foto agora usa FotoDraggable: drag direto + zoom 1x-3x quando
 *    onSlideChange é fornecido (modo editor). No export sem onSlideChange,
 *    drag é desativado mas posição salva é renderizada normalmente.
 */
export default function TemplateFeedPilulaHeadline({
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

  const escalaGeral = slide.escalaGeral ?? 1;

  const tipoRodape: TipoRodape = slide.tipoRodape ?? "rodape_02";
  const alturaRodape = obterAlturaRodape(tipoRodape, "feed");
  const alturaUtil = 1350 - alturaRodape;

  const mostrarTextura = slide.mostrarTextura !== false;
  const opacidadeTextura = slide.opacidadeTextura ?? 0.75;
  const modoTextura = slide.modoTextura ?? "overlay";

  const mostrarGradiente = slide.mostrarGradienteLeitura ?? true;
  const opacidadeGradiente = slide.opacidadeGradienteLeitura ?? 0.5;

  // Entrelinhas — v7.7.9 (defaults preservam visual original do template)
  const lhHeadline = slide.lineHeightHeadline ?? 0.95;
  const lhSubhead = slide.lineHeightSubhead ?? 1.0;
  const lhTagline = slide.lineHeightTagline ?? 1.2;

  // Margem inferior — v7.7.14 (empurra elementos subsequentes pra baixo cumulativamente)
  const mbPilula = slide.mbPilula ?? 0;
  const mbHeadline = slide.mbHeadline ?? 0;
  const mbSubhead = slide.mbSubhead ?? 0;
  // Posições com cumulativo
  const topHeadline = 560 + mbPilula;
  const topSubhead = 740 + mbPilula + mbHeadline;
  const topTagline = 905 + mbPilula + mbHeadline + mbSubhead;

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
      {/* FOTO 100% (vai atrás do rodapé) — v7.7.20: drag + zoom */}
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
            left: 0,
            top: 0,
            width: e(1080),
            height: e(1350),
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

      {/* TEXTURA (cobre 100% — fica encoberta pelo rodapé opaco) */}
      <TexturaOverlay
        visivel={mostrarTextura}
        opacity={opacidadeTextura}
        modo={modoTextura}
        alturaUtil={1350}
        escala={escala}
      />

      {/* GRADIENTE DE LEITURA (cobre 100%, pico em alturaUtil) */}
      <GradienteLeitura
        visivel={mostrarGradiente}
        opacidade={opacidadeGradiente}
        alturaUtil={alturaUtil}
        alturaTotal={1350}
        escala={escala}
      />

      {/* BLOCO DE TEXTO (com offsetY pra ajuste fino) */}
      <BlocoTextoWrapper offsetY={slide.offsetYBloco} escala={escala}>
      {/* PÍLULA */}
      {slide.mostrarPilula !== false && slide.pilula && (
        <div
          style={{
            position: "absolute",
            top: e(489),
            left: e(148),
            backgroundColor: slide.corPilulaFundo || corPilulaFundo,
            borderRadius: e(24.5),
            color: slide.corPilula || corPilulaTexto,
            fontSize: e((slide.tamPilula ?? 24) * escalaGeral),
            fontWeight: slide.pesoPilula ?? 700,
            fontStyle: slide.italicPilula ? "italic" : "normal",
            letterSpacing: `${slide.letterSpacingPilula ?? -0.005}em`,
            textTransform: slide.transformPilula ?? "none",
            textAlign: slide.alignPilula ?? "left",
            whiteSpace: "nowrap",
            paddingTop: e(14),
            paddingBottom: e(11),
            paddingLeft: e(28),
            paddingRight: e(28),
            lineHeight: slide.lineHeightPilula ?? 1.0,
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
            top: e(topHeadline),
            left: e(140),
            right: e(140),
            color: corHeadline,
            fontSize: e((slide.tamHeadline ?? 165) * escalaGeral),
            fontWeight: slide.pesoHeadline ?? 800,
            fontStyle: slide.italicHeadline ? "italic" : "normal",
            lineHeight: lhHeadline,
            letterSpacing: `${slide.letterSpacingHeadline ?? -0.04}em`,
            textTransform: slide.transformHeadline ?? "none",
            textAlign: slide.alignHeadline ?? "left",
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
            top: e(topSubhead),
            left: e(140),
            right: e(140),
            color: corSubhead,
            fontSize: e((slide.tamSubhead ?? 72) * escalaGeral),
            fontWeight: slide.pesoSubhead ?? 500,
            fontStyle: slide.italicSubhead ? "italic" : "normal",
            lineHeight: lhSubhead,
            letterSpacing: `${slide.letterSpacingSubhead ?? -0.02}em`,
            textTransform: slide.transformSubhead ?? "none",
            textAlign: slide.alignSubhead ?? "right",
            whiteSpace: "pre-line",
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
            top: e(topTagline),
            left: e(140),
            right: e(140),
            color: corSubhead,
            fontSize: e((slide.tamTagline ?? 38) * escalaGeral),
            fontWeight: slide.pesoTagline ?? 600,
            fontStyle: slide.italicTagline ? "italic" : "normal",
            lineHeight: lhTagline,
            letterSpacing: `${slide.letterSpacingTagline ?? -0.01}em`,
            textTransform: slide.transformTagline ?? "none",
            textAlign: slide.alignTagline ?? "left",
            whiteSpace: "pre-line",
          }}
        >
          {slide.tagline}
        </div>
      )}
      </BlocoTextoWrapper>

      {/* RODAPÉ PNG */}
      {slide.mostrarFooter !== false && (
        <RodapePNG tipo={tipoRodape} formato="feed" escala={escala} />
      )}
    </div>
  );
}
