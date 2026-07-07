import type { TemaConfig, LayoutRenderProps } from "./tipos";
import { criarSlideVazio, resolverFonteHeadline, aplicarTipoElemento } from "./tipos";
import {
  Topbar,
  Kicker,
  Headline,
  Corpo,
  Destaque,
  FotoOuPlaceholder,
  Pill,
} from "./primitivos";

// ============================================================
// TEMA 2 — EDITORIAL REFINED
// Paleta bege/preto/amarelo — mistura serif italic com sans.
// Baseado no "Brands Decoded Refined" que aparece no print 1.
// ============================================================

const CORES = {
  preto: "#0a0a0a",
  branco: "#ffffff",
  bege: "#F4F1EA",
  amarelo: "#FFC528",
};

// Fontes: headline pode variar, mas a fonte de apoio italic é SEMPRE serif
const FONTE_SERIF = "'Instrument Serif', 'Playfair Display', Georgia, serif";
const FONTE_CORPO_SANS = "'Archivo', 'Inter', sans-serif";

// ============================================================
// LAYOUT A — Foto grande + headline serif embaixo (fundo preto)
// Estilo slide 31 do print
// ============================================================
function LayoutFotoRetrato({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
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
      {/* Overlay escuro concentrado só embaixo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.95) 80%)",
          pointerEvents: "none",
        }}
      />
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} estilo="refined" mostrar={slide.mostrarTopbar !== false} />

      {/* Tag amarela no meio com kicker */}
      {slide.kicker && (
        <div
          style={{
            position: "absolute",
            bottom: 400,
            left: 56,
            backgroundColor: CORES.amarelo,
            color: CORES.preto,
            padding: "10px 18px",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "2px",
            textTransform: "uppercase",
          ...aplicarTipoElemento(slide, "kicker", { tamanho: 12, peso: 800 as any, tracking: 2 })
        }}
        >
          {slide.kicker}
        </div>
      )}

      {/* Headline serif embaixo */}
      <div style={{ position: "absolute", bottom: 100, left: 56, right: 56, color: CORES.branco }}>
        <Headline
          texto={slide.headline}
          cor={slide.corHeadline || CORES.branco}
          tamanho={52}
          fontFamily={FONTE_SERIF}
          uppercase={false}
          pesoHeadline={400}
          letterSpacing="-1px"
          lineHeight={1.1}
          slide={slide}
        />
        {slide.destaque && (
          <div style={{ marginTop: 20 }}>
            <Destaque texto={slide.destaque} cor={slide.corDestaque || CORES.amarelo} fontFamily={FONTE_CORPO_SANS} tamanho={22} slide={slide}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LAYOUT B — Texto sans pesado em cima + foto embaixo (fundo amarelo)
// Estilo slide 32 do print
// ============================================================
function LayoutTextoTopoFotoEmbaixo({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.amarelo }}>
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} estilo="refined" mostrar={slide.mostrarTopbar !== false} />

      {/* Headline em cima */}
      <div style={{ position: "absolute", top: 130, left: 56, right: 56, color: CORES.preto }}>
        {slide.kicker && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: slide.corKicker || CORES.preto,
              marginBottom: 16,
          ...aplicarTipoElemento(slide, "kicker", { tamanho: 13, peso: 800 as any, tracking: 2.5 })
        }}
          >
            {slide.kicker}
          </div>
        )}
        <Headline
          texto={slide.headline}
          cor={slide.corHeadline || CORES.preto}
          tamanho={52}
          fontFamily={fonteHeadline}
          uppercase={false}
          letterSpacing="-1.5px"
          lineHeight={1.1}
          slide={slide}
        />
      </div>

      {/* Foto embaixo */}
      <FotoOuPlaceholder
        url={slide.fotoUrl}
        largura={968}
        altura={480}
        accent={CORES.preto}
        style={{ position: "absolute", bottom: 160, left: 56 }}
      zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />

      {/* Corpo embaixo da foto */}
      {slide.corpo && (
        <div style={{ position: "absolute", bottom: 70, left: 56, right: 56 }}>
          <Corpo texto={slide.corpo} cor={CORES.preto} fontFamily={FONTE_CORPO_SANS} tamanho={20} slide={slide}/>
        </div>
      )}
    </div>
  );
}

