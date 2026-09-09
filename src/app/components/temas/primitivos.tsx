import React, { useState, useRef, useEffect } from "react";
import type { CoresResolvidas, TemaConfig, SlideData, ConfigBaseElemento, ElementoTipo } from "./tipos";
import { resolverFonteHeadline, resolverEstiloElemento, FONTE_FAMILIAS } from "./tipos";
import { useAjuste, type CaixaLayout } from "./useAjuste";

export type { CaixaLayout };

/**
 * v7.28 — os primitivos de texto passaram a calcular o corpo da fonte em vez
 * de recebê-lo fixo. O `tamanho` que o layout informa virou TETO, não valor
 * absoluto: o motor mede o texto e desce até caber na caixa. Quando o
 * operador fixa `tamanhoPx` na mão, o motor sai da frente e respeita.
 * Passe `ajustar={false}` pra voltar ao comportamento antigo num caso pontual.
 */

// ============================================================
// PRIMITIVOS VISUAIS COMPARTILHADOS
// Usados dentro de qualquer layout de qualquer tema.
// ============================================================

/** Topbar com nome da marca + numeração do slide. */
export function Topbar({
  cor,
  marca,
  numero,
  estilo = "padrao",
  corNumero,
  mostrar = true,
  tamanho,
}: {
  cor: string;
  marca: string;
  numero: string;
  estilo?: "padrao" | "refined";
  /** v7.25: tamanho do texto do topbar (px). Se omitido, usa o padrão do estilo. */
  tamanhoTexto?: number;
  /** v7.5: cor independente da numeração (se omitida, usa `cor`) */
  corNumero?: string;
  /** v7.6: se false, não renderiza nada. Default true. */
  mostrar?: boolean;
  tamanho?: number;
}) {
  if (!mostrar) return null;
  const tamTexto = (tamanho as number | undefined) ?? (estilo === "refined" ? 12 : 14);
  const tracking = estilo === "refined" ? "1.5px" : "2px";
  return (
    <div
      style={{
        position: "absolute",
        top: 42,
        left: 56,
        right: 56,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: tamTexto,
        fontWeight: 700,
        letterSpacing: tracking,
        textTransform: "uppercase",
        color: cor,
        opacity: 0.8,
        zIndex: 10,
      }}
    >
      <span>{marca}</span>
      <span style={{ color: corNumero || cor }}>{numero}</span>
    </div>
  );
}

/** Kicker pequeno em caixa alta com divisor colorido abaixo. */
interface PropsKicker {
  texto: string;
  cor: string;
  accent: string;
  mostrarDivisor?: boolean;
  slide?: SlideData;
  tamanho?: number;
  peso?: number;
  tracking?: number;
  caps?: boolean;
  caixa?: CaixaLayout;
  ajustar?: boolean;
}

export function Kicker(props: PropsKicker) {
  if (!props.texto) return null;
  return <KickerInterno {...props} />;
}

function KickerInterno({
  texto,
  cor,
  accent,
  mostrarDivisor = true,
  slide,
  tamanho = 14,
  peso = 800,
  tracking = 3,
  caps = true,
  caixa,
  ajustar = true,
}: PropsKicker) {
  const estilo = slide
    ? resolverEstiloElemento(slide, "kicker", {
        tamanho,
        peso: peso as any,
        caps,
        tracking,
      })
    : {
        fontSize: tamanho,
        fontFamily: "'Poppins', sans-serif",
        fontWeight: peso,
        letterSpacing: `${tracking}px`,
        textTransform: caps ? ("uppercase" as const) : ("none" as const),
      };

  const fixadoNaMao = Boolean(slide?.tipoKicker?.tamanhoPx);
  const { ref, fontSize } = useAjuste({
    texto,
    elemento: "kicker",
    slideId: slide?.id,
    estilo: {
      fontFamily: estilo.fontFamily,
      fontWeight: estilo.fontWeight,
      letterSpacing: estilo.letterSpacing,
      textTransform: estilo.textTransform,
    },
    tamanhoBase: estilo.fontSize,
    lineHeight: 1.2,
    preLine: false,
    desativado: !ajustar || fixadoNaMao,
    caixa,
  });

  return (
    <>
      <div
        ref={ref}
        style={{
          ...estilo,
          fontSize,
          lineHeight: 1.2,
          color: cor,
        }}
      >
        {texto}
      </div>
      {mostrarDivisor && (
        <div
          style={{
            width: 72,
            height: 5,
            backgroundColor: accent,
            marginTop: 18,
            marginBottom: 18,
          }}
        />
      )}
    </>
  );
}

