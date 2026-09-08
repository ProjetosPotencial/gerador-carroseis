import type { TemaConfig, LayoutRenderProps, SlideData } from "./tipos";
import { criarSlideVazio, aplicarTipoElemento } from "./tipos";
import { FotoOuPlaceholder } from "./primitivos";

// ============================================================
// TEMA — EDITORIAL PONTENCIAL
// Recriado a partir do Figma "Carrosséis brandsdecoded".
// Paleta carvão / âmbar / creme. Tipografia Inter (sans pesada)
// + Instrument Serif (display serifado para capa e citações).
// 10 layouts editoriais 1080x1350.
// ============================================================

const CORES = {
  preto: "#1d1d1b",
  branco: "#ffffff",
  bege: "#fff9e8",
  amarelo: "#ffb600",
};

const SERIF = "'Instrument Serif', 'Playfair Display', Georgia, serif";

// Gradientes reutilizados
const GRAD_RODAPE =
  "linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.55) 33%, rgba(0,0,0,0) 62%)";
const GRAD_FULL =
  "linear-gradient(to bottom, rgba(0,0,0,0) 16%, rgba(0,0,0,0.97) 100%)";

// ============================================================
// CABEÇALHO EDITORIAL — 3 colunas (categoria · marca · copyright)
// ============================================================
function Cabecalho({
  categoria,
  marca,
  cor,
}: {
  categoria: string;
  marca: string;
  cor: string;
}) {
  const ano = new Date().getFullYear();
  return (
    <div
      style={{
        position: "absolute",
        top: 42,
        left: 40,
        right: 40,
        display: "flex",
        alignItems: "center",
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        color: cor,
        zIndex: 10,
      }}
    >
      <span style={{ flex: 1, textAlign: "left" }}>{categoria || "Estudo de caso"}</span>
      <span style={{ flex: 1, textAlign: "center" }}>{marca}</span>
      <span style={{ flex: 1, textAlign: "right" }}>©copyright {ano}</span>
    </div>
  );
}

// Helper: props de drag/zoom da foto principal
function fotoProps(slide: SlideData, onSlideChange?: LayoutRenderProps["onSlideChange"]) {
  return {
    zoom: slide.fotoZoom,
    offsetX: slide.fotoOffsetX,
    offsetY: slide.fotoOffsetY,
    onPositionChange: onSlideChange
      ? (x: number, y: number) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y })
      : undefined,
  };
}

