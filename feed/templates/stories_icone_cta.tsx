import type { FeedSlideData } from "./tipos";
import {
  FONTE_KUFAM,
  obterAlturaRodape,
  type TipoRodape,
} from "./tipos";
import RodapePNG from "../components/RodapePNG";
import TexturaOverlay from "../components/TexturaOverlay";
import GradienteLeitura from "../components/GradienteLeitura";
import BlocoTextoWrapper from "../components/BlocoTextoWrapper";
import FotoDraggable from "../components/FotoDraggable";
import IconeLucide from "../components/IconeLucide";

/**
 * Template "Ícone + CTA outline" — Stories 1080×1920 (v7.7.7)
 *
 * v7.7.7:
 *  - Foto cobre 100% da peça (vai atrás do rodapé via alpha).
 *  - Bloco de texto coeso, ancorado pelo BOTTOM do CTA (= alturaRodape + 72).
 *  - CTA fixo a 72px do rodapé independente do tipo escolhido.
 *
 * Espaçamentos:
 *   Ícone → Headline: 24px
 *   Headline → Subhead: 32px
 *   Subhead → CTA: 40px (com tagline: 24+24)
 *   CTA → Rodapé: 72px (FIXO)
 */
export default function TemplateStoriesIconeCta({
  slide,
  escala = 1,
  onSlideChange,
}: {
  slide: FeedSlideData;
  escala?: number;
  onSlideChange?: (patch: Partial<FeedSlideData>) => void;
}) {
  const e = (n: number) => `${n * escala}px`;

  const corHeadline = slide.corHeadline || "#FFFFFF";
  const corSubhead = slide.corSubhead || "#FFFFFF";
  const corCTA = slide.corCTA || "#FFFFFF";
  const corIcone = slide.corIcone || "#FFFFFF";

  const escalaGeral = slide.escalaGeral ?? 1;

  const tamIcone = slide.tamIcone ?? 130;
  const espessuraIcone = slide.espessuraIcone ?? 2;
  const pesoHeadline = slide.pesoHeadline ?? 600;
  const tamHeadline = slide.tamHeadline ?? 100;
  const italicHeadline = slide.italicHeadline ?? false;
  const pesoSubhead = slide.pesoSubhead ?? 800;
  const tamSubhead = slide.tamSubhead ?? 100;
  const italicSubhead = slide.italicSubhead ?? false;
  const pesoTagline = slide.pesoTagline ?? 400;
  const tamTagline = slide.tamTagline ?? 42;
  const italicTagline = slide.italicTagline ?? false;
  const pesoCTA = slide.pesoCTA ?? 700;
  const tamCTA = slide.tamCTA ?? 36;
  const italicCTA = slide.italicCTA ?? false;

  const tipoRodape: TipoRodape = slide.tipoRodape ?? "rodape_01";
  const alturaRodape = obterAlturaRodape(tipoRodape, "stories");
  const alturaUtil = 1920 - alturaRodape;

  const mostrarTextura = slide.mostrarTextura !== false;
  const opacidadeTextura = slide.opacidadeTextura ?? 0.75;
  const modoTextura = slide.modoTextura ?? "overlay";

  const mostrarGradiente = slide.mostrarGradienteLeitura ?? true;
  const opacidadeGradiente = slide.opacidadeGradienteLeitura ?? 0.5;

  // Entrelinhas (line-height) por elemento — v7.7.9
  const lhHeadline = slide.lineHeightHeadline ?? 1.0;
  const lhSubhead = slide.lineHeightSubhead ?? 1.0;
  const lhTagline = slide.lineHeightTagline ?? 1.2;
  const lhCTA = slide.lineHeightCTA ?? 1.0;

  // Espaçamentos do bloco (8pt grid, customizáveis) — v7.7.9
  const gapIconeHeadline = slide.gapIconeHeadline ?? 24;
  const gapHeadlineSubhead = slide.gapHeadlineSubhead ?? 32;
  const gapSubheadCTA = slide.gapSubheadCTA ?? 80;
  const gapCTARodape = slide.gapCTARodape ?? 72;

  // Margens inferiores individuais (v7.7.10)
  const mbHeadline = slide.mbHeadline ?? 0;
  const mbSubhead = slide.mbSubhead ?? 0;
  const mbTagline = slide.mbTagline ?? 0;

  // Layout do bloco coeso (ancorado pelo CTA)
  const ctaBottom = alturaRodape + gapCTARodape;
  const alturaCTA = tamCTA * escalaGeral * lhCTA + 22 + 20 + 6;
  const yCTA = 1920 - ctaBottom - alturaCTA;

  const temTagline = !!slide.tagline;
  const snap8 = (n: number) => Math.round(n / 8) * 8;
  const gapSubheadTagline = temTagline ? Math.max(8, snap8(gapSubheadCTA * 0.6)) : 0;
  const gapTaglineCTA = temTagline ? Math.max(8, snap8(gapSubheadCTA * 0.4)) : 0;

  const alturaHeadline = tamHeadline * escalaGeral * lhHeadline;
  const alturaSubhead = tamSubhead * escalaGeral * lhSubhead;
  const alturaTagline = tamTagline * escalaGeral * lhTagline;

  const yTagline = temTagline ? yCTA - gapTaglineCTA - mbTagline - alturaTagline : null;
  const ySubhead = temTagline
    ? (yTagline as number) - gapSubheadTagline - alturaSubhead
    : yCTA - gapSubheadCTA - mbSubhead - alturaSubhead;
  const yHeadline = ySubhead - gapHeadlineSubhead - mbHeadline - alturaHeadline;
  const yIcone = yHeadline - gapIconeHeadline - tamIcone;

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
      {/* FOTO 100% (atrás do rodapé) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: e(1080),
          height: e(1920),
          overflow: "hidden",
        }}
      >
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
              width: "100%",
              height: "100%",
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
      </div>

      <TexturaOverlay
        visivel={mostrarTextura}
        opacity={opacidadeTextura}
        modo={modoTextura}
        alturaUtil={1920}
        escala={escala}
      />

      <GradienteLeitura
        visivel={mostrarGradiente}
        opacidade={opacidadeGradiente}
        alturaUtil={alturaUtil}
        alturaTotal={1920}
        escala={escala}
      />
{/* BLOCO DE TEXTO (com offsetY pra ajuste fino) */}
<BlocoTextoWrapper offsetY={slide.offsetYBloco} escala={escala}>

      {slide.mostrarIcone !== false && (
        <div
          style={{
            position: "absolute",
            top: e(yIcone),
            left: e(72),
            color: corIcone,
            display: "flex",
          }}
        >
          <IconeLucide nome={slide.iconeNome} size={tamIcone * escala} strokeWidth={espessuraIcone} />
        </div>
      )}

      {slide.headline && (
        <div
          style={{
            position: "absolute",
            top: e(yHeadline),
            left: e(72),
            right: e(72),
            color: corHeadline,
            fontSize: e(tamHeadline * escalaGeral),
            fontWeight: pesoHeadline,
            fontStyle: italicHeadline ? "italic" : "normal",
            lineHeight: lhHeadline,
            letterSpacing: `${slide.letterSpacingHeadline ?? -0.02}em`,
            textTransform: slide.transformHeadline ?? "none",
            textAlign: slide.alignHeadline ?? "left",
            whiteSpace: "pre-line",
          }}
        >
          {slide.headline}
        </div>
      )}

      {slide.subhead && (
        <div
          style={{
            position: "absolute",
            top: e(ySubhead),
            left: e(72),
            right: e(72),
            color: corSubhead,
            fontSize: e(tamSubhead * escalaGeral),
            fontWeight: pesoSubhead,
            fontStyle: italicSubhead ? "italic" : "normal",
            lineHeight: lhSubhead,
            letterSpacing: `${slide.letterSpacingSubhead ?? -0.025}em`,
            textTransform: slide.transformSubhead ?? "none",
            textAlign: slide.alignSubhead ?? "left",
            whiteSpace: "pre-line",
          }}
        >
          {slide.subhead}
        </div>
      )}

      {temTagline && yTagline !== null && (
        <div
          style={{
            position: "absolute",
            top: e(yTagline),
            left: e(72),
            right: e(72),
            color: corSubhead,
            fontSize: e(tamTagline * escalaGeral),
            fontWeight: pesoTagline,
            fontStyle: italicTagline ? "italic" : "normal",
            lineHeight: lhTagline,
            letterSpacing: `${slide.letterSpacingTagline ?? -0.005}em`,
            textTransform: slide.transformTagline ?? "none",
            textAlign: slide.alignTagline ?? "left",
            whiteSpace: "pre-line",
          }}
        >
          {slide.tagline}
        </div>
      )}

      {slide.mostrarCTA !== false && slide.cta && (
        <div
          style={{
            position: "absolute",
            bottom: e(ctaBottom),
            left: e(72),
            backgroundColor: "transparent",
            color: corCTA,
            border: `${e(3)} solid ${corCTA}`,
            borderRadius: e(60),
            fontSize: e(tamCTA * escalaGeral),
            fontWeight: pesoCTA,
            fontStyle: italicCTA ? "italic" : "normal",
            letterSpacing: `${slide.letterSpacingCTA ?? -0.005}em`,
            textTransform: slide.transformCTA ?? "none",
            textAlign: slide.alignCTA ?? "left",
            paddingTop: e(22),
            paddingBottom: e(20),
            paddingLeft: e(48),
            paddingRight: e(48),
            lineHeight: lhCTA,
            display: "inline-block",
            boxSizing: "border-box",
          }}
        >
          {slide.cta}
        </div>
      )}
</BlocoTextoWrapper>


      {slide.mostrarFooter !== false && (
        <RodapePNG tipo={tipoRodape} formato="stories" escala={escala} />
      )}
    </div>
  );
}
