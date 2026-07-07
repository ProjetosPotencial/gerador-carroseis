import type { TemaConfig, LayoutRenderProps } from "./tipos";
import { criarSlideVazio, resolverFonteHeadline, aplicarTipoElemento } from "./tipos";
import { FotoOuPlaceholder, Pill } from "./primitivos";

// ============================================================
// TEMA 3 — TWEET STYLE
// Card branco com cantos arredondados grandes sobre fundo escuro.
// Cada slide parece um post do X/Twitter da marca.
// Baseado no print 3.
// ============================================================

const CORES = {
  preto: "#0a0a0a",
  branco: "#ffffff",
  bege: "#F4F1EA",
  amarelo: "#FFC528",
  cinzaTexto: "#1a1a1a",
  cinzaLinha: "#e5e5e5",
  azulVerificado: "#1d9bf0",
  fundoPalco: "#2a2a2a",
};

const FONTE_PADRAO = "'Inter', 'Archivo', system-ui, -apple-system, sans-serif";

// ============================================================
// COMPONENTES AUXILIARES (cabeçalho tweet + rodapé)
// ============================================================

function TweetHeader({
  marca,
  corPrimaria,
  handle,
}: {
  marca: string;
  corPrimaria: string;
  handle?: string;
}) {
  // Extrai handle da marca (primeira palavra em minúsculo) ou usa o passado
  const handleFinal = handle || "@" + marca.split(/[·\s]/)[0].toLowerCase().replace(/[^a-z0-9_]/g, "");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
      {/* Avatar amarelo com "P" */}
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 999,
          backgroundColor: corPrimaria,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          fontWeight: 900,
          color: CORES.preto,
          fontFamily: FONTE_PADRAO,
          flexShrink: 0,
        }}
      >
        P
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: CORES.preto,
              fontFamily: FONTE_PADRAO,
              letterSpacing: "-0.3px",
            }}
          >
            {marca}
          </span>
          {/* Checkmark verificado azul */}
          <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="11" fill={CORES.azulVerificado} />
            <path
              d="M6 11.5L9.5 15L16 8.5"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <span
          style={{
            fontSize: 18,
            color: "#666",
            fontFamily: FONTE_PADRAO,
            letterSpacing: "-0.2px",
          }}
        >
          {handleFinal}
        </span>
      </div>
    </div>
  );
}

function TweetDivisor() {
  return (
    <div
      style={{
        height: 1,
        backgroundColor: CORES.cinzaLinha,
        margin: "30px 0 28px",
      }}
    />
  );
}

function NumeroPagina({
  numero,
  cor,
  mostrar = true,
}: {
  numero: string;
  cor?: string;
  /** v7.6: se false, não renderiza nada. Default true. */
  mostrar?: boolean;
}) {
  if (!mostrar) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 28,
        left: 36,
        fontSize: 14,
        fontWeight: 600,
        color: cor || "rgba(255,255,255,0.5)",
        fontFamily: FONTE_PADRAO,
        letterSpacing: "0.5px",
      }}
    >
      {numero.split(" / ")[0]}
    </div>
  );
}

// ============================================================
// LAYOUT A — Tweet com texto (sem imagem)
// ============================================================
function LayoutTweetTexto({ slide, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const handle = slide.textoPill || undefined; // reusa textoPill pra @handle opcional
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.fundoPalco }}>
      <NumeroPagina numero={numero} cor={slide.corNumero} mostrar={slide.mostrarTopbar !== false} />

      {/* Card branco */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 40,
          right: 40,
          bottom: 80,
          backgroundColor: CORES.branco,
          borderRadius: 28,
          padding: "52px 56px",
          fontFamily: FONTE_PADRAO,
          color: CORES.preto,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TweetHeader marca={marca} corPrimaria={CORES.amarelo} handle={handle} />

        {/* Texto principal (headline) */}
        {slide.headline && (
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.3,
              color: CORES.preto,
              whiteSpace: "pre-line",
              marginBottom: 18,
              fontWeight: 500,
              letterSpacing: "-0.3px",
          ...aplicarTipoElemento(slide, "headline", { tamanho: 34, peso: 500 as any, tracking: -0.3 })
        }}
          >
            {slide.headline}
          </div>
        )}

        {/* Corpo (texto secundário) */}
        {slide.corpo && (
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.4,
              color: CORES.cinzaTexto,
              whiteSpace: "pre-line",
              marginBottom: 24,
          ...aplicarTipoElemento(slide, "corpo", { tamanho: 26, peso: 400 as any, tracking: 0 })
        }}
          >
            {slide.corpo}
          </div>
        )}

        {/* Divisor + destaque embaixo */}
        {slide.destaque && (
          <>
            <TweetDivisor />
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.35,
                color: CORES.preto,
                fontWeight: 700,
                whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "destaque", { tamanho: 28, peso: 700 as any, tracking: 0 })
        }}
            >
              {slide.destaque}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LAYOUT B — Tweet com imagem
