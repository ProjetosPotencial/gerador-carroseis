import { useState, useRef, useEffect, useMemo } from "react";
import {
  Download,
  Loader2,
  ImageIcon,
  Type,
  Palette,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Clipboard,
  X,
  AlertTriangle,
  Layers,
  RefreshCcw,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Sun,
  Frame,
  MoveVertical,
  Library,
  UploadCloud,
} from "lucide-react";
import FeedSlide, {
  TEMPLATES_DISPONIVEIS,
  templateImplementado,
} from "./FeedSlide";
import {
  type FeedSlideData,
  type FeedTemplateId,
  type TemplateInfo,
  type TipoRodape,
  PARCELE_AQUI_CORES,
} from "./templates/tipos";
import { baixarCarrosselZIP, baixarSlideUnico, gerarSlideDataURL } from "../../lib/gerarCarrossel";
import {
  parsearTextoFeedStories,
  EXEMPLO_TEXTO_COLA,
} from "../../lib/parsearTextoFeed";
import UnsplashSearch from "../UnsplashSearch";
import IconePicker from "./components/IconePicker";
import { useImagens, EstiloVisualPanel, BancoPanel } from "../carrossel";
import type { FormatoImagem } from "../../lib/gerarImagem";
import { authHeaders } from "../../lib/supabaseClient";

// ============================================================
// FEED EDITOR — v7.7
// Editor de templates Feed/Stories Parcele Aqui:
//  - Lista lateral de slides (igual carrossel)
//  - Cola de texto pra criar N slides de uma vez
//  - Upload de foto por slide (sem reuso entre slides)
//  - Export único: ZIP final com todos os PNGs
// ============================================================

type Status =
  | { tipo: "idle" }
  | { tipo: "exportando"; atual: number; total: number }
  | { tipo: "sucesso"; msg: string }
  | { tipo: "erro"; msg: string };

function novoSlideVazio(templateId: FeedTemplateId = "feed_pilula_headline"): FeedSlideData {
  const tpl = TEMPLATES_DISPONIVEIS.find((t) => t.id === templateId);
  return {
    id: Math.random().toString(36).substring(2, 10),
    templateId,
    pilula: tpl?.exemplo.pilula || "",
    headline: tpl?.exemplo.headline || "",
    subhead: tpl?.exemplo.subhead || "",
    tagline: tpl?.exemplo.tagline || "",
    cta: tpl?.exemplo.cta || "",
    fotoUrl: "",
    fotoPosicao: "center",
    mostrarPilula: tpl?.exemplo.mostrarPilula ?? true,
    mostrarCTA: tpl?.exemplo.mostrarCTA ?? false,
    mostrarFooter: true,
  };
}

// ============================================================
// AUTO-SAVE — v7.7.14
// Persiste os slides do Feed/Stories no localStorage do navegador.
// Toda mudança é salva automaticamente. Quando o usuário recarrega
// a página, os slides voltam exatamente como estavam.
// ============================================================
const AUTOSAVE_KEY = "parceleaqui:feed-stories:slides:v1";

function carregarSlidesSalvos(): FeedSlideData[] | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Validação mínima: cada item tem id e templateId
    if (parsed.some((s) => !s?.id || !s?.templateId)) return null;
    return parsed as FeedSlideData[];
  } catch {
    return null;
  }
}

function salvarSlides(slides: FeedSlideData[]) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(slides));
  } catch {
    // Se localStorage estourar (5MB), ignora silenciosamente.
    // Pode acontecer se houver muitas fotos em base64; nesses casos o
    // usuário pode limpar manualmente em Console: localStorage.clear()
  }
}

