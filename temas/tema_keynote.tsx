import type { TemaConfig, LayoutRenderProps } from "./tipos";
import { criarSlideVazio, resolverFonteHeadline, aplicarTipoElemento } from "./tipos";
import { FotoOuPlaceholder, Pill } from "./primitivos";

// ============================================================
// TEMA 4 — KEYNOTE MINIMAL
// Cantos arredondados visíveis, Inter leve, headlines amarelas.
// Sensação "Apple keynote" — pouco elemento, muita respiração.
// Baseado no print 4 (com headlines vermelhas convertidas para amarelo).
// ============================================================

const CORES = {
  preto: "#1a1a1a",      // um pouco menos escuro que o Classic (mais cinza)
  branco: "#ffffff",
  bege: "#EEEAE1",       // bege levemente mais quente
  amarelo: "#FFC528",
  cinzaTexto: "#b0b0b0",
  cinzaPalco: "#5a5a5a", // fundo de palco atrás dos cards
};

const FONTE_PADRAO = "'Inter', 'Archivo', system-ui, sans-serif";
const RAIO_CANTO = 20;

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function TopbarKeynote({
  corTexto,
  marca,
  numero,
  corNumero,
  mostrar = true,
}: {
  corTexto: string;
  marca: string;
  numero: string;
  /** v7.5: cor independente da numeração (se omitida, usa corTexto) */
  corNumero?: string;
  /** v7.6: se false, não renderiza nada. Default true. */
  mostrar?: boolean;
}) {
  if (!mostrar) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 38,
        left: 48,
        right: 48,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "1.8px",
        textTransform: "uppercase",
        color: corTexto,
        opacity: 0.65,
        zIndex: 10,
        fontFamily: FONTE_PADRAO,
      }}
    >
      <span>BRANDS DECODED</span>
      <span style={{ fontSize: 10 }}>{marca}</span>
      <span style={{ fontSize: 10, color: corNumero || corTexto }}>
        CONTEÚDO MOSTRA {numero.split(" / ")[0]}
      </span>
    </div>
  );
}

function FooterKeynote({
  corTexto,
  corAccent,
  mostrar = true,
}: {
  corTexto: string;
  corAccent: string;
  /** v7.6: se false, não renderiza nada. Default true. */
  mostrar?: boolean;
}) {
  if (!mostrar) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 38,
        left: 48,
        right: 48,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: corTexto,
        opacity: 0.6,
        fontFamily: FONTE_PADRAO,
      }}
    >
      <span>▶ BRANDS PAGE 5 / 000</span>
      <div
        style={{
          width: 16,
          height: 16,
          backgroundColor: corAccent,
          clipPath: "polygon(0 0, 100% 50%, 0 100%)",
        }}
      />
    </div>
  );
}

/** Container com cantos arredondados do slide (o "card keynote"). */
function CardKeynote({
  children,
  fundo,
  padding = 48,
}: {
  children: React.ReactNode;
  fundo: string;
  padding?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: CORES.cinzaPalco,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: fundo,
          borderRadius: RAIO_CANTO,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================
// LAYOUT A — Foto retrato + título amarelo embaixo (Steve Jobs style)
// ============================================================
function LayoutFotoRetrato({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <CardKeynote fundo={CORES.preto}>
      <FotoOuPlaceholder
        url={slide.fotoUrl}
        largura={1048}
        altura={1318}
        accent={CORES.amarelo}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
      {/* Overlay embaixo pra legibilidade */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.92) 90%)",
          pointerEvents: "none",
        }}
      />
      <TopbarKeynote corTexto={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />

      <div style={{ position: "absolute", bottom: 90, left: 48, right: 48 }}>
        <div
          style={{
            fontFamily: fonteHeadline,
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-1.5px",
            color: slide.corHeadline || CORES.amarelo,
            whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "headline", { tamanho: 60, peso: 700 as any, tracking: -1.5 })
        }}
        >
          {slide.headline}
        </div>
        {slide.corpo && (
          <div
            style={{
              fontFamily: FONTE_PADRAO,
              fontSize: 18,
              color: CORES.cinzaTexto,
              marginTop: 14,
              whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "corpo", { tamanho: 18, peso: 400 as any, tracking: 0 })
        }}
          >
            {slide.corpo}
          </div>
        )}
      </div>

      <FooterKeynote corTexto={coresResolvidas.rodape} corAccent={coresResolvidas.accent} mostrar={slide.mostrarRodape !== false} />
    </CardKeynote>
  );
}