// ============================================================
function LayoutTweetImagem({ slide, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const handle = slide.textoPill || undefined;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.fundoPalco }}>
      <NumeroPagina numero={numero} cor={slide.corNumero} mostrar={slide.mostrarTopbar !== false} />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 40,
          right: 40,
          bottom: 80,
          backgroundColor: CORES.branco,
          borderRadius: 28,
          padding: "52px 56px",
          fontFamily: FONTE_PADRAO,
          color: CORES.preto,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <TweetHeader marca={marca} corPrimaria={CORES.amarelo} handle={handle} />

        {slide.headline && (
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.3,
              color: CORES.preto,
              whiteSpace: "pre-line",
              marginBottom: 20,
              fontWeight: 500,
              letterSpacing: "-0.3px",
          ...aplicarTipoElemento(slide, "headline", { tamanho: 30, peso: 500 as any, tracking: -0.3 })
        }}
          >
            {slide.headline}
          </div>
        )}

        {/* Imagem com bordas arredondadas */}
        <div style={{ marginBottom: 22, flex: 1, minHeight: 0, maxHeight: 480 }}>
          <FotoOuPlaceholder
            url={slide.fotoUrl}
            largura={904}
            altura={440}
            accent={CORES.amarelo}
            borderRadius={16}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
          zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
        </div>

        {slide.destaque && (
          <>
            <TweetDivisor />
            <div
              style={{
                fontSize: 26,
                lineHeight: 1.35,
                color: CORES.preto,
                fontWeight: 700,
                whiteSpace: "pre-line",
                textDecoration: "underline",
                textDecorationColor: CORES.amarelo,
                textDecorationThickness: 3,
                textUnderlineOffset: 4,
          ...aplicarTipoElemento(slide, "destaque", { tamanho: 26, peso: 700 as any, tracking: 0 })
        }}
            >
              {slide.destaque}
            </div>
          </>
        )}

        {slide.corpo && (
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.4,
              color: CORES.cinzaTexto,
              whiteSpace: "pre-line",
              marginTop: slide.destaque ? 14 : 0,
          ...aplicarTipoElemento(slide, "corpo", { tamanho: 22, peso: 400 as any, tracking: 0 })
        }}
          >
            {slide.corpo}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LAYOUT C — Tweet com BIG número (dado estatístico)
// ============================================================
function LayoutTweetNumero({ slide, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const handle = slide.textoPill || undefined;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.fundoPalco }}>
      <NumeroPagina numero={numero} cor={slide.corNumero} mostrar={slide.mostrarTopbar !== false} />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 40,
          right: 40,
          bottom: 80,
          backgroundColor: CORES.branco,
          borderRadius: 28,
          padding: "52px 56px",
          fontFamily: FONTE_PADRAO,
          color: CORES.preto,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TweetHeader marca={marca} corPrimaria={CORES.amarelo} handle={handle} />

        {slide.kicker && (
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "#666",
              marginBottom: 14,
          ...aplicarTipoElemento(slide, "kicker", { tamanho: 16, peso: 700 as any, tracking: 2.5 })
        }}
          >
            {slide.kicker}
          </div>
        )}

        {/* Big Number em destaque */}
        {slide.numero && (
          <div
            style={{
              fontSize: 180,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: "-5px",
              color: CORES.amarelo,
              WebkitTextStroke: `3px ${CORES.preto}`,
              marginBottom: 20,
              marginTop: 10,
            }}
          >
            {slide.numero}
          </div>
        )}

        {slide.headline && (
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.25,
              color: CORES.preto,
              whiteSpace: "pre-line",
              fontWeight: 600,
              marginBottom: 16,
              letterSpacing: "-0.3px",
          ...aplicarTipoElemento(slide, "headline", { tamanho: 30, peso: 600 as any, tracking: -0.3 })
        }}
          >
            {slide.headline}
          </div>
        )}

        {slide.corpo && (
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.4,
              color: CORES.cinzaTexto,
              whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "corpo", { tamanho: 22, peso: 400 as any, tracking: 0 })
        }}
          >
            {slide.corpo}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LAYOUT D — Final escuro (post de assinatura / "feito com IA")
