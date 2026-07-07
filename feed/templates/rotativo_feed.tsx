import type { FeedSlideData } from "./tipos";
import { PARCELE_AQUI_CORES, FONTE_KUFAM } from "./tipos";
import LogoParceleAqui from "../components/LogoParceleAqui";
import BlocoTextoWrapper from "../components/BlocoTextoWrapper";
import FotoDraggable from "../components/FotoDraggable";
import IconeLucide from "../components/IconeLucide";

/**
 * Template "Rotativo vs Estratégia" — Feed 1080×1350
 *
 * v7.7.4: textura sem mancha escura no rodapé.
 *  - Tamanhos dos textos voltam aos originais (headline 92, subhead 92, tagline 38, CTA 32)
 *  - Gaps voltam aos originais
 *  - TEXTURA: 2 camadas independentes:
 *     1. Sobre a foto (y < 888): overlay 75% (efeito noir bonito)
 *     2. Sobre o rodapé amarelo (y >= 888): soft-light 40% (sutil + vibrante,
 *        SEM mancha escura). É possível desligar via opacidadeTexturaRodape=0.
 *
 * Coordenadas (espaço 1080×1350):
 *  - Ícone: y=320 left=72
 *  - Headline (92px): y=460
 *  - Subhead (92px): y=565 (gap 13)
 *  - Tagline (38px): y=685 (gap ~28)
 *  - CTA (32px): y=742 (termina em y=816 = 72px do footer y=888)
 */
