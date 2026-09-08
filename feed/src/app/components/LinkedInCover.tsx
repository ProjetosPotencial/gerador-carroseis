import svgPaths from "../../imports/svg-l2yh47psh";
import { useState, useEffect, useRef } from "react";

interface LinkedInCoverProps {
  numero?: string;
  titulo?: string;
  legendaLinha1?: string;
  legendaLinha2?: string;
  fotoUrl?: string;
  IconeCustomizado?: React.ComponentType<any>;
  usarLegenda1?: boolean;
  usarSubtitulo?: boolean;
  /** v7.7.2: mostra textura granulada por cima (overlay 75% — igual Feed/Stories) */
  mostrarTextura?: boolean;
  /** v7.7.2: opacidade da textura (0-1, default 0.75) */
  opacidadeTextura?: number;
  /** v7.7.23: zoom da foto (1-3, default 1) */
  fotoZoom?: number;
  /** v7.7.23: offset X da foto (-50 a +50, default 0) */
  fotoOffsetX?: number;
  /** v7.7.23: offset Y da foto (-50 a +50, default 0) */
  fotoOffsetY?: number;
  /** v7.7.23: callback quando usuário arrasta a foto. Quando undefined, drag desativado. */
  onFotoPositionChange?: (offsetX: number, offsetY: number) => void;
}

// Assets servidos pela pasta /public (mesma origem, não contaminam canvas)
const LOGO_URL = "/assets/f105090c0d8399c4c5ddf6f3b68c32fc5dfd387f.png";
const FOTO_PADRAO = "/assets/94f0de88dd7da2aa7b58f6680bcc081b5b16c90f.png";

/**
 * Dimensões do componente — 1280×720 (proporção 16:9, ideal LinkedIn).
 * Esses valores PRECISAM bater com os usados em gerarCapa.ts (BASE_WIDTH/HEIGHT).
 * Layout proporcional da referência 1200×675 (escala 1.0667).
 */
const WIDTH = 1280;
const HEIGHT = 720;

function IconePadrao() {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{ left: "77px", top: "301px", width: "85px", height: "85px" }}
    >
      <svg style={{ width: "51px", height: "51px" }} fill="none" viewBox="0 0 80 80">
        <g>
          <path d={svgPaths.p325f5470} fill="#371B01" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Resolve a URL da foto:
 * - figma:asset/xxx → /assets/xxx (legado)
 * - data:image/... → base64 (upload local, passa direto)
 * - URL externa → mantém (precisa aceitar CORS)
 * - vazio → foto padrão
 */
function resolveFotoUrl(url?: string): string {
  if (!url) return FOTO_PADRAO;
  if (url.startsWith("figma:asset/")) {
    const filename = url.replace("figma:asset/", "");
    return `/assets/${filename}`;
  }
  return url;
}