// ============================================================
// LAYOUT 1 — CAPA (foto cheia + pill + título serifado)
// ============================================================
function LayoutCapaFoto({ slide, marca, onSlideChange }: LayoutRenderProps) {
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.amarelo }}>
      <FotoOuPlaceholder
        url={slide.fotoUrl}
        largura={1080}
        altura={1350}
        accent={CORES.amarelo}
        style={{ position: "absolute", inset: 0 }}
        {...fotoProps(slide, onSlideChange)}
      />
      <div style={{ position: "absolute", inset: 0, background: GRAD_RODAPE, pointerEvents: "none" }} />
      <Cabecalho categoria={slide.kicker} marca={marca} cor={CORES.preto} />
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 96 }}>
        {slide.mostrarPill && slide.textoPill && (
          <div
            style={{
              ...aplicarTipoElemento(slide, "pill", {
                tamanho: 20,
                fonte: "inter",
                peso: 700,
                caps: false,
                tracking: 0,
              }),
              display: "inline-block",
              backgroundColor: CORES.amarelo,
              color: CORES.preto,
              padding: "12px 32px",
              borderRadius: 999,
              marginBottom: 28,
            }}
          >
            {slide.textoPill}
          </div>
        )}
        <div
          style={{
            ...aplicarTipoElemento(slide, "headline", {
              tamanho: 100,
              fonte: "instrument_serif",
              peso: 400,
              caps: false,
              tracking: -3,
            }),
            fontFamily: SERIF,
            color: CORES.branco,
            lineHeight: 0.96,
            whiteSpace: "pre-line",
          }}
        >
          {slide.headline}
        </div>
        {slide.corpo && (
          <div
            style={{
              ...aplicarTipoElemento(slide, "corpo", {
                tamanho: 46,
                fonte: "inter",
                peso: 500,
                caps: false,
              }),
              color: CORES.branco,
              lineHeight: 1.18,
              marginTop: 28,
              whiteSpace: "pre-line",
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
// LAYOUT EMPILHADO — título / foto / legenda (base reutilizável)
// ============================================================
function LayoutEmpilhado(
  props: LayoutRenderProps,
  cfg: {
    fundo: string;
    corHeadline: string;
    corLegenda: string;
    corCabecalho: string;
    headlineTam: number;
    headlinePeso: 400 | 500 | 600 | 700 | 900;
    fotoAltura: number;
  }
) {
  const { slide, marca, onSlideChange } = props;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: cfg.fundo }}>
      <Cabecalho categoria={slide.kicker} marca={marca} cor={cfg.corCabecalho} />
      <div
        style={{
          position: "absolute",
          left: 36,
          right: 36,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 46,
        }}
      >
        <div
          style={{
            ...aplicarTipoElemento(slide, "headline", {
              tamanho: cfg.headlineTam,
              fonte: "inter",
              peso: cfg.headlinePeso,
              caps: false,
              tracking: -3,
            }),
            color: cfg.corHeadline,
            lineHeight: 1.02,
            whiteSpace: "pre-line",
          }}
        >
          {slide.headline}
        </div>
        <FotoOuPlaceholder
          url={slide.fotoUrl}
          largura={1008}
          altura={cfg.fotoAltura}
          accent={CORES.amarelo}
          borderRadius={8}
          {...fotoProps(slide, onSlideChange)}
        />
        <div
          style={{
            ...aplicarTipoElemento(slide, "destaque", {
              tamanho: 36,
              fonte: "inter",
              peso: 700,
              caps: false,
              tracking: -1,
            }),
            color: cfg.corLegenda,
            lineHeight: 1.24,
            whiteSpace: "pre-line",
          }}
        >
          {slide.destaque}
        </div>
      </div>
    </div>
  );
}

// LAYOUT 2 — empilhado fundo âmbar (título preto pesado)
function LayoutEmpilhadoAmbar(p: LayoutRenderProps) {
  return LayoutEmpilhado(p, {
    fundo: CORES.amarelo,
    corHeadline: CORES.preto,
    corLegenda: CORES.preto,
    corCabecalho: CORES.preto,
    headlineTam: 62,
    headlinePeso: 900,
    fotoAltura: 556,
  });
}

// LAYOUT 6 — empilhado fundo creme (título carvão semibold)
function LayoutEmpilhadoCreme(p: LayoutRenderProps) {
  return LayoutEmpilhado(p, {
    fundo: CORES.bege,
    corHeadline: CORES.preto,
    corLegenda: CORES.preto,
    corCabecalho: CORES.preto,
    headlineTam: 62,
    headlinePeso: 600,
    fotoAltura: 528,
  });
}

// LAYOUT 7 — empilhado fundo âmbar com headline gigante
function LayoutEmpilhadoDestaque(p: LayoutRenderProps) {
  return LayoutEmpilhado(p, {
    fundo: CORES.amarelo,
    corHeadline: CORES.preto,
    corLegenda: CORES.preto,
    corCabecalho: CORES.preto,
    headlineTam: 74,
    headlinePeso: 900,
    fotoAltura: 500,
  });
}

// ============================================================
// LAYOUT 3 — fundo carvão: título serifado/sans + foto + corpo
// ============================================================
function LayoutTextoEscuro({ slide, marca, onSlideChange }: LayoutRenderProps) {
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.preto }}>
      <Cabecalho categoria={slide.kicker} marca={marca} cor={CORES.bege} />
      <div
        style={{
          position: "absolute",
          left: 32,
          right: 32,
          top: 96,
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        <div
          style={{
            ...aplicarTipoElemento(slide, "headline", {
              tamanho: 60,
              fonte: "inter",
              peso: 400,
              caps: false,
              tracking: -3,
            }),
            color: CORES.amarelo,
            lineHeight: 0.99,
            whiteSpace: "pre-line",
          }}
        >
          {slide.headline}
        </div>
        <FotoOuPlaceholder
          url={slide.fotoUrl}
          largura={1016}
          altura={560}
          accent={CORES.amarelo}
          borderRadius={8}
          {...fotoProps(slide, onSlideChange)}
        />
        <div
          style={{
            ...aplicarTipoElemento(slide, "corpo", {
              tamanho: 36,
              fonte: "inter",
              peso: 700,
              caps: false,
              tracking: -1,
            }),
            color: CORES.bege,
            lineHeight: 1.3,
            textDecoration: "underline",
            textUnderlineOffset: 6,
            whiteSpace: "pre-line",
          }}
        >
          {slide.corpo}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LAYOUT FOTO-RODAPÉ — título no topo + foto grande embaixo
// com legenda sobreposta (base reutilizável)
// ============================================================
function LayoutFotoRodape(
  props: LayoutRenderProps,
  cfg: { corLegenda: string; headlineTam: number }
) {
  const { slide, marca, onSlideChange } = props;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.bege }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 446, bottom: 0 }}>
        <FotoOuPlaceholder
          url={slide.fotoUrl}
          largura={1080}
          altura={904}
          accent={CORES.amarelo}
          style={{ position: "absolute", inset: 0 }}
          {...fotoProps(slide, onSlideChange)}
        />
        <div style={{ position: "absolute", inset: 0, background: GRAD_RODAPE, pointerEvents: "none" }} />
      </div>
      <Cabecalho categoria={slide.kicker} marca={marca} cor={CORES.preto} />
      <div
        style={{
          ...aplicarTipoElemento(slide, "headline", {
            tamanho: cfg.headlineTam,
            fonte: "inter",
            peso: 500,
            caps: false,
            tracking: -2,
          }),
          position: "absolute",
          left: 40,
          right: 40,
          top: 140,
          color: CORES.preto,
          lineHeight: 1.1,
          whiteSpace: "pre-line",
        }}
      >
        {slide.headline}
      </div>
      <div
        style={{
          ...aplicarTipoElemento(slide, "destaque", {
            tamanho: 37,
            fonte: "inter",
            peso: 700,
            caps: false,
            tracking: -1,
          }),
          position: "absolute",
          left: 40,
          right: 90,
          bottom: 96,
          color: cfg.corLegenda,
          lineHeight: 1.18,
          whiteSpace: "pre-line",
        }}
      >
        {slide.destaque}
      </div>
    </div>
  );
}