export default function FeedEditor() {
  const [slides, setSlides] = useState<FeedSlideData[]>(
    () => carregarSlidesSalvos() ?? [novoSlideVazio()]
  );
  const [slideAtivoIdx, setSlideAtivoIdx] = useState(0);
  const [status, setStatus] = useState<Status>({ tipo: "idle" });
  const [colaAberta, setColaAberta] = useState(false);
  const [textoCola, setTextoCola] = useState("");
  const [avisosCola, setAvisosCola] = useState<string[]>([]);
  const [estiloAberto, setEstiloAberto] = useState(false);
  const slideRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-save — salva sempre que slides mudam
  useEffect(() => {
    salvarSlides(slides);
  }, [slides]);

  const slideAtivo = slides[slideAtivoIdx];

  const statusAdapter = useMemo(
    () => ({
      sucesso: (msg: string, ms = 3000) => {
        setStatus({ tipo: "sucesso", msg });
        setTimeout(() => setStatus({ tipo: "idle" }), ms);
      },
      erro: (msg: string) => setStatus({ tipo: "erro", msg }),
    }),
    []
  );
  const img = useImagens<FeedSlideData>({
    slides,
    setSlides,
    status: statusAdapter,
    resolverFormato: (s): FormatoImagem =>
      s.templateId.startsWith("stories") ? "stories" : "feed",
    rotularSlide: (s) => s.pilula || s.headline || "",
  });

  // Banco de imagens (paridade com o carrossel)
  const [bancoAberto, setBancoAberto] = useState(false);
  const [salvandoBanco, setSalvandoBanco] = useState(false);

  // Salva os PNGs finais no bucket slides-finais (peca = Feed/Stories por template).
  const salvarSlidesFinais = async () => {
    const arr = slides
      .map((s, i) => {
        const el = slideRefs.current.get(s.id);
        return el ? { s, i, el } : null;
      })
      .filter((x): x is { s: FeedSlideData; i: number; el: HTMLDivElement } => x !== null);
    if (arr.length !== slides.length) {
      setStatus({ tipo: "erro", msg: "Alguns slides não estão prontos. Tente em 1-2 segundos." });
      return;
    }
    setSalvandoBanco(true);
    setStatus({ tipo: "exportando", atual: 0, total: arr.length });
    let ok = 0;
    let caminho = "";
    const urls: { n: number; url: string }[] = [];
    try {
      for (let i = 0; i < arr.length; i++) {
        setStatus({ tipo: "exportando", atual: i + 1, total: arr.length });
        const { s, el } = arr[i];
        const isStories = s.templateId.startsWith("stories");
        const peca = img.banco.peca || (isStories ? "Stories" : "Feed");
        // v7.20.3: isola o slide da captura (esconde os outros) — evita toPng lento.
        arr.forEach((x, j) => { if (j !== i) x.el.style.display = "none"; });
        let dataUrl: string;
        try {
          dataUrl = await gerarSlideDataURL(el);
        } finally {
          arr.forEach((x) => { x.el.style.display = ""; });
        }
        const r = await fetch("/api/slides/salvar", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({
            png: dataUrl,
            mes: img.banco.mes,
            semana: img.banco.semana,
            peca,
            slide: i + 1,
          }),
        });
        const data = await r.json().catch(() => ({}));
        if (data.configured === false) {
          setStatus({ tipo: "erro", msg: "Repositório não configurado (defina SUPABASE_* na Vercel)." });
          setSalvandoBanco(false);
          return;
        }
        if (!r.ok || data.error) throw new Error(data.error || `Erro HTTP ${r.status}`);
        caminho = data.caminho || caminho;
        if (data.url) urls.push({ n: i + 1, url: data.url });
        ok++;
      }
      statusAdapter.sucesso(`${ok} ${ok === 1 ? "slide salvo" : "slides salvos"} em ${caminho || "slides-finais"}.`, 5000);
      // v7.20: copia as artes pra pasta da semana no Drive + Slack de aprovação
      try {
        const rf = await fetch("/api/slides/finalizar", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({
            mes: img.banco.mes,
            semana: img.banco.semana,
            peca: img.banco.peca || "Feed",
            slides: urls,
          }),
        });
        const df = await rf.json().catch(() => ({}));
        if (df && df.configured !== false && df.driveUrl) {
          statusAdapter.sucesso(`Artes salvas no Drive (${df.salvos}). Link enviado no Slack pra aprovação.`, 7000);
        }
      } catch {}
    } catch (e: any) {
      setStatus({ tipo: "erro", msg: e?.message || "Falha ao salvar os slides." });
    } finally {
      setSalvandoBanco(false);
    }
  };

  const atualizarSlide = (patch: Partial<FeedSlideData>) => {
    setSlides((s) =>
      s.map((slide, i) => (i === slideAtivoIdx ? { ...slide, ...patch } : slide))
    );
  };

  const adicionarSlide = () => {
    const novo = novoSlideVazio(slideAtivo?.templateId || "feed_pilula_headline");
    setSlides([...slides, novo]);
    setSlideAtivoIdx(slides.length);
  };

  const duplicarSlide = (idx: number) => {
    const slide = slides[idx];
    const copia = { ...slide, id: Math.random().toString(36).substring(2, 10) };
    const novosSlides = [...slides];
    novosSlides.splice(idx + 1, 0, copia);
    setSlides(novosSlides);
  };

  const removerSlide = (idx: number) => {
    if (slides.length === 1) {
      setStatus({ tipo: "erro", msg: "Mantenha pelo menos 1 slide." });
      setTimeout(() => setStatus({ tipo: "idle" }), 2000);
      return;
    }
    const novosSlides = slides.filter((_, i) => i !== idx);
    setSlides(novosSlides);
    if (slideAtivoIdx >= novosSlides.length) {
      setSlideAtivoIdx(novosSlides.length - 1);
    }
  };

  const aplicarColaTexto = () => {
    const { slides: novos, avisos } = parsearTextoFeedStories(textoCola);
    setAvisosCola(avisos);
    if (novos.length > 0) {
      setSlides(novos);
      setSlideAtivoIdx(0);
      setColaAberta(false);
      setTextoCola("");
      setStatus({
        tipo: "sucesso",
        msg: `${novos.length} slide${novos.length > 1 ? "s" : ""} criado${novos.length > 1 ? "s" : ""} a partir do texto colado!`,
      });
      setTimeout(() => setStatus({ tipo: "idle" }), 3500);
    }
  };

  const exportarZIP = async () => {
    // Filtra só slides com template implementado
    const slidesValidos = slides
      .map((s, i) => ({ slide: s, idx: i }))
      .filter(({ slide }) => templateImplementado(slide.templateId));

    if (slidesValidos.length === 0) {
      setStatus({
        tipo: "erro",
        msg: "Nenhum slide com template implementado pra exportar.",
      });
      return;
    }

    if (slidesValidos.length < slides.length) {
      const nPulados = slides.length - slidesValidos.length;
      setStatus({
        tipo: "exportando",
        atual: 0,
        total: slidesValidos.length,
      });
      console.warn(`Pulando ${nPulados} slides com templates ainda não implementados.`);
    }

    const slideRefsArr = slidesValidos
      .map(({ slide, idx }) => {
        const el = slideRefs.current.get(slide.id);
        if (!el) return null;
        return { index: idx, element: el };
      })
      .filter((x): x is { index: number; element: HTMLDivElement } => x !== null);

    if (slideRefsArr.length === 0) {
      setStatus({ tipo: "erro", msg: "Erro: refs não montados." });
      return;
    }

    setStatus({ tipo: "exportando", atual: 0, total: slideRefsArr.length });
    const dataIso = new Date().toISOString().slice(0, 10);
    const ok = await baixarCarrosselZIP({
      slides: slideRefsArr,
      nomeBase: `parceleaqui-feed-${dataIso}`,
      onProgress: (atual, total) =>
        setStatus({ tipo: "exportando", atual, total }),
    });
    if (ok) {
      setStatus({
        tipo: "sucesso",
        msg: `ZIP baixado com ${slideRefsArr.length} PNGs!`,
      });
      setTimeout(() => setStatus({ tipo: "idle" }), 3500);
    } else {
      setStatus({ tipo: "erro", msg: "Erro ao gerar ZIP. Tente de novo." });
    }
  };

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ tipo: "erro", msg: "Imagem muito grande (máx 10MB)." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      atualizarSlide({ fotoUrl: url, fotoOrigem: "manual", imgStatus: "idle", imgErro: undefined });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", backgroundColor: "#0f0f0f" }}>
      <div style={{ maxWidth: 1700, margin: "0 auto", padding: 24, color: "#fff" }}>
        {/* TOPBAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: 0,
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Feed & Stories · Parcele Aqui
            </h2>
            <p
              style={{
                fontSize: 11,
                color: "#888",
                margin: 0,
                marginTop: 4,
                fontFamily: "Poppins, sans-serif",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {slides.length} slide{slides.length !== 1 ? "s" : ""} · Tipografia Kufam · <span style={{ color: "#10b981" }}>● Auto-save ativo</span>
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Tem certeza? Isso vai apagar TODOS os slides e começar do zero. Os textos, fotos e ajustes serão perdidos."
                  )
                ) {
                  setSlides([novoSlideVazio()]);
                  setSlideAtivoIdx(0);
                  try {
                    localStorage.removeItem(AUTOSAVE_KEY);
                  } catch {}
                }
              }}
              style={btnStyle("#1F2937", "#ccc", "#374151")}
              title="Apaga todos os slides salvos e começa do zero"
            >
              <Trash2 size={14} /> Limpar tudo
            </button>
            <button
              onClick={() => setColaAberta(true)}
              style={btnStyle("#1F2937", "#fff", "#374151")}
            >
              <Clipboard size={14} /> Colar texto em lote
            </button>
            <button
              onClick={() => setEstiloAberto((v) => !v)}
              style={btnStyle(estiloAberto ? "#FFC528" : "#1F2937", estiloAberto ? "#000" : "#fff", "#374151")}
              title="Estética global aplicada a todas as imagens geradas por IA"
            >
              <Sparkles size={14} /> Estilo visual
            </button>
            <button
              onClick={() => setBancoAberto((v) => !v)}
              style={btnStyle(bancoAberto ? "#FFC528" : "#1F2937", bancoAberto ? "#000" : "#fff", "#374151")}
              title="Etiquetas + repositório de imagens (Supabase)"
            >
              <Library size={14} /> Banco de imagens
            </button>
            <button
              onClick={img.gerarLote}
              disabled={img.gerandoLote || img.slidesPendentes === 0}
              style={{
                ...btnStyle("#1F2937", "#FFC528", "#5b4a12"),
                opacity: img.gerandoLote || img.slidesPendentes === 0 ? 0.45 : 1,
              }}
              title={img.slidesPendentes === 0 ? "Nenhum slide com IMGPROMPT pendente" : "Gera a imagem de todos os slides com IMGPROMPT sem foto"}
            >
              {img.gerandoLote ? (
                <>
                  <Loader2 size={14} className="animate-spin" />{" "}
                  {img.progresso ? `Gerando ${img.progresso.atual} de ${img.progresso.total}` : "Gerando…"}
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Gerar imagens (IA){img.slidesPendentes > 0 ? ` (${img.slidesPendentes})` : ""}
                </>
              )}
            </button>
            <button
              onClick={salvarSlidesFinais}
              disabled={salvandoBanco}
              style={{ ...btnStyle("#1F2937", "#FFC528", "#5b4a12"), opacity: salvandoBanco ? 0.45 : 1 }}
              title="Renderiza os slides e salva no repositório (bucket slides-finais)"
            >
              {salvandoBanco ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Salvando…
                </>
              ) : (
                <>
                  <UploadCloud size={14} /> Salvar slides
                </>
              )}
            </button>
            <button onClick={exportarZIP} disabled={status.tipo === "exportando"} style={btnStyle("#FFC528", "#000")}>
              {status.tipo === "exportando" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Gerando {status.atual}/{status.total}...
                </>
              ) : (
                <>
                  <Download size={14} /> Baixar ZIP ({slides.length} slide{slides.length !== 1 ? "s" : ""})
                </>
              )}
            </button>
          </div>
        </div>

        {estiloAberto && (
          <div style={{ marginBottom: 16 }}>
            <EstiloVisualPanel img={img} onFechar={() => setEstiloAberto(false)} />
          </div>
        )}

        {bancoAberto && (
          <div style={{ marginBottom: 16 }}>
            <BancoPanel
              img={img}
              slideAtivoNum={slideAtivoIdx + 1}
              onUsarNoSlide={(url) =>
                atualizarSlide({ fotoUrl: url, fotoOrigem: "manual", imgStatus: "ok", imgErro: undefined })
              }
              onFechar={() => setBancoAberto(false)}
            />
          </div>
        )}

        {img.gerandoLote && img.progresso && (
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: "#141414", border: "1px solid rgba(255,197,40,0.3)", display: "flex", alignItems: "center", gap: 14 }}>
            <Loader2 size={20} className="animate-spin" color="#FFC528" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  Gerando imagem {img.progresso.atual} de {img.progresso.total}
                </span>
                <span style={{ fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {img.progresso.rotulo}
                </span>
              </div>
              <div style={{ width: "100%", height: 8, background: "#0a0a0a", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#FFC528", width: `${Math.round((img.progresso.atual / img.progresso.total) * 100)}%`, transition: "width 200ms" }} />
              </div>
            </div>
            <button
              onClick={img.cancelarLote}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 6, fontSize: 13, fontWeight: 700, background: "#1a1a1a", border: "1px solid #444", color: "#ccc", cursor: "pointer", flexShrink: 0 }}
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        )}

        {/* STATUS BAR */}
        {status.tipo !== "idle" && status.tipo !== "exportando" && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              marginBottom: 16,
              backgroundColor:
                status.tipo === "sucesso"
                  ? "rgba(16, 185, 129, 0.12)"
                  : "rgba(239, 68, 68, 0.12)",
              color: status.tipo === "sucesso" ? "#10b981" : "#ef4444",
              fontSize: 13,
              fontFamily: "Poppins, sans-serif",
            }}
          >
            {status.msg}
          </div>
        )}

        {/* GRID 3 COLUNAS: lista | preview | edição */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr 380px",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* ===== COLUNA 1: LISTA DE SLIDES ===== */}
          <aside
            style={{
              backgroundColor: "#141414",
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: 12,
              maxHeight: "calc(100vh - 140px)",
              overflowY: "auto",
              position: "sticky",
              top: 80,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0 4px 8px",
              }}
            >
              <Layers size={12} /> Slides ({slides.length})
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {slides.map((s, i) => {
                const ativo = i === slideAtivoIdx;
                const tplInfo = TEMPLATES_DISPONIVEIS.find((t) => t.id === s.templateId);
                const implementado = templateImplementado(s.templateId);

                return (
                  <button
                    key={s.id}
                    onClick={() => setSlideAtivoIdx(i)}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: ativo ? "1.5px solid #FFC528" : "1px solid #2a2a2a",
                      backgroundColor: ativo ? "rgba(255, 197, 40, 0.08)" : "#0f0f0f",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      fontFamily: "Poppins, sans-serif",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: ativo ? "#FFC528" : "#999",
                        }}
                      >
                        Slide {i + 1}
                        {!implementado && (
                          <span
                            style={{
                              marginLeft: 6,
                              padding: "1px 6px",
                              borderRadius: 4,
                              backgroundColor: "rgba(239, 68, 68, 0.15)",
                              color: "#ef4444",
                              fontSize: 9,
                            }}
                          >
                            EM BREVE
                          </span>
                        )}
                      </span>
                      <div style={{ display: "flex", gap: 2 }}>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label="Duplicar slide"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicarSlide(i);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              duplicarSlide(i);
                            }
                          }}
                          style={{
                            padding: 3,
                            color: "#666",
                            cursor: "pointer",
                            display: "flex",
                            border: "none",
                            background: "transparent",
                          }}
                          title="Duplicar"
                        >
                          <Copy size={11} />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label="Baixar este slide"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const el = slideRefs.current.get(s.id);
                            if (!el) return;
                            const tplFmt = tplInfo?.formato === "stories" ? "stories" : "feed";
                            const dataIso = new Date().toISOString().slice(0, 10);
                            await baixarSlideUnico(
                              el,
                              `parceleaqui-${tplFmt}-${String(i + 1).padStart(2, "0")}-${dataIso}.png`
                            );
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              const el = slideRefs.current.get(s.id);
                              if (!el) return;
                              const tplFmt = tplInfo?.formato === "stories" ? "stories" : "feed";
                              const dataIso = new Date().toISOString().slice(0, 10);
                              await baixarSlideUnico(
                                el,
                                `parceleaqui-${tplFmt}-${String(i + 1).padStart(2, "0")}-${dataIso}.png`
                              );
                            }
                          }}
                          style={{
                            padding: 3,
                            color: "#FFC528",
                            cursor: "pointer",
                            display: "flex",
                            border: "none",
                            background: "transparent",
                          }}
                          title="Baixar este slide (PNG)"
                        >
                          <Download size={11} />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label="Remover slide"
                          onClick={(e) => {
                            e.stopPropagation();
                            removerSlide(i);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              removerSlide(i);
                            }
                          }}
                          style={{
                            padding: 3,
                            color: "#666",
                            cursor: "pointer",
                            display: "flex",
                          }}
                          title="Remover"
                        >
                          <Trash2 size={11} />
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#bbb", lineHeight: 1.3 }}>
                      {s.headline || tplInfo?.nome || "(sem texto)"}
                    </div>
                    <div style={{ fontSize: 10, color: "#666", lineHeight: 1.2 }}>
                      {tplInfo?.formato === "stories" ? "Stories 9:16" : "Feed 4:5"}
                      {!s.fotoUrl && " · sem foto"}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={adicionarSlide}
              style={{
                width: "100%",
                marginTop: 10,
                padding: 10,
                borderRadius: 8,
                border: "1px dashed #2a2a2a",
                background: "transparent",
                color: "#888",
                fontSize: 12,
                fontFamily: "Poppins, sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Plus size={12} /> Novo slide
            </button>
          </aside>

          {/* ===== COLUNA 2: PREVIEW ===== */}
          <div
            style={{
              backgroundColor: "#141414",
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: 16,
              minHeight: 600,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#666",
                marginBottom: 12,
                fontFamily: "Poppins, sans-serif",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Preview · Slide {slideAtivoIdx + 1} de {slides.length}
            </div>
            {slideAtivo && <PreviewSlide slide={slideAtivo} onSlideChange={atualizarSlide} />}

            {slideAtivo && !templateImplementado(slideAtivo.templateId) && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#fca5a5",
                  fontSize: 12,
                  fontFamily: "Poppins, sans-serif",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Template em construção.</strong> Este slide não será incluído no
                  ZIP final. Use IPVA Feed, IPVA Stories ou Rotativo Feed na v7.7.
                </div>
              </div>
            )}
          </div>

          {/* ===== COLUNA 3: PAINEL DE EDIÇÃO ===== */}
          {slideAtivo && (
            <PainelEdicao
              slide={slideAtivo}
              onChange={atualizarSlide}
              onUploadFoto={handleUploadFoto}
              onGerarImagem={(forcar) => img.gerarSlide(slideAtivo.id, { forcar })}
            />
          )}
        </div>

        {/* SLIDES OCULTOS EM ESCALA REAL (pra captura PNG no ZIP) */}
        <div
          style={{
            position: "fixed",
            left: -10000,
            top: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
          aria-hidden
        >
          {slides.map((s) => (
            <div
              key={s.id}
              ref={(el) => {
                if (el) slideRefs.current.set(s.id, el);
                else slideRefs.current.delete(s.id);
              }}
            >
              <FeedSlide slide={s} escala={1} />
            </div>
          ))}
        </div>
      </div>

      {/* MODAL COLA TEXTO */}
      {colaAberta && (
        <ModalColaTexto
          texto={textoCola}
          setTexto={setTextoCola}
          avisos={avisosCola}
          onAplicar={aplicarColaTexto}
          onFechar={() => {
            setColaAberta(false);
            setAvisosCola([]);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// PREVIEW (renderiza slide ativo em escala 0.5)
// ============================================================
function PreviewSlide({
  slide,
  onSlideChange,
}: {
  slide: FeedSlideData;
  onSlideChange?: (patch: Partial<FeedSlideData>) => void;
}) {
  const tplInfo = TEMPLATES_DISPONIVEIS.find((t) => t.id === slide.templateId);
  const ehStories = tplInfo?.formato === "stories";
  const escala = ehStories ? 0.36 : 0.5;
  const w = 1080 * escala;
  const h = (ehStories ? 1920 : 1350) * escala;

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: w,
          height: h,
          overflow: "hidden",
          borderRadius: 8,
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        <FeedSlide slide={slide} escala={escala} onSlideChange={onSlideChange} />
      </div>
    </div>
  );
}

// ============================================================
// PAINEL DE EDIÇÃO
// ============================================================
function PainelEdicao({
  slide,
  onChange,
  onUploadFoto,
  onGerarImagem,
}: {
  slide: FeedSlideData;
  onChange: (patch: Partial<FeedSlideData>) => void;
  onUploadFoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGerarImagem?: (forcar?: boolean) => void;
}) {
  const tplInfo = TEMPLATES_DISPONIVEIS.find((t) => t.id === slide.templateId);
  const camposUsados = tplInfo?.camposUsados || [];

  const usaPilula = camposUsados.includes("pilula");
  const usaHeadline = camposUsados.includes("headline");
  const usaSubhead = camposUsados.includes("subhead");
  const usaTagline = camposUsados.includes("tagline");
  const usaCTA = camposUsados.includes("cta");
  const usaFoto = camposUsados.includes("foto");

  return (
    <aside
      style={{
        backgroundColor: "#141414",
        borderRadius: 12,
        border: "1px solid #2a2a2a",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        maxHeight: "calc(100vh - 140px)",
        overflowY: "auto",
        position: "sticky",
        top: 80,
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* TEMPLATE */}
      <Secao titulo="Template" icone={<Type size={12} />}>
        <select
          value={slide.templateId}
          onChange={(e) => {
            const novoTplId = e.target.value as FeedTemplateId;
            const novoTpl = TEMPLATES_DISPONIVEIS.find((t) => t.id === novoTplId);
            if (novoTpl) {
              onChange({
                ...novoTpl.exemplo,
                fotoUrl: slide.fotoUrl, // preserva foto
              });
            }
          }}
          style={selectStyle}
        >
          <optgroup label="✓ Implementados">
            {TEMPLATES_DISPONIVEIS.filter((t) => templateImplementado(t.id)).map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </optgroup>
          <optgroup label="⏳ Em construção">
            {TEMPLATES_DISPONIVEIS.filter((t) => !templateImplementado(t.id)).map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </optgroup>
        </select>
        <p
          style={{
            fontSize: 10,
            color: "#888",
            marginTop: 8,
            fontStyle: "italic",
          }}
        >
          {tplInfo?.descricao}
        </p>
      </Secao>

      {/* TEXTOS */}
      <Secao titulo="Textos" icone={<Type size={12} />}>
        {usaPilula && (
          <Campo
            label="Pílula superior"
            valor={slide.pilula || ""}
            onChange={(v) => onChange({ pilula: v })}
            maxLen={40}
          />
        )}
        {usaHeadline && (
          <Campo
            label="Headline"
            valor={slide.headline || ""}
            onChange={(v) => onChange({ headline: v })}
            maxLen={30}
          />
        )}
        {usaSubhead && (
          <Campo
            label="Subhead"
            valor={slide.subhead || ""}
            onChange={(v) => onChange({ subhead: v })}
            maxLen={40}
          />
        )}
        {usaTagline && (
          <Campo
            label="Tagline"
            valor={slide.tagline || ""}
            onChange={(v) => onChange({ tagline: v })}
            maxLen={120}
            multiline
          />
        )}
        {usaCTA && (
          <Campo
            label="Botão (CTA)"
            valor={slide.cta || ""}
            onChange={(v) => onChange({ cta: v })}
            maxLen={30}
          />
        )}
      </Secao>

      {/* CORES */}
      <Secao titulo="Cores dos textos" icone={<Palette size={12} />}>
        <CorPicker
          label="Headline"
          valor={slide.corHeadline}
          fallback={PARCELE_AQUI_CORES.amareloPrincipal}
          onChange={(v) => onChange({ corHeadline: v })}
        />
        <CorPicker
          label="Subhead/Tag"
          valor={slide.corSubhead}
          fallback={PARCELE_AQUI_CORES.cremeFooter}
          onChange={(v) => onChange({ corSubhead: v })}
        />
        <button
          onClick={() => onChange({ corHeadline: undefined, corSubhead: undefined })}
          style={{
            marginTop: 4,
            fontSize: 10,
            color: "#888",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <RotateCcw size={10} /> Resetar cores
        </button>
      </Secao>

      {/* TAMANHO */}
      <Secao titulo="Tamanho geral" icone={<Type size={12} />}>
        <input
          type="range"
          min={70}
          max={140}
          step={5}
          value={Math.round((slide.escalaGeral ?? 1) * 100)}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10) / 100;
            onChange({ escalaGeral: v === 1 ? undefined : v });
          }}
          style={{ width: "100%", accentColor: "#FFC528" }}
        />
        <div style={{ fontSize: 11, color: "#888", textAlign: "center" }}>
          {Math.round((slide.escalaGeral ?? 1) * 100)}%
        </div>
      </Secao>

      {/* POSIÇÃO VERTICAL DO BLOCO — v7.7.17 */}
      <Secao titulo="Posição vertical do bloco" icone={<MoveVertical size={12} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 10, color: "#666", margin: 0, lineHeight: 1.4, fontFamily: "Poppins, sans-serif" }}>
            Move TODO o bloco de texto pra cima (-) ou pra baixo (+). 8pt grid.
          </p>
          <input
            type="range"
            min={-200}
            max={200}
            step={8}
            value={slide.offsetYBloco ?? 0}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              onChange({ offsetYBloco: v === 0 ? undefined : v });
            }}
            style={{ width: "100%", accentColor: "#FFC528" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666" }}>
            <span>-200px</span>
            <span style={{ color: slide.offsetYBloco ? "#FFC528" : "#888", fontWeight: 600 }}>
              {slide.offsetYBloco === undefined || slide.offsetYBloco === 0
                ? "0 (default)"
                : `${slide.offsetYBloco > 0 ? "+" : ""}${slide.offsetYBloco}px`}
            </span>
            <span>+200px</span>
          </div>
          {slide.offsetYBloco !== undefined && slide.offsetYBloco !== 0 && (
            <button
              onClick={() => onChange({ offsetYBloco: undefined })}
              style={{
                fontSize: 10,
                color: "#888",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                alignSelf: "flex-start",
              }}
            >
              <RotateCcw size={10} /> Resetar posição
            </button>
          )}
        </div>
      </Secao>

      {/* TIPOGRAFIA AVANÇADA — usando padrão Secao normal (v7.7.13) */}
      <Secao titulo="Tipografia avançada" icone={<Type size={12} />}>
        <ConteudoTipografia slide={slide} onChange={onChange} camposUsados={camposUsados} />
      </Secao>

      {/* ESPAÇAMENTOS — só pra templates _icone_cta */}
      {slide.templateId.endsWith("_icone_cta") && (
        <Secao titulo="Espaçamentos" icone={<Layers size={12} />}>
          <ConteudoEspacamentos slide={slide} onChange={onChange} />
        </Secao>
      )}

      {/* ÍCONE — só pra templates que usam ícone */}
      {(slide.templateId.endsWith("_icone_cta") || slide.templateId === "rotativo_feed") && (
        <Secao titulo="Ícone" icone={<RefreshCcw size={12} />}>
          <Toggle
            label="Mostrar ícone"
            ativo={slide.mostrarIcone !== false}
            onChange={(v) => onChange({ mostrarIcone: v })}
          />
          {slide.mostrarIcone !== false && (
            <>
              <div style={{ marginTop: 8 }}>
                <IconePicker
                  valor={slide.iconeNome}
                  onChange={(v) => onChange({ iconeNome: v })}
                  defaultNome="RefreshCcw"
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 11, color: "#bbb", display: "block", marginBottom: 4 }}>
                  Tamanho do ícone: {slide.tamIcone ?? 120}px
                </label>
                <input
                  type="range"
                  min={48}
                  max={200}
                  step={4}
                  value={slide.tamIcone ?? 120}
                  onChange={(e) => onChange({ tamIcone: parseInt(e.target.value, 10) })}
                  style={{ width: "100%", accentColor: "#FFC528" }}
                />
              </div>
              <div style={{ marginTop: 6 }}>
                <label style={{ fontSize: 11, color: "#bbb", display: "block", marginBottom: 4 }}>
                  Espessura do traço: {(slide.espessuraIcone ?? 2).toFixed(1)}
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.25}
                  value={slide.espessuraIcone ?? 2}
                  onChange={(e) =>
                    onChange({ espessuraIcone: parseFloat(e.target.value) })
                  }
                  style={{ width: "100%", accentColor: "#FFC528" }}
                />
              </div>
              <CorPicker
                label="Cor do ícone"
                valor={slide.corIcone}
                fallback="#FFFFFF"
                onChange={(v) => onChange({ corIcone: v })}
              />
            </>
          )}
        </Secao>
      )}

      {/* FOTO */}
      {usaFoto && (
        <Secao titulo="Foto deste slide" icone={<ImageIcon size={12} />}>
          <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: "#0f0f0f", border: "1px solid rgba(255,197,40,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Sparkles size={13} color="#FFC528" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>Imagem por IA</span>
              {slide.fotoOrigem === "ia" && slide.fotoUrl && (
                <span style={{ marginLeft: "auto", fontSize: 9, color: "#34d399", fontWeight: 700 }}>✓ Gerada</span>
              )}
            </div>
            <textarea
              value={slide.imgPrompt || ""}
              onChange={(e) => onChange({ imgPrompt: e.target.value })}
              rows={3}
              placeholder="Descreva só a CENA: quem, onde, enquadramento…"
              style={{ width: "100%", background: "#141414", border: "1px solid #333", borderRadius: 6, padding: 8, fontSize: 12, color: "#fff", resize: "vertical", fontFamily: "Poppins, sans-serif", boxSizing: "border-box" }}
            />
            <p style={{ fontSize: 10, color: "#777", margin: "6px 0 0" }}>Estética e proporção vêm do "Estilo visual" global. Aqui só a cena.</p>
            {slide.imgStatus === "erro" && slide.imgErro && (
              <div style={{ marginTop: 8, fontSize: 10, color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "6px 8px", display: "flex", gap: 6 }}>
                <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{slide.imgErro}</span>
              </div>
            )}
            <button
              onClick={() => onGerarImagem?.(slide.fotoOrigem === "ia")}
              disabled={slide.imgStatus === "gerando" || !(slide.imgPrompt || "").trim()}
              style={{ marginTop: 8, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 8, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", border: slide.fotoOrigem === "ia" && slide.fotoUrl ? "1px solid #444" : "none", background: slide.fotoOrigem === "ia" && slide.fotoUrl ? "#1a1a1a" : "#FFC528", color: slide.fotoOrigem === "ia" && slide.fotoUrl ? "#eee" : "#000", opacity: slide.imgStatus === "gerando" || !(slide.imgPrompt || "").trim() ? 0.45 : 1 }}
            >
              {slide.imgStatus === "gerando" ? (<><Loader2 size={13} className="animate-spin" /> Gerando…</>) : slide.fotoOrigem === "ia" && slide.fotoUrl ? (<><RefreshCcw size={13} /> Regerar variação</>) : (<><Sparkles size={13} /> Gerar imagem</>)}
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={onUploadFoto}
            style={{ fontSize: 11, color: "#bbb", width: "100%" }}
          />
          <div style={{ marginTop: 10 }}>
            <UnsplashSearch
              grupoIndex={0}
              valorAtual={slide.fotoUrl || ""}
              onSelectImage={(url) =>
                onChange({ fotoUrl: url, fotoOrigem: "manual", imgStatus: "idle", imgErro: undefined })
              }
            />
          </div>
          {slide.fotoUrl && (
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 11, color: "#999" }}>Posição:</label>
              <select
                value={slide.fotoPosicao || "center"}
                onChange={(e) => onChange({ fotoPosicao: e.target.value })}
                style={{ ...selectStyle, marginTop: 4 }}
              >
                <option value="center">Centro</option>
                <option value="top">Topo</option>
                <option value="bottom">Inferior</option>
                <option value="left">Esquerda</option>
                <option value="right">Direita</option>
              </select>

              {/* Zoom da foto — v7.7.21: aplicado em todos templates que usam foto */}
              {camposUsados.includes("foto") && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #2a2a2a" }}>
                  <label style={{ fontSize: 11, color: "#bbb", display: "block", marginBottom: 4 }}>
                    Zoom da foto: {((slide.fotoZoom ?? 1) * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={slide.fotoZoom ?? 1}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      onChange({ fotoZoom: v === 1 ? undefined : v });
                    }}
                    style={{ width: "100%", accentColor: "#FFC528" }}
                  />
                  <p
                    style={{
                      fontSize: 10,
                      color: "#666",
                      margin: "4px 0 0 0",
                      lineHeight: 1.4,
                      fontFamily: "Poppins, sans-serif",
                      fontStyle: "italic",
                    }}
                  >
                    {"💡 Arraste a foto no preview pra reposicionar · role o scroll pra dar zoom (nunca passa da borda)"}
                  </p>
                  {((slide.fotoZoom ?? 1) !== 1 ||
                    (slide.fotoOffsetX ?? 0) !== 0 ||
                    (slide.fotoOffsetY ?? 0) !== 0) && (
                    <button
                      onClick={() =>
                        onChange({
                          fotoZoom: undefined,
                          fotoOffsetX: undefined,
                          fotoOffsetY: undefined,
                        })
                      }
                      style={{
                        marginTop: 8,
                        fontSize: 10,
                        color: "#888",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >
                      <RotateCcw size={10} /> Resetar enquadramento
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => onChange({ fotoUrl: "" })}
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  color: "#ef4444",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <X size={11} /> Remover foto deste slide
              </button>
            </div>
          )}
        </Secao>
      )}

      {/* RODAPÉ — v7.7.6 (seletor 2 cards com thumbnail) */}
      <Secao titulo="Rodapé" icone={<Frame size={12} />}>
        <SeletorRodape
          valor={slide.tipoRodape ?? defaultRodapeDoTemplate(slide.templateId)}
          formato={slide.templateId.startsWith("stories_") ? "stories" : "feed"}
          onChange={(v) => onChange({ tipoRodape: v })}
        />
        <Toggle
          label="Mostrar rodapé"
          ativo={slide.mostrarFooter !== false}
          onChange={(v) => onChange({ mostrarFooter: v })}
        />
      </Secao>

      {/* TEXTURA — v7.7.6 (toggle + slider opacidade) */}
      <Secao titulo="Textura granulada" icone={<Sparkles size={12} />}>
        <Toggle
          label="Aplicar textura overlay"
          ativo={slide.mostrarTextura !== false}
          onChange={(v) => onChange({ mostrarTextura: v })}
        />
        {slide.mostrarTextura !== false && (
          <div style={{ marginTop: 8 }}>
            <label
              style={{ fontSize: 11, color: "#bbb", display: "block", marginBottom: 4 }}
            >
              Opacidade: {Math.round((slide.opacidadeTextura ?? 0.75) * 100)}%
            </label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={slide.opacidadeTextura ?? 0.75}
              onChange={(e) =>
                onChange({ opacidadeTextura: parseFloat(e.target.value) })
              }
              style={{ width: "100%", accentColor: "#FFC528" }}
            />
            <p style={{ fontSize: 10, color: "#666", marginTop: 4, lineHeight: 1.4 }}>
              A textura nunca invade o rodapé — fica clipada acima dele.
            </p>
          </div>
        )}
      </Secao>

      {/* GRADIENTE DE LEITURA — v7.7.6 (toggle + slider opacidade) */}
      <Secao titulo="Gradiente de leitura" icone={<Sun size={12} />}>
        <Toggle
          label="Escurecer base da foto"
          ativo={slide.mostrarGradienteLeitura !== false}
          onChange={(v) => onChange({ mostrarGradienteLeitura: v })}
        />
        {slide.mostrarGradienteLeitura !== false && (
          <div style={{ marginTop: 8 }}>
            <label
              style={{ fontSize: 11, color: "#bbb", display: "block", marginBottom: 4 }}
            >
              Opacidade: {Math.round((slide.opacidadeGradienteLeitura ?? 0.5) * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={slide.opacidadeGradienteLeitura ?? 0.5}
              onChange={(e) =>
                onChange({ opacidadeGradienteLeitura: parseFloat(e.target.value) })
              }
              style={{ width: "100%", accentColor: "#FFC528" }}
            />
            <p style={{ fontSize: 10, color: "#666", marginTop: 4, lineHeight: 1.4 }}>
              Gradiente preto→transparente entre foto e textos pra dar leitura. Não
              invade o rodapé.
            </p>
          </div>
        )}
      </Secao>

      {/* VISIBILIDADE — só aparece se template tem pílula ou CTA pra alternar */}
      {(usaPilula || usaCTA) && (
        <Secao titulo="Elementos visíveis" icone={<Type size={12} />}>
          {usaPilula && (
            <Toggle
              label="Pílula superior"
              ativo={slide.mostrarPilula !== false}
              onChange={(v) => onChange({ mostrarPilula: v })}
            />
          )}
          {usaCTA && (
            <Toggle
              label="Botão CTA"
              ativo={slide.mostrarCTA !== false}
              onChange={(v) => onChange({ mostrarCTA: v })}
            />
          )}
        </Secao>
      )}
    </aside>
  );
}

// ============================================================
// MODAL COLA TEXTO
// ============================================================
function ModalColaTexto({
  texto,
  setTexto,
  avisos,
  onAplicar,
  onFechar,
}: {
  texto: string;
  setTexto: (t: string) => void;
  avisos: string[];
  onAplicar: () => void;
  onFechar: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
        fontFamily: "Poppins, sans-serif",
      }}
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#141414",
          borderRadius: 12,
          border: "1px solid #2a2a2a",
          maxWidth: 800,
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #2a2a2a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
              Colar texto em lote
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#888", marginTop: 4 }}>
              Cole vários posts de uma vez separados por <code style={{ color: "#FFC528" }}>---</code>
            </p>
          </div>
          <button
            onClick={onFechar}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: 20,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <button
            onClick={() => setTexto(EXEMPLO_TEXTO_COLA)}
            style={{
              alignSelf: "flex-start",
              fontSize: 11,
              color: "#FFC528",
              background: "none",
              border: "1px solid #FFC528",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            ↓ Inserir exemplo de formato
          </button>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={EXEMPLO_TEXTO_COLA}
            rows={20}
            style={{
              width: "100%",
              padding: 12,
              backgroundColor: "#0f0f0f",
              color: "#fff",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              lineHeight: 1.5,
              resize: "vertical",
            }}
          />

          {avisos.length > 0 && (
            <div
              style={{
                padding: 12,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 8,
                fontSize: 12,
                color: "#fca5a5",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              <strong style={{ display: "block", marginBottom: 6 }}>Avisos:</strong>
              {avisos.map((a, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  • {a}
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>
            <strong style={{ color: "#aaa" }}>Templates válidos:</strong>{" "}
            <code style={{ color: "#FFC528" }}>feed_pilula_headline</code>,{" "}
            <code style={{ color: "#FFC528" }}>stories_pilula_headline</code>,{" "}
            <code style={{ color: "#FFC528" }}>feed_icone_cta</code>,{" "}
            <code style={{ color: "#FFC528" }}>stories_icone_cta</code>
            <br />
            <strong style={{ color: "#aaa" }}>Campos:</strong>{" "}
            <code>TEMPLATE</code>, <code>PILULA</code>, <code>HEADLINE</code>,{" "}
            <code>SUBHEAD</code>, <code>TAGLINE</code>, <code>CTA</code>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #2a2a2a",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button onClick={onFechar} style={btnStyle("#1F2937", "#fff", "#374151")}>
            Cancelar
          </button>
          <button
            onClick={onAplicar}
            disabled={!texto.trim()}
            style={{
              ...btnStyle("#FFC528", "#000"),
              opacity: !texto.trim() ? 0.4 : 1,
            }}
          >
            <Clipboard size={14} /> Criar slides
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS UI (compartilhados)
// ============================================================
const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  backgroundColor: "#0f0f0f",
  color: "#fff",
  border: "1px solid #2a2a2a",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "Poppins, sans-serif",
};

function btnStyle(bg: string, color: string, hover?: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    backgroundColor: bg,
    color,
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "Poppins, sans-serif",
  };
}

// ============================================================
// SELETOR DE RODAPÉ — v7.7.6
// ============================================================
/**
 * Default de rodapé baseado no template:
 *  - feed_icone_cta / stories_icone_cta → rodape_01 (amarelo cheio)
 *  - todos os outros → rodape_02 (creme com curva)
 */
function defaultRodapeDoTemplate(templateId: FeedTemplateId): TipoRodape {
  if (templateId === "feed_icone_cta" || templateId === "stories_icone_cta") {
    return "rodape_01";
  }
  return "rodape_02";
}

function SeletorRodape({
  valor,
  formato,
  onChange,
}: {
  valor: TipoRodape;
  formato: "feed" | "stories";
  onChange: (v: TipoRodape) => void;
}) {
  const opcoes: { id: TipoRodape; nome: string; descricao: string }[] = [
    {
      id: "rodape_01",
      nome: "Amarelo",
      descricao: "Cheio com grão (logo creme)",
    },
    {
      id: "rodape_02",
      nome: "Creme",
      descricao: "Curva amarela (logo amarelo)",
    },
  ];

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {opcoes.map((op) => {
        const ativo = valor === op.id;
        return (
          <button
            key={op.id}
            onClick={() => onChange(op.id)}
            style={{
              flex: 1,
              padding: 0,
              border: ativo ? "2px solid #FFC528" : "2px solid #2a2a2a",
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor: "#0a0a0a",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              transition: "border-color 120ms",
            }}
          >
            {/* Thumbnail do PNG */}
            <div
              style={{
                width: "100%",
                aspectRatio: "16 / 5",
                backgroundColor: op.id === "rodape_01" ? "#FFC528" : "#FFF9E8",
                backgroundImage: `url('/rodapes/${op.id}_${formato}.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div
              style={{
                padding: "6px 8px",
                fontSize: 11,
                fontWeight: 700,
                color: ativo ? "#FFC528" : "#ddd",
                textAlign: "left",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {op.nome}
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 400,
                  color: "#666",
                  marginTop: 2,
                  lineHeight: 1.3,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                {op.descricao}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Secao({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 700,
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {icone}
        {titulo}
      </div>
      {children}
    </div>
  );
}

function Campo({
  label,
  valor,
  onChange,
  maxLen,
  multiline,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  maxLen?: number;
  multiline?: boolean;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={{ fontSize: 11, color: "#bbb", fontWeight: 600 }}>{label}</label>
        {maxLen && (
          <span style={{ fontSize: 10, color: valor.length > maxLen * 0.85 ? "#FFC528" : "#666" }}>
            {valor.length}/{maxLen}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLen}
          rows={2}
          style={{ ...selectStyle, resize: "vertical" }}
        />
      ) : (
        <input
          type="text"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLen}
          style={selectStyle}
        />
      )}
    </div>
  );
}

function CorPicker({
  label,
  valor,
  fallback,
  onChange,
}: {
  label: string;
  valor?: string;
  fallback: string;
  onChange: (v: string | undefined) => void;
}) {
  const cor = valor || fallback;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 80, fontSize: 11, color: "#bbb" }}>{label}</span>
      <input
        type="color"
        value={cor}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 32, height: 30, padding: 0, border: "1px solid #2a2a2a", borderRadius: 4 }}
      />
      <input
        type="text"
        value={cor}
        onChange={(e) => onChange(e.target.value)}
        maxLength={7}
        style={{ ...selectStyle, flex: 1, fontFamily: "monospace", textTransform: "uppercase" }}
      />
    </div>
  );
}

function Toggle({
  label,
  ativo,
  onChange,
}: {
  label: string;
  ativo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: 6,
        backgroundColor: "#0f0f0f",
        border: "1px solid #2a2a2a",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 12, color: "#ddd" }}>{label}</span>
      <input
        type="checkbox"
        checked={ativo}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "#FFC528" }}
      />
    </label>
  );
}

// ============================================================
// ESPAÇAMENTOS DO BLOCO — v7.7.9
// Sliders pros 4 gaps verticais entre elementos no template _icone_cta.
// Step 8 (8-point grid). Recolhível por padrão.
// ============================================================
// ============================================================
// CONTEÚDO ESPAÇAMENTOS — v7.7.13 (sem wrapper recolhível)
// Renderiza direto os 4 sliders de gap. Wrapper externo é Secao.
// ============================================================
function ConteudoEspacamentos({
  slide,
  onChange,
}: {
  slide: FeedSlideData;
  onChange: (patch: Partial<FeedSlideData>) => void;
}) {
  const DEF_ICONE_HEAD = 24;
  const DEF_HEAD_SUB = 32;
  const DEF_SUB_CTA = 64;
  const DEF_CTA_ROD = 72;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p
        style={{
          fontSize: 10,
          color: "#666",
          lineHeight: 1.4,
          margin: 0,
          fontFamily: "Poppins, sans-serif",
        }}
      >
        8-point grid (múltiplos de 8). Quando há tagline, o gap subhead → CTA é
        distribuído automaticamente entre subhead → tagline e tagline → CTA.
      </p>

      <SliderGap
        titulo="Ícone → Headline"
        valor={slide.gapIconeHeadline}
        defaultValor={DEF_ICONE_HEAD}
        min={16}
        max={64}
        onChange={(v) => onChange({ gapIconeHeadline: v })}
      />
      <SliderGap
        titulo="Headline → Subhead"
        valor={slide.gapHeadlineSubhead}
        defaultValor={DEF_HEAD_SUB}
        min={16}
        max={80}
        onChange={(v) => onChange({ gapHeadlineSubhead: v })}
      />
      <SliderGap
        titulo="Subhead → CTA"
        valor={slide.gapSubheadCTA}
        defaultValor={DEF_SUB_CTA}
        min={24}
        max={96}
        onChange={(v) => onChange({ gapSubheadCTA: v })}
      />
      <SliderGap
        titulo="CTA → Rodapé"
        valor={slide.gapCTARodape}
        defaultValor={DEF_CTA_ROD}
        min={48}
        max={120}
        onChange={(v) => onChange({ gapCTARodape: v })}
      />

      <button
        onClick={() =>
          onChange({
            gapIconeHeadline: undefined,
            gapHeadlineSubhead: undefined,
            gapSubheadCTA: undefined,
            gapCTARodape: undefined,
          })
        }
        style={{
          fontSize: 10,
          color: "#888",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          alignSelf: "flex-start",
        }}
      >
        <RotateCcw size={10} /> Resetar espaçamentos
      </button>
    </div>
  );
}


// Slider individual de um gap (step 8 = 8-point grid)
function SliderGap({
  titulo,
  valor,
  defaultValor,
  min,
  max,
  onChange,
}: {
  titulo: string;
  valor?: number;
  defaultValor: number;
  min: number;
  max: number;
  onChange: (v: number | undefined) => void;
}) {
  const valorEfetivo = valor ?? defaultValor;
  const ehDefault = valor === undefined;
  return (
    <div>
      <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>
        {titulo}: <span style={{ color: ehDefault ? "#888" : "#FFC528", fontWeight: 700 }}>
          {valorEfetivo}px
        </span>
        {ehDefault && <span style={{ color: "#666" }}> (padrão)</span>}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={8}
        value={valorEfetivo}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ width: "100%", accentColor: "#FFC528" }}
      />
    </div>
  );
}

// ============================================================
// CONTEÚDO TIPOGRAFIA AVANÇADA — v7.7.13 (sem wrapper recolhível)
// Renderiza direto os cards de cada elemento. Wrapper externo é
// uma <Secao> normal (mesmo padrão de "Cores", "Tamanho geral", etc).
// ============================================================
function ConteudoTipografia({
  slide,
  onChange,
  camposUsados,
}: {
  slide: FeedSlideData;
  onChange: (patch: Partial<FeedSlideData>) => void;
  camposUsados: TemplateInfo["camposUsados"];
}) {
  const usaPilula = camposUsados.includes("pilula");
  const usaHeadline = camposUsados.includes("headline");
  const usaSubhead = camposUsados.includes("subhead");
  const usaTagline = camposUsados.includes("tagline");
  const usaCTA = camposUsados.includes("cta");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {usaPilula && (
        <ControlesElemento
          titulo="Pílula (kicker)"
          peso={slide.pesoPilula}
          tamanho={slide.tamPilula}
          italic={slide.italicPilula}
          lineHeight={slide.lineHeightPilula}
          letterSpacing={slide.letterSpacingPilula}
          align={slide.alignPilula}
          transform={slide.transformPilula}
          mb={slide.mbPilula}
          onPesoChange={(v) => onChange({ pesoPilula: v })}
          onTamanhoChange={(v) => onChange({ tamPilula: v })}
          onItalicChange={(v) => onChange({ italicPilula: v })}
          onLineHeightChange={(v) => onChange({ lineHeightPilula: v })}
          onLetterSpacingChange={(v) => onChange({ letterSpacingPilula: v })}
          onAlignChange={(v) => onChange({ alignPilula: v })}
          onTransformChange={(v) => onChange({ transformPilula: v })}
          onMbChange={(v) => onChange({ mbPilula: v })}
          tamMin={14}
          tamMax={60}
          lhDefault={1.0}
          lsDefault={-0.005}
          alignDefault="left"
        />
      )}
      {usaHeadline && (
        <ControlesElemento
          titulo="Headline"
          peso={slide.pesoHeadline}
          tamanho={slide.tamHeadline}
          italic={slide.italicHeadline}
          lineHeight={slide.lineHeightHeadline}
          letterSpacing={slide.letterSpacingHeadline}
          align={slide.alignHeadline}
          transform={slide.transformHeadline}
          mb={slide.mbHeadline}
          onPesoChange={(v) => onChange({ pesoHeadline: v })}
          onTamanhoChange={(v) => onChange({ tamHeadline: v })}
          onItalicChange={(v) => onChange({ italicHeadline: v })}
          onLineHeightChange={(v) => onChange({ lineHeightHeadline: v })}
          onLetterSpacingChange={(v) => onChange({ letterSpacingHeadline: v })}
          onAlignChange={(v) => onChange({ alignHeadline: v })}
          onTransformChange={(v) => onChange({ transformHeadline: v })}
          onMbChange={(v) => onChange({ mbHeadline: v })}
          tamMin={40}
          tamMax={250}
          lhDefault={1.0}
          lsDefault={-0.02}
          alignDefault="left"
        />
      )}
      {usaSubhead && (
        <ControlesElemento
          titulo="Subhead"
          peso={slide.pesoSubhead}
          tamanho={slide.tamSubhead}
          italic={slide.italicSubhead}
          lineHeight={slide.lineHeightSubhead}
          letterSpacing={slide.letterSpacingSubhead}
          align={slide.alignSubhead}
          transform={slide.transformSubhead}
          mb={slide.mbSubhead}
          onPesoChange={(v) => onChange({ pesoSubhead: v })}
          onTamanhoChange={(v) => onChange({ tamSubhead: v })}
          onItalicChange={(v) => onChange({ italicSubhead: v })}
          onLineHeightChange={(v) => onChange({ lineHeightSubhead: v })}
          onLetterSpacingChange={(v) => onChange({ letterSpacingSubhead: v })}
          onAlignChange={(v) => onChange({ alignSubhead: v })}
          onTransformChange={(v) => onChange({ transformSubhead: v })}
          onMbChange={(v) => onChange({ mbSubhead: v })}
          tamMin={30}
          tamMax={180}
          lhDefault={1.0}
          lsDefault={-0.025}
          alignDefault="left"
        />
      )}
      {usaTagline && (
        <ControlesElemento
          titulo="Tagline"
          peso={slide.pesoTagline}
          tamanho={slide.tamTagline}
          italic={slide.italicTagline}
          lineHeight={slide.lineHeightTagline}
          letterSpacing={slide.letterSpacingTagline}
          align={slide.alignTagline}
          transform={slide.transformTagline}
          mb={slide.mbTagline}
          onPesoChange={(v) => onChange({ pesoTagline: v })}
          onTamanhoChange={(v) => onChange({ tamTagline: v })}
          onItalicChange={(v) => onChange({ italicTagline: v })}
          onLineHeightChange={(v) => onChange({ lineHeightTagline: v })}
          onLetterSpacingChange={(v) => onChange({ letterSpacingTagline: v })}
          onAlignChange={(v) => onChange({ alignTagline: v })}
          onTransformChange={(v) => onChange({ transformTagline: v })}
          onMbChange={(v) => onChange({ mbTagline: v })}
          tamMin={20}
          tamMax={80}
          lhDefault={1.2}
          lsDefault={-0.005}
          alignDefault="left"
        />
      )}
      {usaCTA && (
        <>
          <ControlesElemento
            titulo="CTA"
            peso={slide.pesoCTA}
            tamanho={slide.tamCTA}
            italic={slide.italicCTA}
            lineHeight={slide.lineHeightCTA}
            letterSpacing={slide.letterSpacingCTA}
            align={slide.alignCTA}
            transform={slide.transformCTA}
            onPesoChange={(v) => onChange({ pesoCTA: v })}
            onTamanhoChange={(v) => onChange({ tamCTA: v })}
            onItalicChange={(v) => onChange({ italicCTA: v })}
            onLineHeightChange={(v) => onChange({ lineHeightCTA: v })}
            onLetterSpacingChange={(v) => onChange({ letterSpacingCTA: v })}
            onAlignChange={(v) => onChange({ alignCTA: v })}
            onTransformChange={(v) => onChange({ transformCTA: v })}
            tamMin={18}
            tamMax={60}
            lhDefault={1.0}
            lsDefault={-0.005}
            alignDefault="left"
          />
          <CorPicker
            label="Cor do CTA"
            valor={slide.corCTA}
            fallback="#FFFFFF"
            onChange={(v) => onChange({ corCTA: v })}
          />
        </>
      )}
      <button
        onClick={() =>
          onChange({
            tamPilula: undefined,
            pesoPilula: undefined,
            italicPilula: undefined,
            lineHeightPilula: undefined,
            letterSpacingPilula: undefined,
            alignPilula: undefined,
            transformPilula: undefined,
            mbPilula: undefined,
            pesoHeadline: undefined,
            tamHeadline: undefined,
            italicHeadline: undefined,
            lineHeightHeadline: undefined,
            letterSpacingHeadline: undefined,
            alignHeadline: undefined,
            transformHeadline: undefined,
            mbHeadline: undefined,
            pesoSubhead: undefined,
            tamSubhead: undefined,
            italicSubhead: undefined,
            lineHeightSubhead: undefined,
            letterSpacingSubhead: undefined,
            alignSubhead: undefined,
            transformSubhead: undefined,
            mbSubhead: undefined,
            pesoTagline: undefined,
            tamTagline: undefined,
            italicTagline: undefined,
            lineHeightTagline: undefined,
            letterSpacingTagline: undefined,
            alignTagline: undefined,
            transformTagline: undefined,
            mbTagline: undefined,
            pesoCTA: undefined,
            tamCTA: undefined,
            italicCTA: undefined,
            lineHeightCTA: undefined,
            letterSpacingCTA: undefined,
            alignCTA: undefined,
            transformCTA: undefined,
            corCTA: undefined,
          })
        }
        style={{
          fontSize: 10,
          color: "#888",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          alignSelf: "flex-start",
        }}
      >
        <RotateCcw size={10} /> Resetar tipografia
      </button>
    </div>
  );
}


// Controles de peso/tamanho/entrelinhas/italic pra um elemento (Headline, Subhead, etc)
function ControlesElemento({
  titulo,
  peso,
  tamanho,
  italic,
  lineHeight,
  letterSpacing,
  align,
  transform,
  mb,
  onPesoChange,
  onTamanhoChange,
  onItalicChange,
  onLineHeightChange,
  onLetterSpacingChange,
  onAlignChange,
  onTransformChange,
  onMbChange,
  tamMin,
  tamMax,
  lhDefault,
  lsDefault,
  alignDefault,
}: {
  titulo: string;
  peso?: number;
  tamanho?: number;
  italic?: boolean;
  lineHeight?: number;
  letterSpacing?: number;
  align?: "left" | "center" | "right";
  transform?: "none" | "uppercase" | "lowercase" | "capitalize";
  mb?: number;
  onPesoChange: (v: number | undefined) => void;
  onTamanhoChange: (v: number | undefined) => void;
  onItalicChange: (v: boolean | undefined) => void;
  onLineHeightChange?: (v: number | undefined) => void;
  onLetterSpacingChange?: (v: number | undefined) => void;
  onAlignChange?: (v: "left" | "center" | "right" | undefined) => void;
  onTransformChange?: (v: "none" | "uppercase" | "lowercase" | "capitalize" | undefined) => void;
  onMbChange?: (v: number | undefined) => void;
  tamMin: number;
  tamMax: number;
  lhDefault?: number;
  lsDefault?: number;
  alignDefault?: "left" | "center" | "right";
}) {
  const PESOS_KUFAM = [
    { v: 400, l: "Regular" },
    { v: 500, l: "Medium" },
    { v: 600, l: "SemiBold" },
    { v: 700, l: "Bold" },
    { v: 800, l: "ExtraBold" },
    { v: 900, l: "Black" },
  ];

  const lsEfetivo = letterSpacing ?? lsDefault ?? 0;
  const alignEfetivo = align ?? alignDefault ?? "left";
  const transformEfetivo = transform ?? "none";

  return (
    <div
      style={{
        padding: 10,
        backgroundColor: "#141414",
        borderRadius: 6,
        border: "1px solid #2a2a2a",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "#FFC528" }}>{titulo}</div>

      {/* Peso */}
      <div>
        <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>
          Peso da fonte
        </label>
        <select
          value={peso ?? ""}
          onChange={(e) =>
            onPesoChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
          }
          style={selectStyle}
        >
          <option value="">— padrão do template —</option>
          {PESOS_KUFAM.map((p) => (
            <option key={p.v} value={p.v}>
              {p.l} ({p.v})
            </option>
          ))}
        </select>
      </div>

      {/* Tamanho */}
      <div>
        <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>
          Tamanho: {tamanho ? `${tamanho}px` : "(padrão)"}
        </label>
        <input
          type="range"
          min={tamMin}
          max={tamMax}
          step={2}
          value={tamanho ?? Math.round((tamMin + tamMax) / 2)}
          onChange={(e) => onTamanhoChange(parseInt(e.target.value, 10))}
          style={{ width: "100%", accentColor: "#FFC528" }}
        />
      </div>

      {/* Entrelinhas (line-height) */}
      {onLineHeightChange && (
        <div>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>
            Entrelinhas:{" "}
            {lineHeight !== undefined
              ? lineHeight.toFixed(2)
              : `(padrão ${lhDefault?.toFixed(2) ?? "—"})`}
          </label>
          <input
            type="range"
            min={0.8}
            max={1.4}
            step={0.05}
            value={lineHeight ?? lhDefault ?? 1.0}
            onChange={(e) => onLineHeightChange(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#FFC528" }}
          />
        </div>
      )}

      {/* Letter-spacing (tracking) — v7.7.10 */}
      {onLetterSpacingChange && (
        <div>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>
            Espaçamento de letras:{" "}
            {letterSpacing !== undefined
              ? `${lsEfetivo > 0 ? "+" : ""}${lsEfetivo.toFixed(3)}em`
              : `(padrão ${lsDefault !== undefined ? lsDefault.toFixed(3) + "em" : "—"})`}
          </label>
          <input
            type="range"
            min={-0.05}
            max={0.1}
            step={0.005}
            value={lsEfetivo}
            onChange={(e) => onLetterSpacingChange(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#FFC528" }}
          />
        </div>
      )}

      {/* Alinhamento — v7.7.10 */}
      {onAlignChange && (
        <div>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>
            Alinhamento
          </label>
          <div style={{ display: "flex", gap: 4 }}>
            {(["left", "center", "right"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onAlignChange(opt)}
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  backgroundColor: alignEfetivo === opt ? "#FFC528" : "#1a1a1a",
                  color: alignEfetivo === opt ? "#000" : "#aaa",
                  border: alignEfetivo === opt ? "1px solid #FFC528" : "1px solid #2a2a2a",
                  borderRadius: 4,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {opt === "left" ? "Esq" : opt === "center" ? "Centro" : "Dir"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transform — v7.7.10 */}
      {onTransformChange && (
        <div>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>
            Caixa do texto
          </label>
          <div style={{ display: "flex", gap: 4 }}>
            {([
              { v: "none", l: "Normal" },
              { v: "uppercase", l: "MAIÚSCULA" },
              { v: "lowercase", l: "minúscula" },
              { v: "capitalize", l: "Capitular" },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                onClick={() => onTransformChange(opt.v === "none" ? undefined : opt.v)}
                style={{
                  flex: 1,
                  padding: "6px 2px",
                  fontSize: 9,
                  fontWeight: 700,
                  backgroundColor: transformEfetivo === opt.v ? "#FFC528" : "#1a1a1a",
                  color: transformEfetivo === opt.v ? "#000" : "#aaa",
                  border: transformEfetivo === opt.v ? "1px solid #FFC528" : "1px solid #2a2a2a",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Margem inferior individual (8pt grid) — v7.7.10 */}
      {onMbChange && (
        <div>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>
            Margem inferior:{" "}
            <span style={{ color: mb !== undefined && mb > 0 ? "#FFC528" : "#888", fontWeight: 700 }}>
              {mb ?? 0}px
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={64}
            step={8}
            value={mb ?? 0}
            onChange={(e) => onMbChange(parseInt(e.target.value, 10) || undefined)}
            style={{ width: "100%", accentColor: "#FFC528" }}
          />
        </div>
      )}

      {/* Italic */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "#ccc",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={italic ?? false}
          onChange={(e) => onItalicChange(e.target.checked || undefined)}
          style={{ accentColor: "#FFC528" }}
        />
        <em style={{ fontStyle: "italic" }}>Italic</em>
      </label>
    </div>
  );
}
