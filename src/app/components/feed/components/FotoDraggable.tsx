/**
 * FotoDraggable — foto de fundo com ZOOM + ARRASTO modernos (v7.24).
 *
 * Recursos:
 * - Zoom 1x-3x (prop `zoom`), via slider no editor OU scroll do mouse no preview.
 * - A imagem e renderizada no TAMANHO REAL de cobertura (>= container em ambos os
 *   eixos). O excedente vira "folga" arrastavel, entao da pra arrastar por toda a
 *   area visivel — inclusive SEM zoom, quando a foto e mais alta/larga que a janela.
 * - Pan LIMITADO: a imagem NUNCA sai do quadro (sem borda cortada/vazia).
 * - Arrasto 1:1 (a foto segue o cursor).
 *
 * Modos:
 * - Editor (recebe onPositionChange/onZoomChange): arrasto + scroll ativos.
 * - Export (sem callbacks): so renderiza a posicao salva, pixel a pixel.
 */
import { useState, useRef, useEffect } from "react";

interface FotoDraggableProps {
  src: string;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  onPositionChange?: (offsetX: number, offsetY: number) => void;
  onZoomChange?: (zoom: number) => void;
  width: number;
  height: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function FotoDraggable({
  src,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
  onPositionChange,
  onZoomChange,
  width,
  height,
}: FotoDraggableProps) {
  const z = Math.max(1, Math.min(3, zoom || 1));

  const [arrastando, setArrastando] = useState(false);
  // v7.24: tamanho natural da imagem (default 4:5 vertical — padrao gerado).
  const [nat, setNat] = useState<{ w: number; h: number }>({ w: 1080, h: 1350 });
  const containerRef = useRef<HTMLDivElement>(null);

  const coverScale = Math.max(width / nat.w, height / nat.h);
  const dispW = nat.w * coverScale * z;
  const dispH = nat.h * coverScale * z;
  const overflowX = Math.max(0, dispW - width);
  const overflowY = Math.max(0, dispH - height);
  const maxOffX = overflowX > 0 ? 50 : 0; // offset normalizado -50..50 (50 = borda)
  const maxOffY = overflowY > 0 ? 50 : 0;
  const ox = clamp(offsetX ?? 0, -maxOffX, maxOffX);
  const oy = clamp(offsetY ?? 0, -maxOffY, maxOffY);
  const panX = (ox / 50) * (overflowX / 2);
  const panY = (oy / 50) * (overflowY / 2);
  const podeArrastar = Boolean(onPositionChange) && (overflowX > 1 || overflowY > 1);

  const dragRef = useRef({ iniciouEm: { x: 0, y: 0 }, offsetInicial: { x: ox, y: oy } });

  // Zoom por scroll do mouse (listener nativo p/ poder previnir o scroll da pagina)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onZoomChange) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const fator = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const nz = clamp(z * fator, 1, 3);
      onZoomChange(Number(nz.toFixed(3)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [z, onZoomChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!podeArrastar) return;
    e.preventDefault();
    e.stopPropagation();
    setArrastando(true);
    dragRef.current = { iniciouEm: { x: e.clientX, y: e.clientY }, offsetInicial: { x: ox, y: oy } };
  };

  useEffect(() => {
    if (!arrastando) return;
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current || !onPositionChange) return;
      const rect = containerRef.current.getBoundingClientRect();
      // px de tela -> px do slide (mesma escala) -> offset normalizado pela folga real.
      const escX = rect.width / width || 1;
      const escY = rect.height / height || 1;
      const dPanX = overflowX > 0 ? (e.clientX - dragRef.current.iniciouEm.x) / escX : 0;
      const dPanY = overflowY > 0 ? (e.clientY - dragRef.current.iniciouEm.y) / escY : 0;
      const dOx = overflowX > 0 ? (dPanX / (overflowX / 2)) * 50 : 0;
      const dOy = overflowY > 0 ? (dPanY / (overflowY / 2)) * 50 : 0;
      const novoX = clamp(dragRef.current.offsetInicial.x + dOx, -maxOffX, maxOffX);
      const novoY = clamp(dragRef.current.offsetInicial.y + dOy, -maxOffY, maxOffY);
      onPositionChange(novoX, novoY);
    };
    const handleUp = () => setArrastando(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [arrastando, onPositionChange, overflowX, overflowY, maxOffX, maxOffY, width, height]);

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
        touchAction: onZoomChange ? "none" : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={src}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        onLoad={(e) => {
          const im = e.currentTarget;
          if (im.naturalWidth && im.naturalHeight) setNat({ w: im.naturalWidth, h: im.naturalHeight });
        }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: dispW,
          height: dispH,
          maxWidth: "none",
          transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px)`,
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