interface PropsHeadline {
  texto: string;
  cor: string;
  /** TETO do corpo da fonte. O motor desce a partir daqui até caber. */
  tamanho?: number;
  uppercase?: boolean;
  fontFamily: string;
  pesoHeadline?: number;
  letterSpacing?: string;
  lineHeight?: number;
  italic?: boolean;
  /** Se passado, aplica overrides de caps/escala/fonte/peso/tracking do slide */
  slide?: SlideData;
  /** Piso do corpo da fonte em px (garante legibilidade no feed) */
  tamanhoMinimo?: number;
  /** Caixa útil declarada pelo layout (altura e teto de linhas). */
  caixa?: CaixaLayout;
  /** false volta ao comportamento de corpo fixo da v7.27. */
  ajustar?: boolean;
}

/** Headline grande. v7.28: o corpo da fonte é calculado, não constante. */
export function Headline(props: PropsHeadline) {
  if (!props.texto) return null;
  return <HeadlineInterno {...props} />;
}

function HeadlineInterno({
  texto,
  cor,
  tamanho = 88,
  uppercase = true,
  fontFamily,
  pesoHeadline = 900,
  letterSpacing = "-2px",
  lineHeight = 0.98,
  italic = false,
  slide,
  tamanhoMinimo = 28,
  caixa,
  ajustar = true,
}: PropsHeadline) {
  const trackingNumerico = parseLetterSpacing(letterSpacing);

  // Estilo resolvido (overrides do slide quando existirem)
  const estilo = slide
    ? resolverEstiloElemento(slide, "headline", {
        tamanho,
        peso: pesoHeadline as any,
        caps: uppercase,
        tracking: trackingNumerico,
      })
    : {
        fontSize: tamanho,
        fontFamily,
        fontWeight: pesoHeadline,
        letterSpacing,
        textTransform: (uppercase ? "uppercase" : "none") as any,
      };

  const familia = slide ? estilo.fontFamily || fontFamily : fontFamily;
  const teto = Math.max(tamanhoMinimo, estilo.fontSize);
  // Operador fixou o tamanho na mão: respeita e não mexe.
  const fixadoNaMao = Boolean(slide?.tipoHeadline?.tamanhoPx);

  const { ref, fontSize } = useAjuste({
    texto,
    elemento: "headline",
    slideId: slide?.id,
    estilo: {
      fontFamily: familia,
      fontWeight: estilo.fontWeight,
      letterSpacing: estilo.letterSpacing,
      textTransform: estilo.textTransform,
      fontStyle: italic ? "italic" : "normal",
    },
    tamanhoBase: teto,
    lineHeight,
    preLine: true,
    desativado: !ajustar || fixadoNaMao,
    caixa: {
      ...caixa,
      min: caixa?.min ?? Math.max(tamanhoMinimo, Math.round(teto * 0.45)),
    },
  });

  return (
    <div
      ref={ref}
      style={{
        ...estilo,
        fontFamily: familia,
        fontSize,
        color: cor,
        lineHeight,
        whiteSpace: "pre-line",
        textWrap: "balance" as any,
        fontStyle: italic ? "italic" : "normal",
      }}
    >
      {texto}
    </div>
  );
}