// ============================================================
function LayoutTweetFinal({ slide, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const handle = slide.textoPill || undefined;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.fundoPalco }}>
      <NumeroPagina numero={numero} cor={slide.corNumero} mostrar={slide.mostrarTopbar !== false} />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 40,
          right: 40,
          bottom: 80,
          backgroundColor: CORES.preto,
          borderRadius: 28,
          padding: "52px 56px",
          fontFamily: FONTE_PADRAO,
          color: CORES.branco,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header tweet com avatar amarelo, nome branco */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 60 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 999,
              backgroundColor: CORES.amarelo,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 900,
              color: CORES.preto,
              flexShrink: 0,
            }}
          >
            P
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: CORES.branco,
                  letterSpacing: "-0.3px",
                }}
              >
                {marca}
              </span>
              <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="11" fill={CORES.azulVerificado} />
                <path
                  d="M6 11.5L9.5 15L16 8.5"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <span style={{ fontSize: 18, color: "#999", letterSpacing: "-0.2px" }}>
              {handle || "@" + marca.split(/[·\s]/)[0].toLowerCase().replace(/[^a-z0-9_]/g, "")}
            </span>
          </div>
        </div>

        {/* Headline grande em amarelo ou branco */}
        {slide.headline && (
          <div
            style={{
              fontSize: 60,
              lineHeight: 1.08,
              color: slide.corHeadline || CORES.amarelo,
              whiteSpace: "pre-line",
              fontWeight: 800,
              marginBottom: 30,
              letterSpacing: "-1.5px",
          ...aplicarTipoElemento(slide, "headline", { tamanho: 60, peso: 800 as any, tracking: -1.5 })
        }}
          >
            {slide.headline}
          </div>
        )}

        {slide.corpo && (
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.45,
              color: "#ccc",
              whiteSpace: "pre-line",
          ...aplicarTipoElemento(slide, "corpo", { tamanho: 22, peso: 400 as any, tracking: 0 })
        }}
          >
            {slide.corpo}
          </div>
        )}

        {/* Destaque em amarelo no rodapé */}
        {slide.destaque && (
          <div
            style={{
              marginTop: "auto",
              paddingTop: 30,
              fontSize: 20,
              fontWeight: 700,
              color: CORES.amarelo,
              whiteSpace: "pre-line",
              borderTop: `1px solid #333`,
          ...aplicarTipoElemento(slide, "destaque", { tamanho: 20, peso: 700 as any, tracking: 0 })
        }}
          >
            {slide.destaque}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LAYOUT E (NOVO v7.2) — Tweet · Editorial Longo
// Headline (pergunta/afirmação curta) + corpo (1-2 parágrafos) +
// foto média + destaque sublinhado
// Inspirado no slide 1, 4, 7 do mosaico de referência
// ============================================================
function LayoutTweetEditorialLongo({ slide, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const handle = slide.textoPill || undefined;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.fundoPalco }}>
      <NumeroPagina numero={numero} cor={slide.corNumero} mostrar={slide.mostrarTopbar !== false} />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 40,
          right: 40,
          bottom: 80,
          backgroundColor: CORES.branco,
          borderRadius: 28,
          padding: "52px 56px",
          fontFamily: FONTE_PADRAO,
          color: CORES.preto,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <TweetHeader marca={marca} corPrimaria={CORES.amarelo} handle={handle} />

        {/* Headline (pergunta ou afirmação curta) */}
        {slide.headline && (
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.3,
              color: CORES.preto,
              whiteSpace: "pre-line",
              marginBottom: 16,
              fontWeight: 500,
              letterSpacing: "-0.3px",
              ...aplicarTipoElemento(slide, "headline", { tamanho: 32, peso: 500 as any, tracking: -0.3 }),
            }}
          >
            {slide.headline}
          </div>
        )}

        {/* Corpo (1-2 parágrafos, parte densa do tweet) */}
        {slide.corpo && (
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.45,
              color: CORES.cinzaTexto,
              whiteSpace: "pre-line",
              marginBottom: 22,
              ...aplicarTipoElemento(slide, "corpo", { tamanho: 24, peso: 400 as any, tracking: 0 }),
            }}
          >
            {slide.corpo}
          </div>
        )}

        {/* Foto média no meio */}
        <div style={{ marginBottom: 22, flex: 1, minHeight: 0, maxHeight: 360 }}>
          <FotoOuPlaceholder
            url={slide.fotoUrl}
            largura={904}
            altura={340}
            accent={CORES.amarelo}
            borderRadius={16}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
          zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
        </div>

        {/* Destaque sublinhado (frase de remate) */}
        {slide.destaque && (
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.35,
              color: CORES.preto,
              fontWeight: 700,
              whiteSpace: "pre-line",
              textDecoration: "underline",
              textDecorationColor: CORES.amarelo,
              textDecorationThickness: 3,
              textUnderlineOffset: 4,
              ...aplicarTipoElemento(slide, "destaque", { tamanho: 26, peso: 700 as any, tracking: 0 }),
            }}
          >
            {slide.destaque}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LAYOUT F (NOVO v7.2) — Tweet · Foto Sandwich