export default function LinkedInCover({
  numero = "49",
  titulo = "Mercado B2C: o uso estratégico e consciente do parcelamento",
  legendaLinha1 = "Tecnologia que destrava",
  legendaLinha2 = "o seu dia a dia financeiro.",
  fotoUrl = FOTO_PADRAO,
  IconeCustomizado,
  usarLegenda1 = true,
  usarSubtitulo = true,
  mostrarTextura = false,
  opacidadeTextura = 0.75,
  fotoZoom = 1,
  fotoOffsetX = 0,
  fotoOffsetY = 0,
  onFotoPositionChange,
}: LinkedInCoverProps) {
  const fotoResolvida = resolveFotoUrl(fotoUrl);
  const isDataUrl = fotoResolvida.startsWith("data:");

  // v7.7.23: drag da foto
  const [arrastando, setArrastando] = useState(false);
  const fotoContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    iniciouEm: { x: 0, y: 0 },
    offsetInicial: { x: fotoOffsetX, y: fotoOffsetY },
  });
  const podeArrastar = Boolean(onFotoPositionChange) && fotoZoom > 1;

  const handleFotoMouseDown = (e: React.MouseEvent) => {
    if (!podeArrastar) return;
    e.preventDefault();
    e.stopPropagation();
    setArrastando(true);
    dragRef.current = {
      iniciouEm: { x: e.clientX, y: e.clientY },
      offsetInicial: { x: fotoOffsetX, y: fotoOffsetY },
    };
  };

  useEffect(() => {
    if (!arrastando) return;
    const handleMove = (e: MouseEvent) => {
      if (!fotoContainerRef.current || !onFotoPositionChange) return;
      const rect = fotoContainerRef.current.getBoundingClientRect();
      const dxPct = ((e.clientX - dragRef.current.iniciouEm.x) / rect.width) * 100;
      const dyPct = ((e.clientY - dragRef.current.iniciouEm.y) / rect.height) * 100;
      const novoX = Math.max(-50, Math.min(50, dragRef.current.offsetInicial.x + dxPct * fotoZoom));
      const novoY = Math.max(-50, Math.min(50, dragRef.current.offsetInicial.y + dyPct * fotoZoom));
      onFotoPositionChange(novoX, novoY);
    };
    const handleUp = () => setArrastando(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [arrastando, onFotoPositionChange, fotoZoom]);

  // Transform combinado pra zoom + drag
  const transformParts: string[] = [];
  if (fotoZoom !== 1) transformParts.push(`scale(${fotoZoom})`);
  if (fotoOffsetX !== 0 || fotoOffsetY !== 0) {
    transformParts.push(`translate(${fotoOffsetX / fotoZoom}%, ${fotoOffsetY / fotoZoom}%)`);
  }
  const fotoTransform = transformParts.length > 0 ? transformParts.join(" ") : undefined;

  return (
    <div
      className="bg-white relative"
      style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}
    >
      {/* Shape amarelo */}
      <div
        className="absolute"
        style={{
          backgroundColor: "#ffcb31",
          height: "575px",
          left: "34px",
          right: "34px",
          top: "111px",
          borderBottomLeftRadius: "34px",
          borderBottomRightRadius: "34px",
          borderTopLeftRadius: "34px",
          borderTopRightRadius: "341px",
        }}
      />

      {/* Container da foto */}
      <div className="absolute" style={{ right: "34px", bottom: "34px" }}>
        <div
          ref={fotoContainerRef}
          className="relative overflow-hidden bg-gradient-to-br from-gray-300 to-gray-400"
          style={{
            height: "501px",
            width: "533px",
            borderBottomLeftRadius: "34px",
            borderBottomRightRadius: "34px",
            borderTopLeftRadius: "213px",
            borderTopRightRadius: "34px",
            cursor: podeArrastar ? (arrastando ? "grabbing" : "grab") : "default",
            userSelect: "none",
          }}
          onMouseDown={handleFotoMouseDown}
        >
          {fotoResolvida ? (
            <img
              alt=""
              className="absolute object-cover"
              src={fotoResolvida}
              draggable={false}
              {...(isDataUrl ? {} : { crossOrigin: "anonymous" as const })}
              style={{
                width: "100%",
                height: "100%",
                transform: fotoTransform,
                transformOrigin: "center center",
                pointerEvents: "none",
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-24 h-24 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Gradiente sobre a foto */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0) 32.867%, rgba(0,0,0,0.8) 95.333%)",
            }}
          />
        </div>
      </div>

      {/* Logo parcele aqui */}
      <div
        className="absolute"
        style={{ height: "78px", left: "34px", top: "34px", width: "380px" }}
      >
        <img
          alt="Parcele Aqui"
          src={LOGO_URL}
          crossOrigin="anonymous"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "left center",
          }}
        />
      </div>

      {/* Parcele News */}
      <p
        className="absolute font-['Kufam',sans-serif] text-right"
        style={{
          color: "#371b01",
          fontSize: "18px",
          fontWeight: 700,
          right: "34px",
          letterSpacing: "-0.02em",
          lineHeight: "1.2",
          top: "43px",
          margin: 0,
        }}
      >
        Parcele News
      </p>

      {/* Número */}
      <p
        className="absolute font-['Kufam',sans-serif] text-right"
        style={{
          color: "#371b01",
          fontSize: "53px",
          fontWeight: 700,
          right: "34px",
          letterSpacing: "-0.02em",
          lineHeight: "1",
          top: "82px",
          margin: 0,
        }}
      >
        #{numero}
      </p>

      {/* Card do ícone */}
      <div
        className="absolute rounded-[13px]"
        style={{
          backgroundColor: "#ffe8a4",
          height: "85px",
          left: "77px",
          top: "301px",
          width: "85px",
        }}
      />

      {/* Ícone */}
      {IconeCustomizado ? <IconeCustomizado /> : <IconePadrao />}

      {/* Título */}
      <h1
        className="absolute font-['Kufam',sans-serif]"
        style={{
          color: "#1a1a1a",
          fontSize: "45px",
          fontWeight: 700,
          left: "77px",
          letterSpacing: "-0.02em",
          lineHeight: "1.15",
          top: "425px",
          width: "603px",
          margin: 0,
        }}
      >
        {titulo}
      </h1>

      {/* Legenda sobre a foto */}
      {(usarLegenda1 || usarSubtitulo) && (
        <div
          className="absolute font-['Kufam',sans-serif] text-white"
          style={{
            left: `calc(${WIDTH}px - 34px - 533px + 47px)`,
            bottom: "47px",
            right: "calc(34px + 47px)",
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}
        >
          {usarLegenda1 && (
            <p style={{ fontSize: "21px", fontWeight: 400, lineHeight: "1.3", margin: 0 }}>
              {legendaLinha1}
            </p>
          )}
          {usarSubtitulo && (
            <p style={{ fontSize: "21px", fontWeight: 700, lineHeight: "1.3", margin: 0 }}>
              {legendaLinha2}
            </p>
          )}
        </div>
      )}

      {/* v7.7.2: Textura granulada overlay (igual Feed/Stories) */}
      {mostrarTextura && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/textura-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "overlay",
            opacity: opacidadeTextura,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
