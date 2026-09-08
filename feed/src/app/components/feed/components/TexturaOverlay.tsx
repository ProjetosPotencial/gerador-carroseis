/**
 * Camada de textura overlay aplicada sobre a peça.
 *
 * Visual: imagem PNG/JPEG com manchas orgânicas de luz/sombra + grão sutil,
 * aplicada em modo `mix-blend-mode: overlay` com opacity 75%, exatamente como
 * no Figma (camada "BG" 75% Overlay, conforme print do cliente).
 *
 * v7.7.6: agora aceita `alturaUtil` que limita a textura a NÃO invadir o rodapé.
 * O rodapé fica como camada superior em todos os templates.
 *
 * Posicionamento:
 *  - position: absolute, top: 0, left: 0 (cobre da topo até alturaUtil)
 *  - z-index: ABAIXO dos textos e do rodapé
 *  - pointer-events: none (não atrapalha cliques)
 */
export default function TexturaOverlay({
  opacity = 0.75,
  modo = "overlay",
  visivel = true,
  alturaUtil,
  escala = 1,
}: {
  /** Opacidade da textura (0 a 1). Default 0.75 (igual Figma). */
  opacity?: number;
  /** Modo de mistura. Default "overlay" (efeito do Figma). */
  modo?: "overlay" | "soft-light" | "multiply" | "normal";
  /** Permite ocultar via toggle no painel. */
  visivel?: boolean;
  /**
   * v7.7.6: Altura em px (no espaço 1080×H) até onde a textura aparece.
   * Se omitido, cobre 100% da peça (comportamento legado).
   * Quando definido, a textura termina em alturaUtil (= H_peca - alturaRodape),
   * garantindo que o rodapé PNG fique livre de texturas.
   */
  alturaUtil?: number;
  /** Escala atual de render (preview). Default 1. */
  escala?: number;
}) {
  if (!visivel) return null;

  // Se alturaUtil não foi passado, comportamento legado (cobre tudo)
  const usaClip = typeof alturaUtil === "number";

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: usaClip ? `${1080 * escala}px` : "100%",
        height: usaClip ? `${alturaUtil! * escala}px` : "100%",
        backgroundImage: "url('/textura-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        mixBlendMode: modo,
        opacity,
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
}