// ============================================================
// LAYOUT B — Tipografia pura (headline amarelo + lorem ipsum)
// Fundo preto
// ============================================================
function LayoutTipografiaKeynote({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <CardKeynote fundo={CORES.preto}>
      <TopbarKeynote corTexto={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />

      <div style={{ position: "absolute", top: 130, left: 48, right: 48 }}>
        {slide.kicker && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: slide.corKicker || CORES.amarelo,
              marginBottom: 24,
              fontFamily: FONTE_PADRAO,
          ...aplicarTipoElemento(slide, "kicker", { tamanho: 12, peso: 700 as any, tracking: 2.5 })
        }}
          >
            {slide.kicker}
          </div>
        )}

        <div
          style={{
            fontFamily: fonteHeadline,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: "-2px",
            color: slide.corHeadline || CORES.amarelo,
            whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "headline", { tamanho: 72, peso: 700 as any, tracking: -2 })
        }}
        >
          {slide.headline}
        </div>

        {slide.corpo && (
          <div
            style={{
              fontFamily: FONTE_PADRAO,
              fontSize: 20,
              lineHeight: 1.5,
              color: CORES.cinzaTexto,
              marginTop: 32,
              whiteSpace: "pre-line",
              maxWidth: "85%",
          ...aplicarTipoElemento(slide, "corpo", { tamanho: 20, peso: 400 as any, tracking: 0 })
        }}
          >
            {slide.corpo}
          </div>
        )}

        {slide.destaque && (
          <div
            style={{
              fontFamily: FONTE_PADRAO,
              fontSize: 22,
              lineHeight: 1.4,
              fontWeight: 700,
              color: slide.corDestaque || CORES.branco,
              marginTop: 28,
              whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "destaque", { tamanho: 22, peso: 700 as any, tracking: 0 })
        }}
          >
            {slide.destaque}
          </div>
        )}
      </div>

      <FooterKeynote corTexto={coresResolvidas.rodape} corAccent={coresResolvidas.accent} mostrar={slide.mostrarRodape !== false} />
    </CardKeynote>
  );
}

// ============================================================
// LAYOUT C — Dupla foto (split horizontal)
// ============================================================
function LayoutDuplaFotoKeynote({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <CardKeynote fundo={CORES.preto}>
      <TopbarKeynote corTexto={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />

      {/* Foto 1 (topo) */}
      <div style={{ position: "absolute", top: 100, left: 48, right: 48 }}>
        <FotoOuPlaceholder
          url={slide.fotoUrl}
          largura={952}
          altura={500}
          accent={CORES.amarelo}
          borderRadius={8}
          style={{ width: 952, height: 500, objectFit: "cover", borderRadius: 8 }}
        zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
      </div>

      {/* Foto 2 (meio) */}
      <div style={{ position: "absolute", top: 620, left: 48, right: 48 }}>
        <FotoOuPlaceholder
          url={slide.fotoUrl2}
          largura={952}
          altura={420}
          accent={CORES.amarelo}
          borderRadius={8}
          style={{ width: 952, height: 420, objectFit: "cover", borderRadius: 8 }}
        />
      </div>

      {/* Headline embaixo (se tiver) */}
      {slide.headline && (
        <div style={{ position: "absolute", bottom: 90, left: 48, right: 48 }}>
          <div
            style={{
              fontFamily: fonteHeadline,
              fontSize: 32,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
              color: slide.corHeadline || CORES.amarelo,
              whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "headline", { tamanho: 32, peso: 700 as any, tracking: -0.5 })
        }}
          >
            {slide.headline}
          </div>
        </div>
      )}

      <FooterKeynote corTexto={coresResolvidas.rodape} corAccent={coresResolvidas.accent} mostrar={slide.mostrarRodape !== false} />
    </CardKeynote>
  );
}

// ============================================================
// LAYOUT D — Fundo claro com silhueta (slide 35 do print estilo)
// ============================================================
function LayoutSilhuetaClaro({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <CardKeynote fundo={CORES.branco}>
      <TopbarKeynote corTexto={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />

      <div style={{ position: "absolute", top: 130, left: 48, right: 48, maxWidth: "55%" }}>
        <div
          style={{
            fontFamily: fonteHeadline,
            fontSize: 46,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-1.2px",
            color: slide.corHeadline || CORES.preto,
            whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "headline", { tamanho: 46, peso: 700 as any, tracking: -1.2 })
        }}
        >
          {slide.headline}
        </div>

        {slide.corpo && (
          <div
            style={{
              fontFamily: FONTE_PADRAO,
              fontSize: 18,
              lineHeight: 1.5,
              color: "#555",
              marginTop: 24,
              whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "corpo", { tamanho: 18, peso: 400 as any, tracking: 0 })
        }}
          >
            {slide.corpo}
          </div>
        )}
      </div>

      {/* Foto à direita (silhueta) */}
      <div
        style={{
          position: "absolute",
          right: 48,
          top: 180,
          bottom: 140,
          width: 440,
        }}
      >
        <FotoOuPlaceholder
          url={slide.fotoUrl}
          largura={440}
          altura={960}
          accent={CORES.preto}
          borderRadius={8}
          style={{ width: 440, height: "100%", objectFit: "cover", borderRadius: 8 }}
        zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
      </div>

      {/* Mini seta amarela decorativa */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 48,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            backgroundColor: CORES.amarelo,
            clipPath: "polygon(0 0, 100% 50%, 0 100%)",
          }}
        />
      </div>

      <FooterKeynote corTexto={coresResolvidas.rodape} corAccent={coresResolvidas.accent} mostrar={slide.mostrarRodape !== false} />
    </CardKeynote>
  );
}