function parseLetterSpacing(ls: string): number {
  if (!ls || ls === "normal") return 0;
  const match = ls.match(/(-?\d+(?:\.\d+)?)\s*px/);
  if (match) return parseFloat(match[1]);
  return 0;
}

interface PropsCorpo {
  texto: string;
  cor: string;
  tamanho?: number;
  fontFamily: string;
  italic?: boolean;
  maxWidth?: number;
  slide?: SlideData;
  peso?: number;
  caixa?: CaixaLayout;
  ajustar?: boolean;
}

/** Corpo de texto padrão. v7.28: com auto-ajuste. */
export function Corpo(props: PropsCorpo) {
  if (!props.texto) return null;
  return <CorpoInterno {...props} />;
}

function CorpoInterno({
  texto,
  cor,
  tamanho = 24,
  fontFamily,
  italic = false,
  maxWidth,
  slide,
  peso = 400,
  caixa,
  ajustar = true,
}: PropsCorpo) {
  const estilo = slide
    ? resolverEstiloElemento(slide, "corpo", {
        tamanho,
        peso: peso as any,
        caps: false,
      })
    : {
        fontSize: tamanho,
        fontFamily,
        fontWeight: peso,
        letterSpacing: "normal" as const,
        textTransform: "none" as const,
      };

  const familia = slide?.tipoCorpo?.fonte ? estilo.fontFamily : fontFamily;
  const fixadoNaMao = Boolean(slide?.tipoCorpo?.tamanhoPx);
  const lineHeight = 1.45;

  const { ref, fontSize } = useAjuste({
    texto,
    elemento: "corpo",
    slideId: slide?.id,
    estilo: {
      fontFamily: familia,
      fontWeight: estilo.fontWeight,
      letterSpacing: estilo.letterSpacing,
      textTransform: estilo.textTransform,
      fontStyle: italic ? "italic" : "normal",
    },
    tamanhoBase: estilo.fontSize,
    lineHeight,
    preLine: true,
    desativado: !ajustar || fixadoNaMao,
    caixa: { largura: maxWidth, ...caixa },
  });

  return (
    <div
      ref={ref}
      style={{
        ...estilo,
        fontFamily: familia,
        fontSize,
        lineHeight,
        color: cor,
        whiteSpace: "pre-line",
        fontStyle: italic ? "italic" : "normal",
        maxWidth,
      }}
    >
      {texto}
    </div>
  );
}

interface PropsDestaque {
  texto: string;
  cor: string;
  fontFamily: string;
  tamanho?: number;
  slide?: SlideData;
  peso?: number;
  caixa?: CaixaLayout;
  ajustar?: boolean;
}

/** Frase de destaque em bold colorido. v7.28: com auto-ajuste. */
export function Destaque(props: PropsDestaque) {
  if (!props.texto) return null;
  return <DestaqueInterno {...props} />;
}

function DestaqueInterno({
  texto,
  cor,
  fontFamily,
  tamanho = 26,
  slide,
  peso = 900,
  caixa,
  ajustar = true,
}: PropsDestaque) {
  const estilo = slide
    ? resolverEstiloElemento(slide, "destaque", {
        tamanho,
        peso: peso as any,
        caps: false,
      })
    : {
        fontSize: tamanho,
        fontFamily,
        fontWeight: peso,
        letterSpacing: "normal" as const,
        textTransform: "none" as const,
      };

  const familia = slide?.tipoDestaque?.fonte ? estilo.fontFamily : fontFamily;
  const fixadoNaMao = Boolean(slide?.tipoDestaque?.tamanhoPx);
  const lineHeight = 1.35;

  const { ref, fontSize } = useAjuste({
    texto,
    elemento: "destaque",
    slideId: slide?.id,
    estilo: {
      fontFamily: familia,
      fontWeight: estilo.fontWeight,
      letterSpacing: estilo.letterSpacing,
      textTransform: estilo.textTransform,
    },
    tamanhoBase: estilo.fontSize,
    lineHeight,
    preLine: true,
    desativado: !ajustar || fixadoNaMao,
    caixa,
  });

  return (
    <div
      ref={ref}
      style={{
        ...estilo,
        fontFamily: familia,
        fontSize,
        lineHeight,
        color: cor,
        textWrap: "balance" as any,
      }}
    >
      {texto}
    </div>
  );
}