// LAYOUT 4 — foto-rodapé, legenda creme
function LayoutFotoRodapeCreme(p: LayoutRenderProps) {
  return LayoutFotoRodape(p, { corLegenda: CORES.bege, headlineTam: 48 });
}

// LAYOUT 9 — foto-rodapé, legenda âmbar
function LayoutFotoRodapeAmbar(p: LayoutRenderProps) {
  return LayoutFotoRodape(p, { corLegenda: CORES.amarelo, headlineTam: 50 });
}

// ============================================================
// LAYOUT CENTRO — foto cheia + texto centralizado (base)
// ============================================================
function LayoutCentro(
  props: LayoutRenderProps,
  cfg: { headlinePeso: 600 | 900; headlineTam: number; mostrarCorpo: boolean; selo: boolean }
) {
  const { slide, marca, onSlideChange } = props;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.preto }}>
      <FotoOuPlaceholder
        url={slide.fotoUrl}
        largura={1080}
        altura={1350}
        accent={CORES.amarelo}
        style={{ position: "absolute", inset: 0 }}
        {...fotoProps(slide, onSlideChange)}
      />
      <div style={{ position: "absolute", inset: 0, background: GRAD_FULL, pointerEvents: "none" }} />
      <Cabecalho categoria={slide.kicker} marca={marca} cor={cfg.selo ? CORES.bege : CORES.preto} />
      {cfg.selo && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 392,
            width: 72,
            height: 72,
            borderRadius: 999,
            backgroundColor: CORES.amarelo,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            fontSize: 40,
            color: CORES.preto,
          }}
        >
          P
        </div>
      )}
      <div
        style={{
          ...aplicarTipoElemento(slide, "headline", {
            tamanho: cfg.headlineTam,
            fonte: "inter",
            peso: cfg.headlinePeso,
            caps: false,
            tracking: -1,
          }),
          position: "absolute",
          left: 72,
          right: 72,
          bottom: cfg.mostrarCorpo ? 360 : 150,
          color: cfg.selo ? CORES.bege : CORES.branco,
          textAlign: "center",
          lineHeight: 1.04,
          whiteSpace: "pre-line",
        }}
      >
        {slide.headline}
      </div>
      {cfg.mostrarCorpo && slide.corpo && (
        <div
          style={{
            ...aplicarTipoElemento(slide, "corpo", {
              tamanho: 36,
              fonte: "inter",
              peso: 700,
              caps: false,
              tracking: -1,
            }),
            position: "absolute",
            left: 100,
            right: 100,
            bottom: 150,
            color: CORES.bege,
            textAlign: "center",
            lineHeight: 1.22,
            whiteSpace: "pre-line",
          }}
        >
          {slide.corpo}
        </div>
      )}
    </div>
  );
}