export default function TemplateRotativoFeed({
  slide,
  escala = 1,
  onSlideChange,
}: {
  slide: FeedSlideData;
  escala?: number;
  onSlideChange?: (patch: Partial<FeedSlideData>) => void;
}) {
  const e = (n: number) => `${n * escala}px`;

  // ===== Cores =====
  const corHeadline = slide.corHeadline || "#FFFFFF";
  const corSubhead = slide.corSubhead || "#FFFFFF";
  const corCTA = slide.corCTA || "#FFFFFF";
  const corAccent = slide.corAccent || PARCELE_AQUI_CORES.amareloPrincipal;
  const corIcone = slide.corIcone || "#FFFFFF";
  const corUrl = PARCELE_AQUI_CORES.marromTexto;

  const escalaGeral = slide.escalaGeral ?? 1;

  // ===== Tipografia (defaults originais — preservados) =====
  const tamIcone = slide.tamIcone ?? 120;
  const espessuraIcone = slide.espessuraIcone ?? 2;
  const pesoHeadline = slide.pesoHeadline ?? 600;
  const tamHeadline = slide.tamHeadline ?? 92;
  const italicHeadline = slide.italicHeadline ?? false;
  const pesoSubhead = slide.pesoSubhead ?? 800;
  const tamSubhead = slide.tamSubhead ?? 92;
  const italicSubhead = slide.italicSubhead ?? false;
  const pesoTagline = slide.pesoTagline ?? 400;
  const tamTagline = slide.tamTagline ?? 38;
  const italicTagline = slide.italicTagline ?? false;
  const pesoCTA = slide.pesoCTA ?? 700;
  const tamCTA = slide.tamCTA ?? 32;
  const italicCTA = slide.italicCTA ?? false;

  // ===== Textura (v7.7.4: 2 camadas) =====
  const mostrarTextura = slide.mostrarTextura !== false;
  const opacidadeFoto = slide.opacidadeTextura ?? 0.75;
  const modoFoto = slide.modoTextura ?? "overlay";
  // No rodapé: defaults soft-light 40% pra ficar sutil e vibrante (sem mancha escura)
  const opacidadeRodape = slide.opacidadeTexturaRodape ?? 0.4;
  const modoRodape = slide.modoTexturaRodape ?? "soft-light";

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
      {/* ============ FOTO na metade superior ============ */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: e(1080),
          height: e(984),
          overflow: "hidden",
        }}
      >
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

      {/* Overlay escuro sutil sobre foto pra contraste do texto */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: e(1080),
          height: e(984),
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%)",
        }}
      />

      {/* ============ TEXTURA CAMADA 1: somente sobre a foto (até y=888) ============ */}
      {mostrarTextura && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: e(1080),
            height: e(888),
            backgroundImage: "url('/textura-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: modoFoto,
            opacity: opacidadeFoto,
            pointerEvents: "none",
          }}
        />
      )}

      {/* ============ FOOTER AMARELO COM CURVA NO TOPO ============ */}
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
        <defs>
          <radialGradient id={`fade-yellow-${slide.id}`} cx="0.78" cy="0.18" r="0.95">
            <stop offset="0%" stopColor={corAccent} stopOpacity="1" />
            <stop offset="60%" stopColor={corAccent} stopOpacity="1" />
            <stop offset="100%" stopColor="#DAA500" stopOpacity="0.55" />
          </radialGradient>
          <clipPath id={`footer-clip-${slide.id}`}>
            <path d="M0 984C0 930.981 42.9807 888 96 888H984C1037.02 888 1080 930.981 1080 984V1350H0V984Z" />
          </clipPath>
        </defs>
        <path
          d="M0 984C0 930.981 42.9807 888 96 888H984C1037.02 888 1080 930.981 1080 984V1350H0V984Z"
          fill={`url(#fade-yellow-${slide.id})`}
        />
      </svg>

      {/* ============ TEXTURA CAMADA 2: SUTIL no rodapé amarelo (soft-light 40%) ============ */}
      {mostrarTextura && opacidadeRodape > 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: e(888),
            width: e(1080),
            height: e(1350 - 888),
            backgroundImage: "url('/textura-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: modoRodape,
            opacity: opacidadeRodape,
            pointerEvents: "none",
            clipPath: `url(#footer-clip-${slide.id})`,
          }}
        />
      )}

      {/* ============ ÍCONE REFRESH ============ */}
{/* BLOCO DE TEXTO (com offsetY pra ajuste fino) */}
<BlocoTextoWrapper offsetY={slide.offsetYBloco} escala={escala}>
      {slide.mostrarIcone !== false && (
        <div
          style={{
            position: "absolute",
            top: e(320),
            left: e(72),
            color: corIcone,
            display: "flex",
          }}
        >
          <IconeLucide nome={slide.iconeNome} size={tamIcone * escala} strokeWidth={espessuraIcone} />
        </div>
      )}

      {/* ============ HEADLINE — y=460 ============ */}
      {slide.headline && (
        <div
          style={{
            position: "absolute",
            top: e(460),
            left: e(72),
            right: e(72),
            color: corHeadline,
            fontSize: e(tamHeadline * escalaGeral),
            fontWeight: pesoHeadline,
            fontStyle: italicHeadline ? "italic" : "normal",
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            whiteSpace: "pre-line",
          }}
        >
          {slide.headline}
        </div>
      )}

      {/* ============ SUBHEAD — y=565 (gap 13) ============ */}
      {slide.subhead && (
        <div
          style={{
            position: "absolute",
            top: e(565),
            left: e(72),
            right: e(72),
            color: corSubhead,
            fontSize: e(tamSubhead * escalaGeral),
            fontWeight: pesoSubhead,
            fontStyle: italicSubhead ? "italic" : "normal",
            lineHeight: 1.0,
            letterSpacing: "-0.025em",
            whiteSpace: "pre-line",
          }}
        >
          {slide.subhead}
        </div>
      )}

      {/* ============ TAGLINE — y=685 (gap 28 do subhead) ============ */}
      {slide.tagline && (
        <div
          style={{
            position: "absolute",
            top: e(685),
            left: e(72),
            right: e(72),
            color: corSubhead,
            fontSize: e(tamTagline * escalaGeral),
            fontWeight: pesoTagline,
            fontStyle: italicTagline ? "italic" : "normal",
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            whiteSpace: "pre-line",
          }}
        >
          {slide.tagline}
        </div>
      )}

      {/* ============ CTA — y=742 (termina em y=816, 72px do footer) ============ */}
      {slide.mostrarCTA !== false && slide.cta && (
        <div
          style={{
            position: "absolute",
            top: e(742),
            left: e(72),
            backgroundColor: "transparent",
            color: corCTA,
            border: `${e(3)} solid ${corCTA}`,
            borderRadius: e(60),
            fontSize: e(tamCTA * escalaGeral),
            fontWeight: pesoCTA,
            fontStyle: italicCTA ? "italic" : "normal",
            letterSpacing: "-0.005em",
            paddingTop: e(22),
            paddingBottom: e(20),
            paddingLeft: e(48),
            paddingRight: e(48),
            lineHeight: 1,
            display: "inline-block",
            boxSizing: "border-box",
          }}
        >
          {slide.cta}
        </div>
      )}

      {/* ============ URL + LOGO no footer ============ */}
</BlocoTextoWrapper>

      {slide.mostrarFooter !== false && (
        <>
          <div
            style={{
              position: "absolute",
              left: e(72),
              bottom: e(96),
              color: corUrl,
              fontSize: e(34 * escalaGeral),
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            parceleaqui.com.br
          </div>

          <div
            style={{
              position: "absolute",
              right: e(112),
              bottom: e(108),
            }}
          >
            <LogoParceleAqui
              tamanho={104 * escala}
              cor={PARCELE_AQUI_CORES.cremeFooter}
              corCirculo={PARCELE_AQUI_CORES.pretoTexto}
              corSombra={PARCELE_AQUI_CORES.amareloEscuroAlt}
            />
          </div>
        </>
      )}
    </div>
  );
}