/** Pill de CTA arredondado. */
export function Pill({
  texto,
  corFundo,
  corTexto,
  slide,
  tamanho = 14,
  peso = 900,
  tracking = 2,
  caps = true,
  borderRadius = 16,
}: {
  texto: string;
  corFundo: string;
  corTexto: string;
  slide?: SlideData;
  tamanho?: number;
  peso?: number;
  tracking?: number;
  caps?: boolean;
  borderRadius?: number;
}) {
  if (!texto) return null;

  const estilo = slide
    ? resolverEstiloElemento(slide, "pill" as any, {
        tamanho,
        peso: peso as any,
        caps,
        tracking,
      })
    : {
        fontSize: tamanho,
        fontFamily: "'Poppins', sans-serif",
        fontWeight: peso,
        letterSpacing: `${tracking}px`,
        textTransform: caps ? ("uppercase" as const) : ("none" as const),
      };

  return (
    <div
      style={{
        ...estilo,
        display: "inline-block",
        backgroundColor: corFundo,
        color: corTexto,
        padding: "12px 24px",
        borderRadius: borderRadius,
      }}
    >
      {texto}
    </div>
  );
}

/** Placeholder visual quando não há foto (listra diagonal). */
export function Placeholder({
  largura,
  altura,
  accent,
  texto = "[ Adicione uma foto aqui ]",
  borderRadius = 0,
}: {
  largura: number;
  altura: number;
  accent: string;
  texto?: string;
  borderRadius?: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: largura,
        height: altura,
        backgroundColor: "#1f1f1f",
        backgroundImage:
          "repeating-linear-gradient(45deg, #2a2a2a, #2a2a2a 20px, #1a1a1a 20px, #1a1a1a 40px)",
        borderRadius,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 20,
          border: `2px dashed ${accent}80`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "10%",
          right: "10%",
          transform: "translateY(-50%)",
          backgroundColor: "rgba(0,0,0,0.85)",
          border: `1px solid ${accent}`,
          padding: "14px 18px",
          color: accent,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {texto}
      </div>
    </div>
  );
}