// ============================================================
// LAYOUT C — Texto sans em cima + foto embaixo (fundo bege)
// Estilo slide 33 e 36 do print
// ============================================================
function LayoutTextoTopoFotoEmbaixoBege({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.bege }}>
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} estilo="refined" mostrar={slide.mostrarTopbar !== false} />

      <div style={{ position: "absolute", top: 120, left: 56, right: 56, color: CORES.preto }}>
        {slide.kicker && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: slide.corKicker || CORES.preto,
              marginBottom: 14,
          ...aplicarTipoElemento(slide, "kicker", { tamanho: 13, peso: 800 as any, tracking: 2.5 })
        }}
          >
            {slide.kicker}
          </div>
        )}
        <Headline
          texto={slide.headline}
          cor={slide.corHeadline || CORES.preto}
          tamanho={48}
          fontFamily={fonteHeadline}
          uppercase={false}
          letterSpacing="-1px"
          lineHeight={1.15}
          slide={slide}
        />
      </div>

      <FotoOuPlaceholder
        url={slide.fotoUrl}
        largura={968}
        altura={400}
        accent={CORES.preto}
        style={{ position: "absolute", bottom: 200, left: 56 }}
      zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />

      {slide.destaque && (
        <div style={{ position: "absolute", bottom: 110, left: 56, right: 56 }}>
          <div
            style={{
              fontFamily: FONTE_CORPO_SANS,
              fontSize: 20,
              fontWeight: 700,
              color: slide.corDestaque || CORES.preto,
              textDecoration: "underline",
              textDecorationColor: CORES.amarelo,
              textDecorationThickness: "3px",
              textUnderlineOffset: "4px",
          ...aplicarTipoElemento(slide, "destaque", { tamanho: 20, peso: 700 as any, tracking: 0 })
        }}
          >
            {slide.destaque}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// LAYOUT D — Só serif italic centralizado (fundo bege)
// Estilo slide 35 do print
// ============================================================
function LayoutSerifCentral({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.bege }}>
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} estilo="refined" mostrar={slide.mostrarTopbar !== false} />

      {/* Headline serif grande centralizado */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: 56,
          right: 56,
          transform: "translateY(-50%)",
          textAlign: "center",
          color: CORES.preto,
        }}
      >
        {slide.kicker && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: slide.corKicker || CORES.preto,
              marginBottom: 30,
          ...aplicarTipoElemento(slide, "kicker", { tamanho: 14, peso: 800 as any, tracking: 3 })
        }}
          >
            {slide.kicker}
          </div>
        )}
        <Headline
          texto={slide.headline}
          cor={slide.corHeadline || CORES.preto}
          tamanho={68}
          fontFamily={FONTE_SERIF}
          uppercase={false}
          pesoHeadline={400}
          italic
          letterSpacing="-1px"
          lineHeight={1.1}
          slide={slide}
        />
      </div>

      {slide.corpo && (
        <div
          style={{
            position: "absolute",
            bottom: 140,
            left: 140,
            right: 140,
            textAlign: "center",
          }}
        >
          <Corpo texto={slide.corpo} cor={CORES.preto} fontFamily={FONTE_CORPO_SANS} tamanho={18} slide={slide}/>
        </div>
      )}
    </div>
  );
}

// ============================================================
// LAYOUT E — Headline amarela gigante em fundo preto
// Estilo slide 37 do print (reforço editorial)
// ============================================================
function LayoutHeadlineAmarelaPreta({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
  const fonteHeadline = resolverFonteHeadline(slide, tema);
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.preto }}>
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} estilo="refined" mostrar={slide.mostrarTopbar !== false} />

      <div style={{ position: "absolute", top: 140, left: 56, right: 56, color: CORES.branco }}>
        {slide.kicker && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: slide.corKicker || CORES.amarelo,
              marginBottom: 20,
          ...aplicarTipoElemento(slide, "kicker", { tamanho: 13, peso: 800 as any, tracking: 2.5 })
        }}
          >
            {slide.kicker}
          </div>
        )}
        <Headline
          texto={slide.headline}
          cor={slide.corHeadline || CORES.amarelo}
          tamanho={60}
          fontFamily={fonteHeadline}
          uppercase={false}
          letterSpacing="-1.5px"
          lineHeight={1.08}
          slide={slide}
        />
      </div>

      <FotoOuPlaceholder
        url={slide.fotoUrl}
        largura={968}
        altura={380}
        accent={CORES.amarelo}
        style={{ position: "absolute", top: 660, left: 56 }}
        borderRadius={4}
      zoom={slide.fotoZoom}
        offsetX={slide.fotoOffsetX}
        offsetY={slide.fotoOffsetY}
        onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
      />

      {slide.corpo && (
        <div style={{ position: "absolute", bottom: 80, left: 56, right: 56 }}>
          <Corpo texto={slide.corpo} cor={CORES.branco} fontFamily={FONTE_CORPO_SANS} tamanho={18} slide={slide}/>
        </div>
      )}
    </div>
  );
}