// Corpo curto + foto + corpo longo (parágrafos depois da foto)
// Inspirado no slide 3 do mosaico de referência
// ============================================================
function LayoutTweetFotoSandwich({ slide, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const handle = slide.textoPill || undefined;
  // Divide o corpo em "antes" e "depois" da foto.
  // Convenção: se houver "---" no corpo, parte de cima vai antes, parte de baixo vai depois.
  // Caso contrário, divide em metades por parágrafo.
  const { corpoAntes, corpoDepois } = (() => {
    const c = slide.corpo || "";
    if (!c.trim()) return { corpoAntes: "", corpoDepois: "" };
    if (c.includes("---")) {
      const partes = c.split("---");
      return {
        corpoAntes: partes[0].trim(),
        corpoDepois: partes.slice(1).join("---").trim(),
      };
    }
    // Divide por parágrafos: primeiro parágrafo antes, resto depois
    const paragrafos = c.split(/\n\s*\n/).filter((p) => p.trim());
    if (paragrafos.length <= 1) {
      return { corpoAntes: c, corpoDepois: "" };
    }
    return {
      corpoAntes: paragrafos[0],
      corpoDepois: paragrafos.slice(1).join("\n\n"),
    };
  })();

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.fundoPalco }}>
      <NumeroPagina numero={numero} cor={slide.corNumero} mostrar={slide.mostrarTopbar !== false} />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 40,
          right: 40,
          bottom: 80,
          backgroundColor: CORES.branco,
          borderRadius: 28,
          padding: "52px 56px",
          fontFamily: FONTE_PADRAO,
          color: CORES.preto,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <TweetHeader marca={marca} corPrimaria={CORES.amarelo} handle={handle} />

        {/* Headline curto opcional (pergunta/afirmação) */}
        {slide.headline && (
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.3,
              color: CORES.preto,
              whiteSpace: "pre-line",
              marginBottom: 16,
              fontWeight: 500,
              letterSpacing: "-0.3px",
              ...aplicarTipoElemento(slide, "headline", { tamanho: 28, peso: 500 as any, tracking: -0.3 }),
            }}
          >
            {slide.headline}
          </div>
        )}

        {/* Corpo ANTES da foto (1 parágrafo curto) */}
        {corpoAntes && (
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.45,
              color: CORES.cinzaTexto,
              whiteSpace: "pre-line",
              marginBottom: 18,
              ...aplicarTipoElemento(slide, "corpo", { tamanho: 24, peso: 400 as any, tracking: 0 }),
            }}
          >
            {corpoAntes}
          </div>
        )}

        {/* Foto */}
        <div style={{ marginBottom: 18, maxHeight: 290, height: 290 }}>
          <FotoOuPlaceholder
            url={slide.fotoUrl}
            largura={904}
            altura={290}
            accent={CORES.amarelo}
            borderRadius={16}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
          zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
        </div>

        {/* Destaque sublinhado opcional */}
        {slide.destaque && (
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.35,
              color: CORES.preto,
              fontWeight: 700,
              whiteSpace: "pre-line",
              textDecoration: "underline",
              textDecorationColor: CORES.amarelo,
              textDecorationThickness: 3,
              textUnderlineOffset: 4,
              marginBottom: 14,
              ...aplicarTipoElemento(slide, "destaque", { tamanho: 22, peso: 700 as any, tracking: 0 }),
            }}
          >
            {slide.destaque}
          </div>
        )}

        {/* Corpo DEPOIS da foto (parágrafos longos) */}
        {corpoDepois && (
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.45,
              color: CORES.cinzaTexto,
              whiteSpace: "pre-line",
              flex: 1,
              ...aplicarTipoElemento(slide, "corpo", { tamanho: 22, peso: 400 as any, tracking: 0 }),
            }}
          >
            {corpoDepois}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EXPORT