// ============================================================
// LAYOUT E — Foto + título amarelo ao lado (título maior, fundo preto)
// ============================================================
function LayoutFotoLateral({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <CardKeynote fundo={CORES.preto}>
      <TopbarKeynote corTexto={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />

      {/* Foto à direita ocupando metade */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "50%",
        }}
      >
        <FotoOuPlaceholder
          url={slide.fotoUrl}
          largura={524}
          altura={1318}
          accent={CORES.amarelo}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
      </div>

      {/* Texto à esquerda */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 48,
          right: "54%",
          bottom: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {slide.kicker && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: slide.corKicker || CORES.amarelo,
              marginBottom: 22,
              fontFamily: FONTE_PADRAO,
          ...aplicarTipoElemento(slide, "kicker", { tamanho: 12, peso: 700 as any, tracking: 2.5 })
        }}
          >
            {slide.kicker}
          </div>
        )}

        <div
          style={{
            fontFamily: fonteHeadline,
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: "-1.5px",
            color: slide.corHeadline || CORES.amarelo,
            whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "headline", { tamanho: 52, peso: 700 as any, tracking: -1.5 })
        }}
        >
          {slide.headline}
        </div>

        {slide.corpo && (
          <div
            style={{
              fontFamily: FONTE_PADRAO,
              fontSize: 18,
              lineHeight: 1.5,
              color: CORES.cinzaTexto,
              marginTop: 24,
              whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "corpo", { tamanho: 18, peso: 400 as any, tracking: 0 })
        }}
          >
            {slide.corpo}
          </div>
        )}
      </div>

      <FooterKeynote corTexto={coresResolvidas.rodape} corAccent={coresResolvidas.accent} mostrar={slide.mostrarRodape !== false} />
    </CardKeynote>
  );
}

// ============================================================
// EXPORT
// ============================================================

export const TEMA_KEYNOTE_MINIMAL: TemaConfig = {
  id: "keynote_minimal",
  nome: "Keynote Minimal",
  descricao: "Cantos arredondados, Inter leve, muita respiração. Visual 'Apple keynote'.",
  cores: CORES,
  fonteHeadlineDefault: "inter",
  fonteCorpo: FONTE_PADRAO,
  corKickerDefault: CORES.amarelo,
  corHeadlineDefault: CORES.amarelo,
  corDestaqueDefault: CORES.amarelo,
  layouts: [
    {
      id: "keynote_foto_retrato",
      nome: "Foto Retrato",
      descricao: "Foto cheia + título amarelo embaixo",
      usaFoto: true,
      render: (p) => <LayoutFotoRetrato {...p} />,
    },
    {
      id: "keynote_tipografia",
      nome: "Tipografia Pura",
      descricao: "Headline amarelo grande + corpo + destaque (fundo preto)",
      usaFoto: false,
      render: (p) => <LayoutTipografiaKeynote {...p} />,
    },
    {
      id: "keynote_dupla_foto",
      nome: "Dupla Foto",
      descricao: "Duas fotos empilhadas + headline curto",
      usaFoto: true,
      usaDuasFotos: true,
      render: (p) => <LayoutDuplaFotoKeynote {...p} />,
    },
    {
      id: "keynote_silhueta_claro",
      nome: "Silhueta Claro",
      descricao: "Fundo branco + foto à direita + texto à esquerda",
      usaFoto: true,
      render: (p) => <LayoutSilhuetaClaro {...p} />,
    },
    {
      id: "keynote_foto_lateral",
      nome: "Foto Lateral",
      descricao: "50/50: texto à esquerda + foto à direita",
      usaFoto: true,
      render: (p) => <LayoutFotoLateral {...p} />,
    },
  ],
  slidesExemplo: [
    {
      ...criarSlideVazio("keynote_foto_retrato", "preto"),
      headline: "Seu título\nentra aqui.",
      corpo: "Dolor Sit Amet Studio",
    },
    {
      ...criarSlideVazio("keynote_tipografia", "preto"),
      kicker: "CONTEXT MACHINE 1.0",
      headline: "Spatial\nComputing\nLorem Ipsum",
      corpo:
        "Step into the virtual framework with LoremOS, a speculative interface system combining UX patterns and dynamic feedback.",
      destaque: "Vivamus pulvinar eu at eros egestas.",
    },
    {
      ...criarSlideVazio("keynote_dupla_foto", "preto"),
      headline: "Doesn't it?",
    },
    {
      ...criarSlideVazio("keynote_silhueta_claro", "branco"),
      headline: "Curabitur at\nfringilla velit.",
      corpo:
        "Proin tristique magno nec augue consequat, in fermentum elit gravida.",
    },
    {
      ...criarSlideVazio("keynote_tipografia", "preto"),
      kicker: "CHAPTER II",
      headline: "LoremOS\nexpands\nbeyond\nboundaries",
      corpo:
        "Opens fictitious opportunities across verticals. Nullam id elit dignissim, porta purus sit amet, euismod eros.",
    },
    {
      ...criarSlideVazio("keynote_foto_lateral", "preto"),
      kicker: "CLOSING",
      headline: "Doesn't it?",
      corpo:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed luctus tempor tellus lorem ut fringilla.",
    },
  ],
};