/** Foto com fallback pra placeholder. */
export function FotoOuPlaceholder({
  url,
  largura,
  altura,
  accent,
  texto,
  style,
  borderRadius = 0,
  zoom,
  offsetX,
  offsetY,
  onPositionChange,
  onZoomChange,
}: {
  url: string;
  largura: number;
  altura: number;
  accent: string;
  texto?: string;
  style?: React.CSSProperties;
  borderRadius?: number;
  /** v7.7.23: zoom 1-3 (default 1). */
  zoom?: number;
  /** v7.7.23: offset X em % -50 a +50 (default 0). */
  offsetX?: number;
  /** v7.7.23: offset Y em % -50 a +50 (default 0). */
  offsetY?: number;
  /** v7.7.23: callback de drag. Quando undefined, drag desativado (modo export). */
  onPositionChange?: (offsetX: number, offsetY: number) => void;
  /** v7.22: zoom por scroll do mouse. */
  onZoomChange?: (zoom: number) => void;
}) {
  const clampN = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));
  const z = Math.max(1, Math.min(3, zoom ?? 1));

  const [arrastando, setArrastando] = useState(false);
  // v7.24: tamanho natural da imagem (default 4:5 vertical — padrao gerado).
  const [nat, setNat] = useState<{ w: number; h: number }>({ w: 1080, h: 1350 });
  const containerRef = useRef<HTMLDivElement>(null);

  // A imagem e renderizada no tamanho REAL de cobertura (>= container em ambos os
  // eixos) e o excedente vira "folga" arrastavel. Assim da pra arrastar por toda a
  // area visivel — inclusive SEM zoom, quando a foto e mais alta/larga que a janela.
  const coverScale = Math.max(largura / nat.w, altura / nat.h);
  const dispW = nat.w * coverScale * z;
  const dispH = nat.h * coverScale * z;
  const overflowX = Math.max(0, dispW - largura);
  const overflowY = Math.max(0, dispH - altura);
  const maxOffX = overflowX > 0 ? 50 : 0; // offset normalizado -50..50 (50 = borda)
  const maxOffY = overflowY > 0 ? 50 : 0;
  const ox = clampN(offsetX ?? 0, -maxOffX, maxOffX);
  const oy = clampN(offsetY ?? 0, -maxOffY, maxOffY);
  const panX = (ox / 50) * (overflowX / 2);
  const panY = (oy / 50) * (overflowY / 2);
  const podeArrastar = Boolean(onPositionChange) && (overflowX > 1 || overflowY > 1);

  const dragRef = useRef({ iniciouEm: { x: 0, y: 0 }, offsetInicial: { x: ox, y: oy } });

  // Zoom por scroll do mouse
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onZoomChange) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const fator = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      onZoomChange(Number(clampN(z * fator, 1, 3).toFixed(3)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [z, onZoomChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!podeArrastar) return;
    e.preventDefault();
    e.stopPropagation();
    setArrastando(true);
    dragRef.current = {
      iniciouEm: { x: e.clientX, y: e.clientY },
      offsetInicial: { x: ox, y: oy },
    };
  };

  useEffect(() => {
    if (!arrastando) return;
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current || !onPositionChange) return;
      const rect = containerRef.current.getBoundingClientRect();
      // px de tela -> px do slide (mesma escala) -> offset normalizado pela folga real.
      const escX = rect.width / largura || 1;
      const escY = rect.height / altura || 1;
      const dPanX = overflowX > 0 ? (e.clientX - dragRef.current.iniciouEm.x) / escX : 0;
      const dPanY = overflowY > 0 ? (e.clientY - dragRef.current.iniciouEm.y) / escY : 0;
      const dOx = overflowX > 0 ? (dPanX / (overflowX / 2)) * 50 : 0;
      const dOy = overflowY > 0 ? (dPanY / (overflowY / 2)) * 50 : 0;
      const novoX = clampN(dragRef.current.offsetInicial.x + dOx, -maxOffX, maxOffX);
      const novoY = clampN(dragRef.current.offsetInicial.y + dOy, -maxOffY, maxOffY);
      onPositionChange(novoX, novoY);
    };
    const handleUp = () => setArrastando(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [arrastando, onPositionChange, overflowX, overflowY, maxOffX, maxOffY, largura, altura]);

  if (url) {
    return (
      <div
        ref={containerRef}
        style={{
          width: largura,
          height: altura,
          borderRadius,
          overflow: "hidden",
          position: "relative",
          cursor: podeArrastar ? (arrastando ? "grabbing" : "grab") : "default",
          userSelect: "none",
          touchAction: onZoomChange ? "none" : undefined,
          // v7.22.1: sobe pra frente SO enquanto arrasta (pra nao tampar o texto).
          zIndex: arrastando ? 100 : undefined,
          ...style,
        }}
        onMouseDown={handleMouseDown}
      >
        <img
          src={url}
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
  return (
    <div style={style}>
      <Placeholder largura={largura} altura={altura} accent={accent} texto={texto} borderRadius={borderRadius} />
    </div>
  );
}

/** Big number centralizado (ex: +32%). */
export function BigNumber({
  texto,
  cor,
  fontFamily,
  tamanho = 240,
  slide,
  peso = 900,
}: {
  texto: string;
  cor: string;
  fontFamily: string;
  tamanho?: number;
  slide?: SlideData;
  peso?: number;
}) {
  const estilo = slide
    ? resolverEstiloElemento(slide, "numero", {
        tamanho,
        peso: peso as any,
        caps: false,
        tracking: -8,
      })
    : {
        fontSize: tamanho,
        fontFamily,
        fontWeight: peso,
        letterSpacing: "-8px" as const,
        textTransform: "none" as const,
      };

  return (
    <div
      style={{
        ...estilo,
        fontFamily: slide?.tipoNumero?.fonte ? estilo.fontFamily : fontFamily,
        lineHeight: 0.85,
        color: cor,
      }}
    >
      {texto}
    </div>
  );
}

/** Helper: aplica cantos arredondados ao slide inteiro (usado no Keynote Minimal). */
export function containerArredondado(raio: number, fundo: string): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    backgroundColor: fundo,
    borderRadius: raio,
    overflow: "hidden",
  };
}

