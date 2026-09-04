import { forwardRef } from "react";
import { obterTema } from "./temas";
import { resolverCores } from "./temas/tipos";
import type { SlideData, TemaId } from "./temas/tipos";

// Re-exports pra retrocompatibilidade
export type { SlideData, TemaId, LayoutId, FonteHeadline } from "./temas/tipos";
export { criarSlideVazio } from "./temas/tipos";

interface Props {
  slide: SlideData;
  index: number;
  total: number;
  marca: string;
  temaId: TemaId;
  /** Quando true, sem transform — pra captura via html-to-image */
  escalaReal?: boolean;
  /** Escala visual pra preview miniaturizado */
  escala?: number;
  /** v7.7.23: callback de drag da foto. Quando undefined, drag desativado (modo export). */
  onSlideChange?: (patch: Partial<SlideData>) => void;
}

const CarrosselSlide = forwardRef<HTMLDivElement, Props>(function CarrosselSlide(
  { slide, index, total, marca, temaId, escalaReal = false, escala = 1, onSlideChange },
  ref
) {
  const tema = obterTema(temaId);
  const numero = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const coresResolvidas = resolverCores(slide, tema);
  const transform = escalaReal ? undefined : `scale(${escala})`;
  const ehUltimo = index === total - 1;

  // Acha o layout dentro do tema
  const layoutDef = tema.layouts.find((l) => l.id === slide.layout) || tema.layouts[0];

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1350,
        transform,
        transformOrigin: "top left",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {layoutDef.render({
        slide,
        tema,
        marca,
        numero,
        coresResolvidas,
        ehUltimo,
        onSlideChange,
      })}

      {/* v7.7.2: Textura granulada por cima do conteúdo (default desligada no carrossel) */}
      {slide.mostrarTextura && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/textura-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            mixBlendMode: "overlay",
            opacity: slide.opacidadeTextura ?? 0.75,
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      )}

      {/* Seta indicativa "deslize" no canto inferior direito (todos exceto último) */}
      {!ehUltimo && slide.mostrarSetinha !== false && (
        <SetaDeslizar
          accent={slide.corSetinha || (slide.layout === "split_invertido" ? "#ffffff" : coresResolvidas.accent)}
          tamanho={slide.tamSetinha ?? 120}
          espessura={slide.espessuraSetinha ?? 5}
        />
      )}
    </div>
  );
});

/**
 * Seta indicativa de deslizar — aparece em todos os slides menos o último.
 * Posicionada no canto inferior direito do slide.
 *
 * v7.5: Estilo outline — só contorno do círculo (sem fundo sólido) + seta
 * na mesma cor do contorno. Funciona em qualquer fundo: o accent já
 * resolve o contraste (em fundo amarelo, accent vira preto; em fundo
 * preto, accent fica amarelo).
 */
/**
 * Setinha indicativa de "deslize" no canto inferior direito.
 * v7.7.2: substituída pela SVG oficial fornecida pelo cliente.
 *
 * - Círculo com stroke (preserva o stroke do design)
 * - Seta interna apontando direita
 * - Tamanho e cor editáveis
 *
 * Defaults: 56px, accent do tema.
 */
function SetaDeslizar({
  accent,
  tamanho = 120,
  espessura = 5,
}: {
  accent: string;
  tamanho?: number;
  espessura?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 32,
        right: 32,
        zIndex: 10,
        opacity: 0.85,
      }}
    >
      <svg
        width={tamanho}
        height={tamanho}
        viewBox="-9 -9 125 125"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="53.5"
          cy="53.5"
          r="52"
          stroke={accent}
          strokeWidth={espessura}
        />
        <path
          d="M82.0607 55.0607C82.6465 54.4749 82.6465 53.5251 82.0607 52.9393L72.5147 43.3934C71.9289 42.8076 70.9792 42.8076 70.3934 43.3934C69.8076 43.9792 69.8076 44.9289 70.3934 45.5147L78.8787 54L70.3934 62.4853C69.8076 63.0711 69.8076 64.0208 70.3934 64.6066C70.9792 65.1924 71.9289 65.1924 72.5147 64.6066L82.0607 55.0607ZM27 54V55.5L81 55.5V54V52.5L27 52.5V54Z"
          fill={accent}
        />
      </svg>
    </div>
  );
}

export default CarrosselSlide;
