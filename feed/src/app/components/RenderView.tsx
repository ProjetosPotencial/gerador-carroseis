import CarrosselSlide from "./CarrosselSlide";
import FeedSlide from "./feed/FeedSlide";
import type { TemaId } from "./temas/tipos";

/**
 * Rota de render headless (v7.20.6). Acessível via `?render=1` (fora do AuthGate).
 * Lê o payload de UM slide do location.hash (base64 de um JSON) e renderiza em
 * resolução real, sem UI ao redor — pra um navegador headless (Cowork) tirar um
 * print nativo. Suporta carrossel e Feed/Stories.
 *
 * Payload: { kind?: "carrossel"|"feed", slide, temaId?, marca?, index?, total? }
 *  - carrossel → CarrosselSlide (1080×1350)
 *  - feed      → FeedSlide (1080×1350 feed, 1080×1920 stories pelo templateId)
 */
function decodePayload(): any | null {
  try {
    const h = window.location.hash.replace(/^#/, "");
    if (!h) return null;
    return JSON.parse(decodeURIComponent(escape(atob(h))));
  } catch {
    return null;
  }
}

export default function RenderView() {
  const payload = decodePayload();
  if (!payload || !payload.slide) {
    return (
      <div id="render-erro" style={{ color: "#fff", padding: 20, fontFamily: "sans-serif" }}>
        RENDER: payload ausente ou inválido.
      </div>
    );
  }
  const {
    slide,
    kind = "carrossel",
    temaId = "brands_decoded_classic" as TemaId,
    marca = "POTENCIAL · MERCADO",
    index = 0,
    total = 7,
  } = payload;

  const ehStories = kind === "feed" && String(slide.templateId || "").startsWith("stories");
  const w = 1080;
  const h = kind === "feed" ? (ehStories ? 1920 : 1350) : 1350;

  return (
    <div
      id="render-root"
      style={{ width: w, height: h, position: "absolute", top: 0, left: 0, overflow: "hidden", background: "#0a0a0a" }}
    >
      {kind === "feed" ? (
        <FeedSlide slide={slide} escala={1} />
      ) : (
        <CarrosselSlide
          slide={slide}
          index={index}
          total={total}
          marca={marca}
          temaId={temaId as TemaId}
          escalaReal
        />
      )}
    </div>
  );
}
