/**
 * FotoDraggable — exibe a foto de fundo com suporte a:
 * - zoom (1x a 3x via prop)
 * - drag pra reposicionar (quando há onPositionChange E zoom > 1)
 *
 * Quando o usuário arrasta, dispara onPositionChange com offsets em %
 * (-50 a +50). Esses valores ficam salvos no auto-save do slide.
 *
 * Modos:
 * - Editor (preview): drag ativo, cursor grab/grabbing
 * - Export (offscreen, sem onPositionChange): drag desativado, só renderiza
 *
 * IMPORTANTE: pra html2canvas capturar corretamente, o drag NÃO afeta a
 * estrutura DOM — só o objectPosition do <img>. Então no momento do
 * export, a posição salva no slide já é refletida pixel-a-pixel.
 */
import { useState, useRef, useEffect } from "react";

interface FotoDraggableProps {
  src: string;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  onPositionChange?: (offsetX: number, offsetY: number) => void;
  width: number;
  height: number;
}

export default function FotoDraggable({
  src,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
  onPositionChange,
  width,
  height,
}: FotoDraggableProps) {
  const [arrastando, setArrastando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // refs pra ter sempre o valor mais recente sem re-criar listeners
  const dragRef = useRef({
    iniciouEm: { x: 0, y: 0 },
    offsetInicial: { x: offsetX, y: offsetY },
  });

  const podeArrastar = Boolean(onPositionChange) && zoom > 1;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!podeArrastar) return;
    e.preventDefault();
    e.stopPropagation();
    setArrastando(true);
    dragRef.current = {
      iniciouEm: { x: e.clientX, y: e.clientY },
      offsetInicial: { x: offsetX, y: offsetY },
    };
  };

  useEffect(() => {
    if (!arrastando) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !onPositionChange) return;
      const rect = containerRef.current.getBoundingClientRect();
      // dx/dy em pixels da viewport → convertido pra % do container
      const dxPct = ((e.clientX - dragRef.current.iniciouEm.x) / rect.width) * 100;
      const dyPct = ((e.clientY - dragRef.current.iniciouEm.y) / rect.height) * 100;
      // v7.7.22: usando transform translate() — sinal natural (foto segue o mouse).
      // Multiplicar por zoom porque translate é aplicado APÓS scale.
      const novoX = clamp(dragRef.current.offsetInicial.x + dxPct * zoom, -50, 50);
      const novoY = clamp(dragRef.current.offsetInicial.y + dyPct * zoom, -50, 50);
      onPositionChange(novoX, novoY);
    };

    const handleMouseUp = () => {
      setArrastando(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [arrastando, onPositionChange, zoom]);

  // Estratégia v7.7.22: usar transform translate() pra deslocar.
  // objectPosition tem limite porque só desloca DENTRO do que foi cropado
  // pelo objectFit. Mas com transform scale + translate, a imagem inteira
  // pode ser deslocada livremente.
  //
  // offsetX/Y vão de -50 a +50 (% do container).
  // Translate em % é relativo ao TAMANHO da imagem (não do container).
  // Como a imagem ocupa 100% do container, % traduz 1:1.

  // Quando zoom > 1, há "sobra" de imagem além do container que pode ser deslocada
  // O quanto pode deslocar: (zoom - 1) / 2 * 100% do container
  // Mas pra simplificar e bater com a UX (-50 a +50), aplicamos direto

  const transformParts: string[] = [];
  if (zoom !== 1) transformParts.push(`scale(${zoom})`);
  if (offsetX !== 0 || offsetY !== 0) {
    // dividir por zoom porque translate é aplicado APÓS scale
    transformParts.push(`translate(${offsetX / zoom}%, ${offsetY / zoom}%)`);
  }
  const transformValue = transformParts.length > 0 ? transformParts.join(" ") : undefined;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        overflow: "hidden",
        cursor: podeArrastar ? (arrastando ? "grabbing" : "grab") : "default",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={src}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          transform: transformValue,
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