// LAYOUT 5 — foto cheia + headline e corpo centralizados
function LayoutCentroTexto(p: LayoutRenderProps) {
  return LayoutCentro(p, { headlinePeso: 600, headlineTam: 52, mostrarCorpo: true, selo: false });
}

// LAYOUT 10 — encerramento (foto cheia + selo P + CTA)
function LayoutEncerramento(p: LayoutRenderProps) {
  return LayoutCentro(p, { headlinePeso: 900, headlineTam: 54, mostrarCorpo: false, selo: true });
}

// ============================================================
// LAYOUT 8 — CITAÇÃO (fundo carvão, serifado itálico âmbar)
// ============================================================
function LayoutCitacao({ slide, marca }: LayoutRenderProps) {
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CORES.preto }}>
      <Cabecalho categoria={slide.kicker} marca={marca} cor={CORES.bege} />
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          top: 0,
          bottom: 340,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            ...aplicarTipoElemento(slide, "headline", {
              tamanho: 76,
              fonte: "instrument_serif",
              peso: 400,
              caps: false,
              tracking: -2,
            }),
            fontFamily: SERIF,
            fontStyle: "italic",
            color: CORES.amarelo,
            textAlign: "center",
            lineHeight: 1.03,
            whiteSpace: "pre-line",
          }}
        >
          {slide.headline}
        </div>
      </div>
      <div
        style={{
          ...aplicarTipoElemento(slide, "corpo", {
            tamanho: 33,
            fonte: "inter",
            peso: 900,
            caps: false,
            tracking: -1,
          }),
          position: "absolute",
          left: 150,
          right: 150,
          bottom: 130,
          color: CORES.bege,
          textAlign: "center",
          lineHeight: 1.27,
          whiteSpace: "pre-line",
        }}
      >
        {slide.corpo}
      </div>
    </div>
  );
}

