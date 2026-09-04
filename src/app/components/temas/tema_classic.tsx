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

// v7.20.13: auto-fit de títulos — reduz o tamanho de headlines longos pra não
// estourarem em 4+ linhas gigantes (mantém legibilidade com mínimo por layout).
function fitTam(texto: string | undefined, base: number, thresh: number, min: number) {
  const len = String(texto || "").replace(/\n/g, " ").trim().length;
  if (len <= thresh) return base;
  return Math.max(min, Math.round(base * Math.sqrt(thresh / len)));
}

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
        onZoomChange={onSlideChange ? (zz) => onSlideChange({ fotoZoom: zz }) : undefined}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.40) 66%, rgba(0,0,0,0.90) 100%)",
          pointerEvents: "none",
        }}
      />
      <Topbar cor={slide.corTopbar || CORES.branco} marca={slide.textoTopbar || marca} numero={numero} tamanho={slide.tamTopbar} corNumero={slide.corNumero || slide.corTopbar || CORES.branco} mostrar={slide.mostrarTopbar !== false} />
      <div style={{ position: "absolute", bottom: 90, left: 56, right: 56, color: CORES.branco }}>
        <Kicker texto={slide.kicker} cor={coresResolvidas.kicker} accent={CORES.amarelo} slide={slide}/>
        <Headline texto={slide.headline} cor={coresResolvidas.headline} tamanho={fitTam(slide.headline, 88, 26, 56)} fontFamily={fonteHeadline}
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
        onZoomChange={onSlideChange ? (zz) => onSlideChange({ fotoZoom: zz }) : undefined}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 44%, rgba(0,0,0,0.42) 64%, rgba(0,0,0,0.92) 100%)", pointerEvents: "none" }} />
      <Topbar cor={slide.corTopbar || CORES.branco} marca={slide.textoTopbar || marca} numero={numero} tamanho={slide.tamTopbar} corNumero={slide.corNumero || slide.corTopbar || CORES.branco} mostrar={slide.mostrarTopbar !== false} />
      <div style={{ position: "absolute", bottom: 96, left: 56, right: 56, color: CORES.branco }}>
        <Kicker texto={slide.kicker} cor={coresResolvidas.kicker} accent={CORES.amarelo} slide={slide} />
        <Headline texto={slide.headline} cor={coresResolvidas.headline} tamanho={fitTam(slide.headline, 72, 28, 48)} fontFamily={fonteHeadline} slide={slide} />
        {slide.corpo && (
          <div style={{ marginTop: 20 }}>
            <Corpo texto={slide.corpo} cor={CORES.branco} fontFamily={tema.fonteCorpo} slide={slide} />
          </div>
        )}
        {slide.destaque && (
          <div style={{ marginTop: 18 }}>
            {/* v7.20.5: destaque do último slide sempre branco (como a capa) */}
            <Destaque texto={slide.destaque} cor={slide.corDestaque || CORES.branco} fontFamily={fonteHeadline} slide={slide} />
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutSplitHorizontal({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: coresResolvidas.fundo }}>
      {/* v7.23: FOTO DE FUNDO INTEIRA (1080x1350) — ajustável com zoom + arraste */}
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
        onZoomChange={onSlideChange ? (zz) => onSlideChange({ fotoZoom: zz }) : undefined}
      />
      <Topbar cor={slide.corTopbar || CORES.branco} marca={slide.textoTopbar || marca} numero={numero} tamanho={slide.tamTopbar} corNumero={slide.corNumero || slide.corTopbar || CORES.branco} mostrar={slide.mostrarTopbar !== false} />
      <div style={{ position: "absolute", top: 748, left: 56, right: 56, bottom: 70, color: coresResolvidas.texto, display: "flex", flexDirection: "column" }}>
        <Kicker texto={slide.kicker} cor={coresResolvidas.kicker} accent={coresResolvidas.accent} slide={slide}/>
        <Headline texto={slide.headline} cor={coresResolvidas.headline === CORES.amarelo ? CORES.branco : coresResolvidas.headline} tamanho={fitTam(slide.headline, 64, 34, 44)} fontFamily={fonteHeadline} slide={slide} />
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
        onZoomChange={onSlideChange ? (zz) => onSlideChange({ fotoZoom: zz }) : undefined}
      />
      <Topbar cor={slide.corTopbar || coresResolvidas.topbar} marca={slide.textoTopbar || marca} numero={numero} tamanho={slide.tamTopbar} corNumero={slide.corNumero || slide.corTopbar || coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />
      <div style={{ position: "absolute", top: 120, left: 56, right: 56, color: coresResolvidas.texto }}>
        <Kicker texto={slide.kicker} cor={slide.corKicker || coresResolvidas.kicker} accent={coresResolvidas.accent} slide={slide}/>
        <div style={{ textWrap: "balance" as any }}>
          <Headline texto={slide.headline} cor={slide.corHeadline || coresResolvidas.headline} tamanho={fitTam(slide.headline, 94, 22, 60)} fontFamily={fonteHeadline} slide={slide} />
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
      <Topbar cor={slide.corTopbar || coresResolvidas.topbar} marca={slide.textoTopbar || marca} numero={numero} tamanho={slide.tamTopbar} corNumero={slide.corNumero || slide.corTopbar || coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />

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
        onZoomChange={onSlideChange ? (zz) => onSlideChange({ fotoZoom: zz }) : undefined}
      />
      </div>
      <div style={{ position: "absolute", top: 560, left: 56 }}>
        <FotoOuPlaceholder url={slide.fotoUrl2} largura={968} altura={360} accent={CORES.amarelo} borderRadius={4} />
      </div>
      <Topbar cor={slide.corTopbar || coresResolvidas.topbar} marca={slide.textoTopbar || marca} numero={numero} tamanho={slide.tamTopbar} corNumero={slide.corNumero || slide.corTopbar || coresResolvidas.numero} mostrar={slide.mostrarTopbar !== false} />
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
      descricao: "Foto de fundo + topbar, kicker, headline, corpo e destaque (slide final)",
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
  // Estrutura padrão do carrossel (v7.9) — 7 slides, sempre nesta ordem:
  // 1 Foto cheia (capa, preto) · 2 Split horizontal (preto) · 3 Split horizontal (amarelo)
  // 4 Tipografia pura (amarelo) · 5 Split horizontal (preto)
  // 6 Foto cheia (preto) · 7 Foto cheia final (preto)
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
      ...criarSlideVazio("split_horizontal", "amarelo"),
      kicker: "O DADO QUE VIROU A CHAVE",
      headline: "O número que muda tudo.",
      corpo: "Contextualize o dado em 2-3 frases — o que ele revela e por que importa.",
      destaque: "+32% e ninguém estava acompanhando.",
    },
    {
      ...criarSlideVazio("tipografia_pura", "amarelo"),
      kicker: "O DESLOCAMENTO",
      headline: "Por décadas,\nalgo foi\nassunto de\npoucos.",
      corpo: "Aqui você aprofunda o argumento central em 2-3 frases.",
      destaque: "Não é o futuro. É o presente.",
    },
    {
      ...criarSlideVazio("split_horizontal", "preto"),
      kicker: "O PERFIL",
      headline: "Quem é o novo protagonista?",
      corpo: "Descreva o perfil numa linha corrida — comportamento, consumo, contexto.",
      destaque: "Não é amador. É autodidata.",
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
