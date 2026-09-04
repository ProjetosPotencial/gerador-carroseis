import { useState, useEffect } from "react";
import { parsearTextoColado } from "../lib/parsearTextoColado";
import { parsearTextoFeedStories } from "../lib/parsearTextoFeed";

/**
 * SemanaEditor — Workspace "Semana Instagram" (v7.25).
 * Segura as 4 pecas da semana de uma vez (2 carrosseis + 2 feed/stories).
 * Convive com os editores individuais. Fluxo:
 *  1. "Colar semana" -> distribui o conteudo unificado nas 4 pecas.
 *  2. "Abrir no editor" -> carrega a peca no editor de Carrossel/Feed.
 *  3. "Puxar" -> traz de volta o que foi editado para a peca.
 */

// v7.27: DUAS LINHAS EDITORIAIS. Cada uma tem o seu arquivo publicado pelo
// orquestrador e o seu proprio rascunho no navegador, para trabalharem em paralelo.
type Linha = "parcele" | "potencial";
const LINHAS: { id: Linha; rotulo: string }[] = [
  { id: "parcele", rotulo: "Parcele Aqui" },
  { id: "potencial", rotulo: "Grupo Potencial" },
];
const BASE_SEMANA = "https://bgqavzywlmeokjmluqcb.supabase.co/storage/v1/object/public/imagens-parcele/semana/";
const URLS_SEMANA: Record<Linha, string> = {
  parcele: BASE_SEMANA + "semana-app-atual.json",
  potencial: BASE_SEMANA + "semana-app-atual-potencial.json",
};
const KEY_LINHA = "parceleaqui:semana-ig:linha";
const CHAVE_BASE = "parceleaqui:semana-ig:v1";
const chaveDaLinha = (l: Linha) => (l === "parcele" ? CHAVE_BASE : CHAVE_BASE + ":" + l);
function linhaSalva(): Linha {
  try {
    const v = localStorage.getItem(KEY_LINHA);
    if (v === "parcele" || v === "potencial") return v;
  } catch {}
  return "parcele";
}
const KEY_CARROSSEL = "parceleaqui:carrossel:slides:v1";
const KEY_FEED = "parceleaqui:feed-stories:slides:v1";
const EDIT_KEY = "parceleaqui:semana-ig:editando";

type PecaTipo = "carrossel" | "feed";
interface PecaSemana {
  id: string;
  tipo: PecaTipo;
  titulo: string;
  slides: any[];
  story?: any[]; // story-chamada editavel (so carrossel)
}

const PADRAO: PecaSemana[] = [
  { id: "f1", tipo: "feed", titulo: "Feed + Story 1 (seg)", slides: [] },
  { id: "c1", tipo: "carrossel", titulo: "Carrossel foto 1 (ter)", slides: [] },
  { id: "c2", tipo: "carrossel", titulo: "Carrossel foto 2 (qua)", slides: [] },
  { id: "f2", tipo: "feed", titulo: "Feed + Story 2 (qui)", slides: [] },
  { id: "c3", tipo: "carrossel", titulo: "Carrossel tipografia (sex)", slides: [] },
];

function carregar(linha: Linha = "parcele"): PecaSemana[] {
  try {
    const raw = localStorage.getItem(chaveDaLinha(linha));
    if (!raw) return PADRAO;
    const p = JSON.parse(raw);
    if (Array.isArray(p) && p.length === PADRAO.length) return p;
  } catch {}
  return PADRAO;
}

function distribuirSemana(texto: string): { carrossel: any[][]; feed: any[][] } {
  const re = /PE[ÇC]A\s+\d+/gi;
  const marks: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) marks.push(m.index);
  const blocos =
    marks.length >= 2
      ? marks.map((idx, i) => texto.slice(idx, i + 1 < marks.length ? marks[i + 1] : texto.length))
      : [texto];
  const carrossel: any[][] = [];
  const feed: any[][] = [];
  for (const b of blocos) {
    const ehFeed = /TEMPLATE\s*:/i.test(b) || /^\s*SLIDE\s+\d/im.test(b);
    const ehCarrossel = /KICKER\s*:|LAYOUT\s*:/i.test(b);
    try {
      if (ehFeed) {
        const r: any = parsearTextoFeedStories(b);
        feed.push(r?.slides || r || []);
      } else if (ehCarrossel) {
        const r: any = parsearTextoColado(b);
        carrossel.push(r?.slides || r || []);
      }
    } catch {
      /* ignora bloco malformado */
    }
  }
  return { carrossel, feed };
}