// ============================================================
// EXPORT DO TEMA
// ============================================================
export const TEMA_EDITORIAL_PONTENCIAL: TemaConfig = {
  id: "editorial_pontencial",
  nome: "Editorial Pontencial",
  descricao: "Estudo de caso editorial — carvão, âmbar e creme. Inter + Instrument Serif.",
  cores: CORES,
  fonteHeadlineDefault: "inter",
  fonteCorpo: "'Inter', sans-serif",
  corKickerDefault: CORES.amarelo,
  corHeadlineDefault: CORES.preto,
  corDestaqueDefault: CORES.amarelo,
  layouts: [
    {
      id: "ep_capa_foto",
      nome: "Capa · Foto",
      descricao: "Foto cheia, pill e título serifado sobre o rodapé",
      usaFoto: true,
      coresFundoPermitidas: ["preto"],
      render: (p) => <LayoutCapaFoto {...p} />,
    },
    {
      id: "ep_empilhado_ambar",
      nome: "Empilhado · Âmbar",
      descricao: "Fundo âmbar — título, foto e legenda empilhados",
      usaFoto: true,
      coresFundoPermitidas: ["amarelo"],
      render: (p) => <LayoutEmpilhadoAmbar {...p} />,
    },
    {
      id: "ep_texto_escuro",
      nome: "Texto · Carvão",
      descricao: "Fundo carvão — título âmbar, foto e corpo sublinhado",
      usaFoto: true,
      coresFundoPermitidas: ["preto"],
      render: (p) => <LayoutTextoEscuro {...p} />,
    },
    {
      id: "ep_foto_rodape_creme",
      nome: "Foto-rodapé · Creme",
      descricao: "Título no topo, foto grande embaixo, legenda creme",
      usaFoto: true,
      coresFundoPermitidas: ["bege"],
      render: (p) => <LayoutFotoRodapeCreme {...p} />,
    },
    {
      id: "ep_centro_texto",
      nome: "Centro · Texto",
      descricao: "Foto cheia com headline e corpo centralizados",
      usaFoto: true,
      coresFundoPermitidas: ["preto"],
      render: (p) => <LayoutCentroTexto {...p} />,
    },
    {
      id: "ep_empilhado_creme",
      nome: "Empilhado · Creme",
      descricao: "Fundo creme — título, foto e legenda empilhados",
      usaFoto: true,
      coresFundoPermitidas: ["bege"],
      render: (p) => <LayoutEmpilhadoCreme {...p} />,
    },
    {
      id: "ep_empilhado_destaque",
      nome: "Empilhado · Destaque",
      descricao: "Fundo âmbar com headline gigante + foto + legenda",
      usaFoto: true,
      coresFundoPermitidas: ["amarelo"],
      render: (p) => <LayoutEmpilhadoDestaque {...p} />,
    },
    {
      id: "ep_citacao",
      nome: "Citação",
      descricao: "Fundo carvão — citação serifada itálica âmbar",
      usaFoto: false,
      coresFundoPermitidas: ["preto"],
      render: (p) => <LayoutCitacao {...p} />,
    },
    {
      id: "ep_foto_rodape_ambar",
      nome: "Foto-rodapé · Âmbar",
      descricao: "Título no topo, foto grande embaixo, legenda âmbar",
      usaFoto: true,
      coresFundoPermitidas: ["bege"],
      render: (p) => <LayoutFotoRodapeAmbar {...p} />,
    },
    {
      id: "ep_encerramento",
      nome: "Encerramento",
      descricao: "Foto cheia + selo Potencial + chamada final",
      usaFoto: true,
      coresFundoPermitidas: ["preto"],
      render: (p) => <LayoutEncerramento {...p} />,
    },
  ],
  slidesExemplo: [
    {
      ...criarSlideVazio("ep_capa_foto", "preto"),
      kicker: "Estudo de caso",
      headline: "Presença digital resolve toda a expansão bancária?",
      corpo: "Em regiões onde a orientação presencial pesa, a parceria exclusiva garante ambiência, segurança e portfólio completo.",
      mostrarPill: true,
      textoPill: "O que é o Coban Mais BB?",
    },
    {
      ...criarSlideVazio("ep_empilhado_ambar", "amarelo"),
      kicker: "Estudo de caso",
      headline: "A expansão recente priorizou eficiência e canais digitais, mas há territórios em que confiança e proximidade continuam determinantes.",
      destaque: "Nem toda capilaridade nasce de uma nova agência.",
    },
    {
      ...criarSlideVazio("ep_texto_escuro", "preto"),
      kicker: "Estudo de caso",
      headline: "O modelo de correspondente estruturado amplia cobertura sem replicar estrutura pesada.",
      corpo: "A operação foi desenhada para funcionar como braço territorial do banco, preservando governança e experiência.",
    },
    {
      ...criarSlideVazio("ep_foto_rodape_creme", "bege"),
      kicker: "Estudo de caso",
      headline: "A chancela de uma instituição pública reforça legitimidade e a percepção de segurança.",
      destaque: "Tradição também é ativo operacional.",
    },
    {
      ...criarSlideVazio("ep_empilhado_creme", "bege"),
      kicker: "Estudo de caso",
      headline: "Essa amplitude reduz deslocamentos, organiza fluxos e concentra serviços.",
      destaque: "Custo fixo não é o único critério.",
    },
    {
      ...criarSlideVazio("ep_citacao", "preto"),
      kicker: "Estudo de caso",
      headline: "Passa a ser cobertura com padrão.",
      corpo: "Em regiões onde a digitalização não resolve todas as fricções, a orientação presencial preserva confiança e reduz barreiras operacionais.",
    },
    {
      ...criarSlideVazio("ep_centro_texto", "preto"),
      kicker: "Estudo de caso",
      headline: "São mais de 25 anos de parceria exclusiva.",
      corpo: "O portfólio vai além de pagamentos simples — inclui consultas de saldo, extratos, tributos e benefícios do INSS.",
    },
    {
      ...criarSlideVazio("ep_encerramento", "preto"),
      kicker: "Estudo de caso",
      headline: "Curta, comente, compartilhe e siga a Potencial para ficar por dentro do mercado financeiro.",
    },
  ],
};