// ============================================================
// LAYOUT F — Foto full CTA (fechamento)
// Estilo slide 40 e 54 do print (CTA)
// ============================================================
function LayoutFotoFullCTA({ slide, tema, marca, numero, coresResolvidas, onSlideChange }: LayoutRenderProps) {
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
            "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 88%)",
          pointerEvents: "none",
        }}
      />
      <Topbar cor={coresResolvidas.topbar} marca={marca} numero={numero} corNumero={coresResolvidas.numero} estilo="refined" mostrar={slide.mostrarTopbar !== false} />

      <div style={{ position: "absolute", bottom: 110, left: 56, right: 56, color: CORES.branco }}>
        {/* Pequeno ícone amarelo decorativo (triângulo/seta) */}
        <div
          style={{
            width: 24,
            height: 24,
            backgroundColor: CORES.amarelo,
            clipPath: "polygon(0 0, 100% 50%, 0 100%)",
            marginBottom: 18,
          }}
        />
        <Headline
          texto={slide.headline}
          cor={slide.corHeadline || CORES.amarelo}
          tamanho={30}
          fontFamily={fonteHeadline}
          uppercase={false}
          letterSpacing="-0.5px"
          lineHeight={1.2}
          pesoHeadline={700}
          slide={slide}
        />
        {slide.destaque && (
          <div style={{ marginTop: 10 }}>
            <Corpo texto={slide.destaque} cor={CORES.branco} fontFamily={FONTE_CORPO_SANS} tamanho={20} slide={slide}/>
          </div>
        )}
        {slide.mostrarPill && slide.textoPill && (
          <div style={{ marginTop: 22 }}>
            <Pill texto={slide.textoPill} corFundo={CORES.amarelo} corTexto={CORES.preto} slide={slide} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EXPORT
// ============================================================

export const TEMA_EDITORIAL_REFINED: TemaConfig = {
  id: "editorial_refined",
  nome: "Editorial Refined",
  descricao: "Bege + amarelo + preto com serif italic. Elegante e variado.",
  cores: CORES,
  fonteHeadlineDefault: "archivo",
  fonteCorpo: FONTE_CORPO_SANS,
  corKickerDefault: CORES.preto,
  corHeadlineDefault: CORES.preto,
  corDestaqueDefault: CORES.amarelo,
  layouts: [
    {
      id: "foto_retrato",
      nome: "Foto Retrato",
      descricao: "Foto full + headline serif embaixo (tag amarela no meio)",
      usaFoto: true,
      render: (p) => <LayoutFotoRetrato {...p} />,
    },
    {
      id: "texto_topo_foto_amarelo",
      nome: "Texto + Foto · Amarelo",
      descricao: "Fundo amarelo, headline sans em cima, foto embaixo",
      usaFoto: true,
      render: (p) => <LayoutTextoTopoFotoEmbaixo {...p} />,
    },
    {
      id: "texto_topo_foto_bege",
      nome: "Texto + Foto · Bege",
      descricao: "Fundo bege, headline sans, foto embaixo, destaque sublinhado",
      usaFoto: true,
      render: (p) => <LayoutTextoTopoFotoEmbaixoBege {...p} />,
    },
    {
      id: "serif_central",
      nome: "Serif Centralizado",
      descricao: "Só headline serif italic centralizado (fundo bege)",
      usaFoto: false,
      render: (p) => <LayoutSerifCentral {...p} />,
    },
    {
      id: "headline_amarela_preto",
      nome: "Headline Amarela",
      descricao: "Headline amarela gigante + foto + corpo (fundo preto)",
      usaFoto: true,
      render: (p) => <LayoutHeadlineAmarelaPreta {...p} />,
    },
    {
      id: "foto_full_cta",
      nome: "CTA Foto Full",
      descricao: "Foto full + CTA com seta amarela + pill (fechamento)",
      usaFoto: true,
      render: (p) => <LayoutFotoFullCTA {...p} />,
    },
  ],
  slidesExemplo: [
    {
      ...criarSlideVazio("foto_retrato", "preto"),
      kicker: "GESTÃO DE REDES COBRA O PADRÃO DE EXCELÊNCIA",
      headline: "O desafio não é abrir unidades,\nmas manter padrão com sistema,\ncompliance e treinamento.",
      destaque: "",
    },
    {
      ...criarSlideVazio("texto_topo_foto_amarelo", "amarelo"),
      kicker: "ESCALA COM RISCO",
      headline: "Expansão territorial costuma ser tratada como crescimento automático, mas em redes reguladas o verdadeiro teste está na consistência operacional diária.",
      corpo: "Centenas de pontos ampliam variáveis, rotinas e exposição normativa.",
    },
    {
      ...criarSlideVazio("texto_topo_foto_bege", "bege"),
      kicker: "CONTROLE CENTRAL",
      headline: "Cada nova unidade adiciona fluxos de caixa, equipes, rotinas locais e interações com clientes, aumentando o risco de inconsistências se não houver uma arquitetura central de controle.",
      destaque: "É nesse ponto que a inteligência operacional deixa de ser suporte e passa a ser estrutura.",
    },
    {
      ...criarSlideVazio("serif_central", "bege"),
      kicker: "",
      headline: "Atendimento consistente reduz\nruído operacional.",
      corpo: "Quando tecnologia proprietária, auditoria rigorosa e capacitação contínua atuam de forma integrada, a expansão deixa de ser aposta e passa a ser decisão calculada.",
    },
    {
      ...criarSlideVazio("headline_amarela_preto", "preto"),
      kicker: "O RESULTADO",
      headline: "A padronização não depende apenas de tecnologia, mas também de comportamento replicável em todos os pontos da rede.",
      corpo: "Uma metodologia própria de treinamento assegura que o padrão de atendimento seja uniforme, independentemente da localização geográfica.",
    },
    {
      ...criarSlideVazio("foto_full_cta", "preto"),
      kicker: "",
      headline: "Curta, comente, compartilhe\ne siga a Potencial para ficar por\ndentro do mercado financeiro.",
      destaque: "",
      mostrarPill: true,
      textoPill: "@POTENCIAL · SIGA",
    },
  ],
};
