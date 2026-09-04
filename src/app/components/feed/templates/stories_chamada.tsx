import type { FeedSlideData } from "./tipos";
import { FONTE_KUFAM, obterAlturaRodape, type TipoRodape } from "./tipos";
import RodapePNG from "../components/RodapePNG";
import FotoDraggable from "../components/FotoDraggable";
import IconeLucide from "../components/IconeLucide";

/**
 * stories_chamada — Story 1080x1920 que divulga uma nova postagem (carrossel).
 *
 * Modelo aprovado (v7.25): a FOTO DA CAPA do carrossel como fundo cheio +
 * ícone (tema do carrossel) + o TÍTULO do carrossel + botão "Saiba mais no feed"
 * + rodapé da marca (parceleaqui.com.br). Sem nova geração de IA: reusa a capa.
 */
export default function TemplateStoriesChamada({
  slide,
  escala = 1,
  onSlideChange,
}: {
  slide: FeedSlideData;
  escala?: number;
  onSlideChange?: (patch: Partial<FeedSlideData>) => void;
}) {
  const e = (n: number) => `${n * escala}px`;
  const any = slide as any;

  const tipoRodape: TipoRodape = slide.tipoRodape ?? "rodape_01";
  const alturaRodape = obterAlturaRodape(tipoRodape, "stories");

  const iconeNome: string = slide.iconeNome || "CircleDollarSign";
  const tamIcone = slide.tamIcone ?? 88;
  const espessuraIcone = slide.espessuraIcone ?? 2;
  const kicker = ((slide as any).kicker || slide.pilula || "").toString();
  const headline = slide.headline || "";
  const cta = any.chamadaCTA ?? "Saiba mais no feed";

  return (
    <div
      style={{
        position: "relative",
        width: e(1080),
        height: e(1920),
        backgroundColor: "#000",
        fontFamily: FONTE_KUFAM,
        overflow: "hidden",
      }}
    >
      {/* FOTO DA CAPA — fundo cheio */}
      <div style={{ position: "absolute", left: 0, top: 0, width: e(1080), height: e(1920), overflow: "hidden" }}>
        {slide.fotoUrl ? (
          <FotoDraggable
            src={slide.fotoUrl}
            width={1080 * escala}
            height={1920 * escala}
            zoom={slide.fotoZoom ?? 1}
            offsetX={slide.fotoOffsetX ?? 0}
            offsetY={slide.fotoOffsetY ?? 0}
            onPositionChange={onSlideChange ? (x, y) => onSlideChange({ fotoOffsetX: x, fotoOffsetY: y }) : undefined}
            onZoomChange={onSlideChange ? (zz) => onSlideChange({ fotoZoom: zz }) : undefined}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #2a2a2a, #0a0a0a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
              fontSize: e(20),
            }}
          >
            [ FOTO DA CAPA ]
          </div>
        )}
      </div>

      {/* Scrim de leitura no rodape */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: e(1120),
          background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 32%, rgba(0,0,0,0.15) 62%, rgba(0,0,0,0) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Bloco: icone + titulo + CTA, ancorado acima do rodape */}
      <div
        style={{
          position: "absolute",
          left: e(72),
          right: e(72),
          bottom: e(alturaRodape + 90),
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <div style={{ color: "#FFFFFF", display: "flex" }}>
          <IconeLucide nome={iconeNome} size={tamIcone * escala} strokeWidth={espessuraIcone} />
        </div>

        {kicker && (
          <div
            style={{
              marginTop: e(20),
              color: "#FFC528",
              fontSize: e(28),
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </div>
        )}

        {headline && (
          <div
            style={{
              marginTop: e(14),
              color: "#FFFFFF",
              fontSize: e(72),
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              whiteSpace: "pre-line",
            }}
          >
            {headline}
          </div>
        )}

        <div
          style={{
            marginTop: e(40),
            backgroundColor: "transparent",
            color: "#FFFFFF",
            border: `${e(3)} solid #FFFFFF`,
            borderRadius: e(60),
            fontSize: e(34),
            fontWeight: 700,
            paddingTop: e(24),
            paddingBottom: e(22),
            paddingLeft: e(52),
            paddingRight: e(52),
            display: "inline-block",
            boxSizing: "border-box",
          }}
        >
          {cta}
        </div>
      </div>

      {slide.mostrarFooter !== false && (
        <RodapePNG tipo={tipoRodape} formato="stories" escala={escala} />
      )}
    </div>
  );
}