// ============================================================

export const TEMA_TWEET_STYLE: TemaConfig = {
  id: "tweet_style",
  nome: "Tweet Style",
  descricao: "Cada slide parece um post do X/Twitter da marca. Card branco, avatar amarelo.",
  cores: CORES,
  fonteHeadlineDefault: "inter",
  fonteCorpo: FONTE_PADRAO,
  corKickerDefault: "#666",
  corHeadlineDefault: CORES.preto,
  corDestaqueDefault: CORES.preto,
  layouts: [
    {
      id: "tweet_texto",
      nome: "Tweet · Só Texto",
      descricao: "Post texto puro com destaque sublinhado embaixo",
      usaFoto: false,
      render: (p) => <LayoutTweetTexto {...p} />,
    },
    {
      id: "tweet_imagem",
      nome: "Tweet · Com Imagem",
      descricao: "Texto + imagem/meme no meio + destaque sublinhado",
      usaFoto: true,
      render: (p) => <LayoutTweetImagem {...p} />,
    },
    {
      id: "tweet_editorial",
      nome: "Tweet · Editorial Longo",
      descricao: "Headline curto + 1-2 parágrafos + foto + remate sublinhado",
      usaFoto: true,
      render: (p) => <LayoutTweetEditorialLongo {...p} />,
    },
    {
      id: "tweet_sandwich",
      nome: "Tweet · Foto Sandwich",
      descricao: "Texto curto + foto + parágrafos longos depois (use --- pra dividir)",
      usaFoto: true,
      render: (p) => <LayoutTweetFotoSandwich {...p} />,
    },
    {
      id: "tweet_numero",
      nome: "Tweet · Big Number",
      descricao: "Dado estatístico em destaque com contexto",
      usaFoto: false,
      render: (p) => <LayoutTweetNumero {...p} />,
    },
    {
      id: "tweet_final",
      nome: "Tweet · Final Escuro",
      descricao: "Slide de fechamento ou assinatura (fundo preto)",
      usaFoto: false,
      render: (p) => <LayoutTweetFinal {...p} />,
    },
  ],
  slidesExemplo: [
    {
      ...criarSlideVazio("tweet_texto", "preto"),
      headline: "A Drex é tecnologia financeira ou mudança institucional?",
      corpo:
        "Ao centralizar a emissão e programar liquidações automáticas, altera custos com cartórios e burocracia documental.",
      destaque: "Não é só moeda digital.",
    },
    {
      ...criarSlideVazio("tweet_imagem", "preto"),
      headline:
        "Diferente de um sistema de transferência, a Drex é a própria moeda dentro de uma rede de registro distribuída sob controle do Banco Central.",
      corpo:
        "Quando o dinheiro passa a existir como código, ele pode carregar condições de uso embutidas.",
      destaque: "O centro da mudança está nos contratos",
    },
    {
      ...criarSlideVazio("tweet_numero", "preto"),
      kicker: "DADO QUE VIROU A CHAVE",
      numero: "85%",
      headline: "Pagamento e registro no mesmo fluxo.",
      corpo:
        "Em uma venda de imóvel, o valor pode permanecer travado até que o cartório digital confirme a transferência da escritura.",
    },
    {
      ...criarSlideVazio("tweet_texto", "preto"),
      headline: "O que antes exigia confiança sequencial entre instituições passa a depender de regras automáticas executadas na infraestrutura digital.",
      destaque: "O dinheiro ganha instruções próprias.",
      corpo:
        "A consequência prática aparece na estrutura de custos. Menos etapas intermediárias significam menor dependência de validações paralelas e menor fricção burocrática.",
    },
    {
      ...criarSlideVazio("tweet_imagem", "preto"),
      headline:
        "Trata-se de uma mudança institucional porque redefine responsabilidades, reduz sobreposições e reorganiza como o sistema financeiro administra risco e comprovação.",
      destaque: "A moeda deixa de ser apenas meio de troca e passa a ser infraestrutura de execução.",
    },
    {
      ...criarSlideVazio("tweet_final", "preto"),
      headline: "Post produzido com ajuda de Inteligência Artificial.",
      corpo:
        'Baseado no vídeo:\n"How Hormozi\'s $100M Book Launch Changed Selling Forever"\nBlueprint to Billions',
      destaque:
        'Produzido com ajuda de Inteligência Artificial inspirado no dossiê técnico: "HUB de Conteúdo Mercado Financeiro — Grupo Potencial".',
    },
  ],
};