// ============================================================
// AUTOFIT — v7.28
// ============================================================
/**
 * Envelope de auto-ajuste para os temas que montam a tipografia inline com
 * `aplicarTipoElemento` (tweet, keynote, editorial) em vez de usar os
 * primitivos Headline/Corpo/Destaque/Kicker.
 *
 * Migração de um bloco: envolva a div existente, sem mexer no conteúdo dela.
 *
 *   <AutoFit slide={slide} elemento="headline" maxLinhas={4} alturaMax={300}>
 *     <div style={{ ...aplicarTipoElemento(slide, "headline", { tamanho: 100 }), color: CORES.creme }}>
 *       {slide.headline}
 *     </div>
 *   </AutoFit>
 *
 * O `fontSize` que já está no style da div vira o TETO. O motor mede o texto
 * e desce a partir dele até caber. Nada mais muda no layout.
 */
export function AutoFit({
  children,
  slide,
  elemento,
  maxLinhas,
  alturaMax,
  min,
  largura,
  ajustar = true,
}: {
  children: React.ReactElement;
  slide?: SlideData;
  elemento: "kicker" | "headline" | "corpo" | "destaque" | "pill" | "numero";
  maxLinhas?: number;
  alturaMax?: number;
  min?: number;
  largura?: number;
  ajustar?: boolean;
}) {
  const filho = React.Children.only(children) as React.ReactElement<any>;
  const estiloFilho = (filho.props?.style || {}) as React.CSSProperties;

  const texto = typeof filho.props?.children === "string" ? filho.props.children : "";
  const teto = Number(estiloFilho.fontSize) || 0;
  const lineHeight = Number(estiloFilho.lineHeight) || 1.2;
  const preLine = estiloFilho.whiteSpace === "pre-line";

  const campoOverride = {
    kicker: "tipoKicker",
    headline: "tipoHeadline",
    corpo: "tipoCorpo",
    destaque: "tipoDestaque",
    pill: "tipoPill",
    numero: "tipoNumero",
  }[elemento] as keyof SlideData;
  const fixadoNaMao = Boolean((slide?.[campoOverride] as any)?.tamanhoPx);

  const { ref, fontSize } = useAjuste({
    texto,
    elemento,
    slideId: slide?.id,
    estilo: {
      fontFamily: String(estiloFilho.fontFamily || "inherit"),
      fontWeight: (estiloFilho.fontWeight as any) ?? 400,
      letterSpacing: String(estiloFilho.letterSpacing ?? "normal"),
      textTransform: String(estiloFilho.textTransform ?? "none"),
      fontStyle: String(estiloFilho.fontStyle ?? "normal"),
    },
    tamanhoBase: teto,
    lineHeight,
    preLine,
    // Sem texto simples ou sem tamanho declarado não há o que ajustar.
    desativado: !ajustar || fixadoNaMao || !texto || teto <= 0,
    caixa: { largura, alturaMax, maxLinhas, min },
  });

  return React.cloneElement(filho, {
    ref,
    style: { ...estiloFilho, fontSize: fontSize || estiloFilho.fontSize },
  });
}