export default function SemanaEditor({
  onAbrirEditor,
}: {
  onAbrirEditor?: (modo: "carrossel" | "feed") => void;
}) {
  const [linha, setLinha] = useState<Linha>(() => linhaSalva());
  const [pecas, setPecas] = useState<PecaSemana[]>(() => carregar(linhaSalva()));
  const [colaAberta, setColaAberta] = useState(false);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string>("");

  useEffect(() => {
    try {
      localStorage.setItem(chaveDaLinha(linha), JSON.stringify(pecas));
    } catch {}
  }, [pecas, linha]);

  // Troca de linha editorial: guarda a escolha e recarrega o rascunho daquela linha.
  const trocarLinha = (nova: Linha) => {
    if (nova === linha) return;
    try {
      localStorage.setItem(chaveDaLinha(linha), JSON.stringify(pecas));
      localStorage.setItem(KEY_LINHA, nova);
      localStorage.removeItem(EDIT_KEY);
    } catch {}
    setLinha(nova);
    setPecas(carregar(nova));
    setAviso("Linha: " + (LINHAS.find((l) => l.id === nova)?.rotulo || nova) + ". Clique em Carregar do servidor para trazer a semana publicada.");
    setTimeout(() => setAviso(""), 7000);
  };

  // Auto-sync: ao voltar pra Semana, puxa o que foi editado (carrossel/feed/story).
  useEffect(() => { sincronizarMarcador(); /* eslint-disable-next-line */ }, []);

  const atualizar = (id: string, patch: Partial<PecaSemana>) =>
    setPecas((lista) => lista.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const aplicarCola = () => {
    try { localStorage.removeItem(EDIT_KEY); } catch {}
    const { carrossel, feed } = distribuirSemana(texto);
    setPecas((lista) => {
      const cs = lista.filter((p) => p.tipo === "carrossel");
      const fs = lista.filter((p) => p.tipo === "feed");
      return lista.map((p) => {
        if (p.tipo === "carrossel") {
          const i = cs.indexOf(p);
          if (carrossel[i]) return { ...p, slides: formatarCarrossel(carrossel[i]) };
        } else {
          const i = fs.indexOf(p);
          if (feed[i]) return { ...p, slides: feed[i] };
        }
        return p;
      });
    });
    setAviso(`Distribuido: ${carrossel.length} carrossel(eis) e ${feed.length} feed(s).`);
    setColaAberta(false);
    setTexto("");
    setTimeout(() => setAviso(""), 6000);
  };

  // Formatação padrão dos textos do carrossel ao importar (pedido do Victor):
  // Kicker 20px, Headline 88px + espaçamento 2px, Corpo 29px, Destaque 30px.
  // Aplica como base; se o slide já tiver override próprio, ele prevalece.
  const duasLinhas = (t: string) => {
    const w = String(t || "").replace(/\n/g, " ").split(/\s+/).filter(Boolean);
    if (w.length < 2) return String(t || "");
    const c = Math.ceil(w.length / 2);
    return w.slice(0, c).join(" ") + "\n" + w.slice(c).join(" ");
  };
  const formatarCarrossel = (slides: any[]) =>
    (slides || []).map((s) => ({
      ...s,
      headline: duasLinhas(s.headline),
      tipoKicker: { tamanhoPx: 20, ...(s.tipoKicker || {}) },
      tipoHeadline: { tamanhoPx: 88, tracking: 2, ...(s.tipoHeadline || {}) },
      tipoCorpo: { tamanhoPx: 29, ...(s.tipoCorpo || {}) },
      tipoDestaque: { tamanhoPx: 30, ...(s.tipoDestaque || {}) },
    }));

  const chaveDoTipo = (t: PecaTipo) => (t === "carrossel" ? KEY_CARROSSEL : KEY_FEED);
  const uid = () => Math.random().toString(36).substring(2, 10);
  const comId = (slides: any[]) => (slides || []).map((s) => (s && s.id ? s : { ...s, id: uid() }));
  const chaveMarcador = (tipo: string) => (tipo === "carrossel" ? KEY_CARROSSEL : KEY_FEED);
  const sincronizarMarcador = () => {
    try {
      const raw = localStorage.getItem(EDIT_KEY);
      if (!raw) return;
      const m = JSON.parse(raw);
      if (!m || !m.id) return;
      const ed = localStorage.getItem(chaveMarcador(m.tipo));
      if (!ed) return;
      const sl = JSON.parse(ed);
      if (!Array.isArray(sl) || !sl.length) return;
      setPecas((lista) => lista.map((p) => (p.id === m.id ? (m.tipo === "story" ? { ...p, story: sl } : { ...p, slides: sl }) : p)));
    } catch {}
  };
  const montarStory = (p: PecaSemana) => {
    if (Array.isArray(p.story) && p.story.length) return comId(p.story);
    const capa: any = (p.slides || []).find((x: any) => x && x.fotoUrl) || (p.slides || [])[0] || {};
    return [{ id: uid(), templateId: "stories_chamada", fotoUrl: capa.fotoUrl || "", kicker: capa.kicker || capa.pilula || "", headline: capa.headline || "", iconeNome: "CircleDollarSign", fotoZoom: capa.fotoZoom ?? 1, fotoOffsetX: capa.fotoOffsetX ?? 0, fotoOffsetY: capa.fotoOffsetY ?? 0, tipoRodape: "rodape_02" }];
  };
  const abrirStory = (p: PecaSemana) => {
    try {
      sincronizarMarcador();
      localStorage.setItem(KEY_FEED, JSON.stringify(montarStory(p)));
      localStorage.setItem(EDIT_KEY, JSON.stringify({ id: p.id, tipo: "story", ts: Date.now() }));
    } catch {}
    onAbrirEditor?.("feed");
  };

  const abrir = (p: PecaSemana) => {
    try {
      sincronizarMarcador();
      localStorage.setItem(chaveDoTipo(p.tipo), JSON.stringify(comId(p.slides)));
      localStorage.setItem(EDIT_KEY, JSON.stringify({ id: p.id, tipo: p.tipo, ts: Date.now() }));
    } catch {}
    onAbrirEditor?.(p.tipo);
  };

  const puxar = (p: PecaSemana) => {
    try {
      const raw = localStorage.getItem(chaveDoTipo(p.tipo));
      if (raw) {
        const slides = JSON.parse(raw);
        if (Array.isArray(slides)) {
          atualizar(p.id, { slides });
          setAviso(`"${p.titulo}" atualizado com ${slides.length} slide(s) do editor.`);
          setTimeout(() => setAviso(""), 5000);
        }
      }
    } catch {}
  };

  const [carregando, setCarregando] = useState(false);
  const carregarDoServidor = async () => {
    setCarregando(true);
    setAviso("");
    try { localStorage.removeItem(EDIT_KEY); } catch {}
    try {
      const r = await fetch(URLS_SEMANA[linha] + "?t=" + Date.now());
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      const remotas: any[] = Array.isArray(data) ? data : data.pecas || [];
      const cs = remotas.filter((p) => p.tipo === "carrossel");
      const fs = remotas.filter((p) => p.tipo === "feed");
      setPecas((lista) => {
        const locC = lista.filter((p) => p.tipo === "carrossel");
        const locF = lista.filter((p) => p.tipo === "feed");
        return lista.map((p) => {
          if (p.tipo === "carrossel") {
            const i = locC.indexOf(p);
            if (cs[i]) return { ...p, titulo: cs[i].titulo || p.titulo, slides: formatarCarrossel(cs[i].slides || []) };
          } else {
            const i = locF.indexOf(p);
            if (fs[i]) return { ...p, titulo: fs[i].titulo || p.titulo, slides: fs[i].slides || [] };
          }
          return p;
        });
      });
      setAviso(`Semana carregada do servidor: ${cs.length} carrossel(eis) e ${fs.length} feed(s).`);
    } catch (e: any) {
      setAviso("Nao consegui carregar do servidor (" + (e?.message || "erro") + "). Ainda nao ha semana publicada?");
    } finally {
      setCarregando(false);
      setTimeout(() => setAviso(""), 7000);
    }
  };

  const fotoCapa = (p: PecaSemana): string => {
    const s0 = (p.slides || []).find((x: any) => x && x.fotoUrl);
    return (s0 && (s0 as any).fotoUrl) || "";
  };

  const tituloSlide = (p: PecaSemana): string => {
    const s = (p.slides || [])[0] as any;
    if (!s) return "— vazio —";
    return (s.headline || s.kicker || s.pilula || s.subhead || "(sem titulo)").toString().replace(/\n/g, " ");
  };

  const btn = (bg: string, color: string): React.CSSProperties => ({
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    border: "1px solid #333",
    background: bg,
    color,
    whiteSpace: "nowrap",
    textAlign: "center",
    lineHeight: 1.1,
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#eee" }}>Semana Instagram</div>
          <div style={{ fontSize: 12, color: "#999" }}>
            As 5 pecas da semana num lugar so. Linha atual: <b style={{ color: "#FFC528" }}>{LINHAS.find((l) => l.id === linha)?.rotulo}</b>. Cole tudo, refine cada peca no editor e sincronize de volta.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={linha}
            onChange={(e) => trocarLinha(e.target.value as Linha)}
            style={{ ...btn("#1a1a1a", "#FFC528"), cursor: "pointer", paddingRight: 8 }}
            title="Linha editorial: cada uma tem a sua semana publicada e o seu rascunho"
          >
            {LINHAS.map((l) => (
              <option key={l.id} value={l.id}>{l.rotulo}</option>
            ))}
          </select>
          <button type="button" style={btn("#1a1a1a", "#eee")} onClick={carregarDoServidor} disabled={carregando}>
            {carregando ? "Carregando..." : "Carregar do servidor"}
          </button>
          <button type="button" style={btn("#FFC528", "#000")} onClick={() => setColaAberta((v) => !v)}>
            Colar semana
          </button>
        </div>
      </div>

      {aviso && (
        <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(52,168,83,0.15)", color: "#8fe0a5", fontSize: 12 }}>
          {aviso}
        </div>
      )}

      {colaAberta && (
        <div style={{ marginTop: 12, border: "1px solid #333", borderRadius: 10, padding: 14, background: "#141414" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#FFC528", marginBottom: 6 }}>Colar semana</div>
          <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
            Cole o conteudo unificado da semana (blocos PECA 1 a PECA 4). Pecas com TEMPLATE:/SLIDE viram Feed; com KICKER:/LAYOUT: viram Carrossel.
          </div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="PECA 1 ... / PECA 2 ... / PECA 3 (carrossel) ... / PECA 4 (carrossel) ..."
            style={{ width: "100%", minHeight: 220, background: "#0d0d0d", color: "#ddd", border: "1px solid #333", borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 12 }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button type="button" style={btn("#1a1a1a", "#ccc")} onClick={() => { setColaAberta(false); setTexto(""); }}>
              Cancelar
            </button>
            <button type="button" style={btn("#FFC528", "#000")} onClick={aplicarCola}>
              Aplicar na semana
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
        {pecas.map((p) => (
          <div key={p.id} style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 14, background: "#161616" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#eee", lineHeight: 1.25, flex: 1, minWidth: 0 }}>{p.titulo}</div>
              {p.tipo === "carrossel" && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 20,
                    background: "rgba(255,197,40,0.18)",
                    color: "#FFC528",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  + story
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 10,
                height: 120,
                borderRadius: 8,
                overflow: "hidden",
                background: "#0d0d0d",
                border: "1px solid #262626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {fotoCapa(p) ? (
                <img src={fotoCapa(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "#555", fontSize: 11 }}>sem imagem ainda</span>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#bbb", minHeight: 34 }}>
              {(p.slides || []).length} slide(s)
              <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>{tituloSlide(p)}</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button type="button" style={{ ...btn("#FFC528", "#000"), flex: 1 }} onClick={() => abrir(p)} title="Abrir os slides no editor">
                Editar
              </button>
              {p.tipo === "carrossel" && (
                <button type="button" style={btn("#1a1a1a", "#FFC528")} onClick={() => abrirStory(p)} title="Criar/editar a story-chamada deste carrossel">
                  Story
                </button>
              )}
              <button type="button" style={btn("#1a1a1a", "#ccc")} onClick={() => puxar(p)} title="Traz de volta o que voce editou no editor">
                Puxar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: "#777", lineHeight: 1.5 }}>
        Dica: "Abrir no editor" carrega a peca no editor de Carrossel/Feed (imagem, zoom, diagramacao). Ao terminar, volte e clique em "Puxar" para salvar as mudancas nesta peca.
      </div>
    </div>
  );
}
