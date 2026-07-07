import type { TemaConfig, LayoutRenderProps, SlideData } from "./tipos";
import { criarSlideVazio, resolverFonteHeadline, aplicarTipoElemento } from "./tipos";
import {
  Topbar,
  Kicker,
  Headline,
  Corpo,
  Destaque,
  Pill,
  FotoOuPlaceholder,
  BigNumber,
} from "./primitivos";

// ============================================================
// TEMA 1 — BRANDS DECODED CLASSIC
// Fundo preto dominante, amarelo como accent.
// Tipografia pesada (Archivo Black), sem cantos arredondados.
// ============================================================

const CORES = {
  preto: "#0a0a0a",
  branco: "#ffffff",
  bege: "#F4F1EA",
  amarelo: "#FFC528",
};

// ============================================================
// LAYOUTS
// ============================================================

function LayoutFotoCheia({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.preto }}>
      <FotoOuPlaceholder
        url={slide.fotoUrl}
        largura={1080}
        altura={1350}
        accent={CORES.amarelo}
        style={{ position: "absolute", inset: 0 }}
      zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.96) 100%)",
          pointerEvents: "none",
        }}
      />
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />
      <div style={{ position: "absolute", bottom: 90, left: 56, right: 56, color: CORES.branco }}>
        <Kicker texto={slide.kicker} cor={coresResolvidas.kicker} accent={CORES.amarelo} slide={slide}/>
        <Headline texto={slide.headline} cor={coresResolvidas.headline} tamanho={98} fontFamily={fonteHeadline}
          slide={slide}
        />
        {slide.destaque && (
          <div style={{ marginTop: 22 }}>
            <Destaque texto={slide.destaque} cor={coresResolvidas.destaque} fontFamily={fonteHeadline} slide={slide}/>
          </div>
        )}
        {slide.mostrarPill && slide.textoPill && (
          <div style={{ marginTop: 26 }}>
            <Pill texto={slide.textoPill} corFundo={CORES.amarelo} corTexto={CORES.preto} slide={slide} />
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutFotoCheiaFinal({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.preto }}>
      <FotoOuPlaceholder
        url={slide.fotoUrl}
        largura={1080}
        altura={1350}
        accent={CORES.amarelo}
        style={{ position: "absolute", inset: 0 }}
        zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.60) 45%, rgba(0,0,0,0.97) 100%)",
          pointerEvents: "none",
        }}
      />
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />
      <div style={{ position: "absolute", bottom: 96, left: 56, right: 56, color: CORES.branco }}>
        <Kicker texto={slide.kicker} cor={coresResolvidas.kicker} accent={CORES.amarelo} slide={slide} />
        <Headline texto={slide.headline} cor={coresResolvidas.headline} tamanho={72} fontFamily={fonteHeadline} slide={slide} />
        {slide.corpo && (
          <div style={{ marginTop: 20 }}>
            <Corpo texto={slide.corpo} cor={CORES.branco} fontFamily={tema.fonteCorpo} slide={slide} />
          </div>
        )}
        {slide.destaque && (
          <div style={{ marginTop: 18 }}>
            <Destaque texto={slide.destaque} cor={coresResolvidas.destaque} fontFamily={fonteHeadline} slide={slide} />
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutSplitHorizontal({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  // v7.8: respeita corFundo (preto/amarelo) para permitir inversão de cores.
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: coresResolvidas.fundo }}>
      <FotoOuPlaceholder
        url={slide.fotoUrl}
        largura={1080}
        altura={620}
        accent={CORES.amarelo}
        style={{ position: "absolute", top: 0, left: 0 }}
        zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />
      <div
        style={{
          position: "absolute",
          top: 748,
          left: 56,
          right: 56,
          bottom: 70,
          color: coresResolvidas.texto,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Kicker texto={slide.kicker} cor={coresResolvidas.kicker} accent={coresResolvidas.accent} slide={slide}/>
        <Headline texto={slide.headline} cor={coresResolvidas.headline === CORES.amarelo ? CORES.branco : coresResolvidas.headline} tamanho={64} fontFamily={fonteHeadline}
          slide={slide}
        />
        {slide.corpo && (
          <div style={{ marginTop: 24 }}>
            <Corpo texto={slide.corpo} cor={coresResolvidas.corpo} fontFamily={tema.fonteCorpo} slide={slide}/>
          </div>
        )}
        {slide.destaque && (
          <div style={{ marginTop: 20 }}>
            <Destaque texto={slide.destaque} cor={coresResolvidas.destaque} fontFamily={fonteHeadline} slide={slide}/>
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutSplitInvertido({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  // v7.8: fundo padrão amarelo, mas respeita corFundo (permite inversão p/ preto).
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: coresResolvidas.fundo }}>
      <FotoOuPlaceholder
        url={slide.fotoUrl}
        largura={1080}
        altura={560}
        accent={CORES.amarelo}
        style={{ position: "absolute", bottom: 0, left: 0 }}
        zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />
      <div style={{ position: "absolute", top: 120, left: 56, right: 56, color: coresResolvidas.texto }}>
        <Kicker texto={slide.kicker} cor={slide.corKicker || coresResolvidas.kicker} accent={coresResolvidas.accent} slide={slide}/>
        <div style={{ textWrap: "balance" as any }}>
          <Headline texto={slide.headline} cor={slide.corHeadline || coresResolvidas.headline} tamanho={94} fontFamily={fonteHeadline}
            slide={slide}
          />
        </div>
        {slide.corpo && (
          <div style={{ marginTop: 22, maxWidth: 900 }}>
            <Corpo texto={slide.corpo} cor={coresResolvidas.corpo} tamanho={32} fontFamily={tema.fonteCorpo} slide={slide}/>
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutTipografiaPura({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  const fundoEAmarelo = slide.corFundo === "amarelo";
  const fundo = fundoEAmarelo ? CORES.amarelo : CORES.preto;
  const cor = fundoEAmarelo ? CORES.preto : CORES.branco;
  const headlineCor = slide.corHeadline || (fundoEAmarelo ? CORES.preto : CORES.amarelo);
  const accentDivider = fundoEAmarelo ? CORES.preto : CORES.amarelo;
  const temBigNumber = Boolean(slide.numero?.trim());

  // Bloco de texto (destaque 40px + corpo 32px), com quebra equilibrada no destaque.
  const blocoTexto = (
    <>
      {slide.destaque && (
        <div style={{ marginBottom: 22, textWrap: "balance" as any }}>
          <Destaque texto={slide.destaque} cor={slide.corDestaque || accentDivider} tamanho={40} fontFamily={fonteHeadline} slide={slide}/>
        </div>
      )}
      <Corpo texto={slide.corpo} cor={cor} tamanho={28} fontFamily={tema.fonteCorpo} slide={slide}/>
    </>
  );

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: fundo }}>
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />

      {temBigNumber ? (
        <>
          <div style={{ position: "absolute", top: 130, left: 56, right: 56, color: cor }}>
            <Kicker texto={slide.kicker} cor={slide.corKicker || cor} accent={accentDivider} slide={slide}/>
          </div>
          <div style={{ position: "absolute", top: 340, left: 56, right: 56 }}>
            <BigNumber texto={slide.numero} cor={headlineCor} fontFamily={fonteHeadline} slide={slide}/>
          </div>
          <div style={{ position: "absolute", bottom: 110, left: 56, right: 56, color: cor }}>
            {blocoTexto}
          </div>
        </>
      ) : (
        <div style={{ position: "absolute", top: 130, left: 56, right: 56, color: cor }}>
          <Kicker texto={slide.kicker} cor={slide.corKicker || cor} accent={accentDivider} slide={slide}/>
          <Headline texto={slide.headline} cor={headlineCor} tamanho={94} fontFamily={fonteHeadline} slide={slide}/>
          <div style={{ marginTop: 120 }}>{blocoTexto}</div>
        </div>
      )}
    </div>
  );
}

function LayoutDuplaFoto({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.preto }}>
      <div style={{ position: "absolute", top: 100, left: 56 }}>
        <FotoOuPlaceholder url={slide.fotoUrl} largura={968} altura={440} accent={CORES.amarelo} borderRadius={4} zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />
      </div>
      <div style={{ position: "absolute", top: 560, left: 56 }}>
        <FotoOuPlaceholder url={slide.fotoUrl2} largura={968} altura={360} accent={CORES.amarelo} borderRadius={4} />
      </div>
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />
      <div style={{ position: "absolute", bottom: 70, left: 56, right: 56, color: CORES.branco }}>
        {slide.kicker && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: slide.corKicker || CORES.amarelo,
              marginBottom: 10,
          ...aplicarTipoElemento(slide, "kicker", { tamanho: 13, peso: 800 as any, tracking: 3 })
        }}
          >
            {slide.kicker}
          </div>
        )}
        {slide.headline && (
          <Headline
            texto={slide.headline}
            cor={slide.corHeadline || CORES.amarelo}
            tamanho={44}
            uppercase={false}
            fontFamily={fonteHeadline}
          slide={slide}
        />
        )}
        {slide.legendaFoto && (
          <div
            style={{
              marginTop: 14,
              fontSize: 18,
              fontFamily: tema.fonteCorpo,
              color: CORES.branco,
              opacity: 0.7,
              fontStyle: "italic",
            }}
          >
            {slide.legendaFoto}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EXPORT
// ============================================================

export const TEMA_BRANDS_DECODED_CLASSIC: TemaConfig = {
  id: "brands_decoded_classic",
  nome: "Brands Decoded Classic",
  descricao: "Preto dominante, amarelo como accent, tipografia pesada",
  cores: CORES,
  fonteHeadlineDefault: "archivo",
  fonteCorpo: "'Archivo', 'Inter', sans-serif",
  corKickerDefault: CORES.amarelo,
  corHeadlineDefault: CORES.amarelo,
  corDestaqueDefault: CORES.amarelo,
  layouts: [
    {
      id: "foto_cheia",
      nome: "Foto Cheia",
      descricao: "Capa com foto de fundo e título sobre overlay",
      usaFoto: true,
      render: (p) => <LayoutFotoCheia {...p} />,
    },
    {
      id: "foto_cheia_final",
      nome: "Foto Cheia (Final)",
      descricao: "Foto de fundo + topbar, kicker, headline, corpo e destaque (slide final, sem rodapé)",
      usaFoto: true,
      render: (p) => <LayoutFotoCheiaFinal {...p} />,
    },
    {
      id: "split_horizontal",
      nome: "Split Horizontal",
      descricao: "Foto no topo (46%) + texto embaixo",
      usaFoto: true,
      render: (p) => <LayoutSplitHorizontal {...p} />,
    },
    {
      id: "split_invertido",
      nome: "Split Invertido",
      descricao: "Texto em cima (fundo amarelo) + foto embaixo",
      usaFoto: true,
      render: (p) => <LayoutSplitInvertido {...p} />,
    },
    {
      id: "tipografia_pura",
      nome: "Tipografia Pura",
      descricao: "Só texto, headline gigante ou big number",
      usaFoto: false,
      coresFundoPermitidas: ["preto", "amarelo"],
      render: (p) => <LayoutTipografiaPura {...p} />,
    },
    {
      id: "dupla_foto",
      nome: "Dupla Foto",
      descricao: "Duas fotos empilhadas + legenda",
      usaFoto: true,
      usaDuasFotos: true,
      render: (p) => <LayoutDuplaFoto {...p} />,
    },
  ],
  // Estrutura padrão do carrossel (v7.8) — 7 slides, sempre nesta ordem:
  // 1 Foto cheia (capa) · 2 Split horizontal (preto) · 3 Foto cheia
  // 4 Tipografia pura (amarelo) · 5 Split invertido (amarelo)
  // 6 Foto cheia · 7 Foto cheia final
  slidesExemplo: [
    {
      ...criarSlideVazio("foto_cheia", "preto"),
      kicker: "TESE EDITORIAL Nº 1",
      headline: "Seu título\nde capa\nentra aqui.",
      destaque: "E o complemento provocativo aparece embaixo.",
      corDestaque: "#ffffff",
    },
    {
      ...criarSlideVazio("split_horizontal", "preto"),
      kicker: "O CONTEXTO",
      headline: "Como chegamos até aqui.",
      corpo: "Desenvolva o contexto histórico do tema em 2-3 frases corridas.",
      destaque: "E então aconteceu a virada.",
    },
    {
      ...criarSlideVazio("foto_cheia", "preto"),
      kicker: "O DADO QUE VIROU A CHAVE",
      headline: "O número que\nmuda tudo.",
      destaque: "+32% — e ninguém estava acompanhando.",
    },
    {
      ...criarSlideVazio("tipografia_pura", "amarelo"),
      kicker: "O DESLOCAMENTO",
      headline: "Por décadas,\nalgo foi\nassunto de\npoucos.",
      corpo: "Aqui você aprofunda o argumento central em 2-3 frases.",
      destaque: "Não é o futuro. É o presente.",
    },
    {
      ...criarSlideVazio("split_invertido", "amarelo"),
      kicker: "O PERFIL",
      headline: "Quem é o novo protagonista?",
      corpo: "Descreva o perfil numa linha corrida — comportamento, consumo, contexto.",
    },
    {
      ...criarSlideVazio("foto_cheia", "preto"),
      kicker: "O APROFUNDAMENTO",
      headline: "Traga a imagem\nque sustenta\no argumento.",
      destaque: "Mostre o filme, não a foto.",
      corDestaque: "#ffffff",
    },
    {
      ...criarSlideVazio("foto_cheia_final", "preto"),
      kicker: "SIGA, SALVE, COMPARTILHE",
      headline: "Continue\npor dentro.",
      corpo: "Um fechamento curto que reforça o valor de acompanhar a página.",
      destaque: "Novos estudos toda semana.",
      textoPill: "@SUA_MARCA · SIGA",
    },
  ],
};
