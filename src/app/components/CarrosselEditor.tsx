import { useState, useRef, useMemo, useCallback } from "react";
import { Loader2, X } from "lucide-react";
import CarrosselSlide from "./CarrosselSlide";
import { TEMAS_DISPONIVEIS, obterTema } from "./temas";
import { ErroParseTexto, parsearTextoColado, aplicarNaEstrutura } from "../lib/parsearTextoColado";
import { baixarCarrosselZIP, baixarSlideUnico, gerarSlideDataURL } from "../lib/gerarCarrossel";
import { authHeaders } from "../lib/supabaseClient";
import {
  useSlides,
  useStatus,
  useIA,
  useImagens,
  inverterCoresDeck,
  proximaEstruturaPadrao,
  Toolbar,
  StatusBar,
  SlideList,
  SlidePreview,
  EditPanel,
  IAPanel,
  PastePanel,
  EstiloVisualPanel,
  BancoPanel,
  AgendaPanel,
} from "./carrossel";
import type { LayoutId, TemaId } from "./temas/tipos";

// ============================================================
// CARROSSEL EDITOR — orquestrador
// v7.5: refatorado em hooks (useSlides, useStatus, useIA) +
// componentes (Toolbar, StatusBar, SlideList, SlidePreview,
// EditPanel, IAPanel, PastePanel) na pasta ./carrossel/.
// ============================================================
export default function CarrosselEditor() {
  // State principal
  const [temaId, setTemaId] = useState<TemaId>("brands_decoded_classic");
  const [marca, setMarca] = useState("POTENCIAL · MERCADO");
  const [mostrarPainelIA, setMostrarPainelIA] = useState(false);
  const [mostrarPainelCola, setMostrarPainelCola] = useState(false);
  const [mostrarPainelEstilo, setMostrarPainelEstilo] = useState(false);
  const [mostrarPainelBanco, setMostrarPainelBanco] = useState(false);
  const [mostrarPainelAgenda, setMostrarPainelAgenda] = useState(false);
  const [textoColado, setTextoColado] = useState("");

  // Hooks customizados
  const status = useStatus();
  const sl = useSlides(temaId);
  const temaAtivo = useMemo(() => obterTema(temaId), [temaId]);
  const ia = useIA({
    slides: sl.slides,
    setSlides: sl.setSlides,
    setIndiceAtivo: sl.setIndiceAtivo,
    marca,
    temaAtivo,
    status,
  });
  const img = useImagens({
    slides: sl.slides,
    setSlides: sl.setSlides,
    formato: "carrossel",
    status,
    rotularSlide: (s) => s.kicker || s.headline || "",
  });

  // Refs dos slides em escala real (pra captura via html-to-image)
  const slideRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Troca de tema: ajusta layouts inválidos pro primeiro do novo tema
  const trocarTema = useCallback((novoId: TemaId) => {
    const novoTema = obterTema(novoId);
    const layoutsValidos = novoTema.layouts.map((l) => l.id);
    setTemaId(novoId);
    sl.setSlides((lista) =>
      lista.map((s) => ({
        ...s,
        layout: layoutsValidos.includes(s.layout) ? s.layout : novoTema.layouts[0].id,
      }))
    );
  }, [sl]);

  // Adicionar slide com layout default do tema atual
  const adicionarSlide = useCallback(() => {
    sl.adicionarSlide(temaAtivo.layouts[0].id as LayoutId);
  }, [sl, temaAtivo]);

  // Processar texto colado (modo offline, sem IA)
  const processarTextoColado = useCallback(() => {
    if (!textoColado.trim()) {
      status.erro("Cole algum conteúdo no campo.");
      return;
    }
    try {
      const { slides: novosSlides, avisos } = parsearTextoColado(textoColado);
      // v7.9.1: cada colagem reseta pra estrutura padrão na PRÓXIMA cor (alternada)
      // e encaixa o texto colado nela — sem preservar o deck/fotos anteriores.
      const base = proximaEstruturaPadrao(temaId);
      const slidesFinais = aplicarNaEstrutura(base, novosSlides);
      sl.setSlides(slidesFinais);
      sl.setIndiceAtivo(0);
      setMostrarPainelCola(false);
      setTextoColado("");

      let msg = `${novosSlides.length} ${
        novosSlides.length === 1 ? "slide aplicado" : "slides aplicados"
      } na estrutura padrão (cores da vez)`;
      if (avisos.length > 0)
        msg += ` · ${avisos.length} ${avisos.length === 1 ? "aviso" : "avisos"}`;

      status.sucesso(msg, 5000);
      if (avisos.length > 0) console.warn("Avisos do parser:", avisos);
    } catch (err: any) {
      const msg =
        err instanceof ErroParseTexto
          ? err.message
          : err?.message || "Erro ao processar o texto.";
      status.erro(msg);
    }
  }, [textoColado, sl, status, temaId]);

  // Nome do arquivo ZIP baseado na primeira headline
  const slug = (t: string) =>
    (t || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  const nomeArquivoZip = useMemo(() => {
    // Bloco 5: nomeia por ${mes}-${semana}-${peca} quando o Banco está preenchido.
    const partes = [img.banco.mes, img.banco.semana, img.banco.peca].map(slug).filter(Boolean);
    if (partes.length) return partes.join("-");
    const primeira = sl.slides[0]?.headline || "carrossel";
    return `carrossel-${slug(primeira) || "novo"}`;
  }, [sl.slides, img.banco.mes, img.banco.semana, img.banco.peca]);

  // ====== EXPORT ======
  const exportarTudo = async () => {
    status.exportando(0, sl.slides.length);
    const refs = sl.slides
      .map((s, i) => {
        const element = slideRefs.current.get(s.id);
        return element ? { index: i, element } : null;
      })
      .filter((r): r is { index: number; element: HTMLDivElement } => r !== null);

    if (refs.length !== sl.slides.length) {
      status.erro("Alguns slides não estão prontos ainda. Tente em 1-2 segundos.");
      return;
    }

    await baixarCarrosselZIP({
      slides: refs,
      nomeBase: nomeArquivoZip,
      onProgress: (atual, total) => status.exportando(atual, total),
      onSuccess: () => status.sucesso("ZIP baixado com sucesso!"),
      onError: (err) => status.erro(err.message),
    });
  };

  // ====== SALVAR SLIDES FINAIS (bucket slides-finais no Supabase) ======
  const [salvando, setSalvando] = useState(false);
  const salvarSlides = async () => {
    const refs = sl.slides
      .map((s, i) => {
        const element = slideRefs.current.get(s.id);
        return element ? { index: i, element } : null;
      })
      .filter((r): r is { index: number; element: HTMLDivElement } => r !== null);
    if (refs.length !== sl.slides.length) {
      status.erro("Alguns slides não estão prontos ainda. Tente em 1-2 segundos.");
      return;
    }
    setSalvando(true);
    status.exportando(0, refs.length);
    const meta = {
      mes: img.banco.mes,
      semana: img.banco.semana,
      peca: img.banco.peca || "Carrossel",
    };
    let ok = 0;
    let caminho = "";
    const urls: { n: number; url: string }[] = [];
    try {
      for (let i = 0; i < refs.length; i++) {
        status.exportando(i + 1, refs.length);
        // v7.20.3: isola o slide da captura. Com os 7 slides em resolução real
        // no DOM, o getComputedStyle do html-to-image forçava reflow e o toPng
        // levava >12s/slide (travava). Escondendo os demais, cada captura é rápida.
        refs.forEach((r, j) => { if (j !== i) r.element.style.display = "none"; });
        let dataUrl: string;
        try {
          dataUrl = await gerarSlideDataURL(refs[i].element);
        } finally {
          refs.forEach((r) => { r.element.style.display = ""; });
        }
        const r = await fetch("/api/slides/salvar", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ png: dataUrl, ...meta, slide: i + 1 }),
        });
        const data = await r.json().catch(() => ({}));
        if (data.configured === false) {
          status.erro("Repositório não configurado (defina as variáveis SUPABASE_* na Vercel).");
          setSalvando(false);
          return;
        }
        if (!r.ok || data.error) throw new Error(data.error || `Erro HTTP ${r.status}`);
        caminho = data.caminho || caminho;
        if (data.url) urls.push({ n: i + 1, url: data.url });
        ok++;
      }
      status.sucesso(`${ok} ${ok === 1 ? "slide salvo" : "slides salvos"} em ${caminho || "slides-finais"}.`, 5000);
      // v7.20: copia as artes pra pasta da semana no Drive + Slack de aprovação
      try {
        const rf = await fetch("/api/slides/finalizar", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ ...meta, slides: urls }),
        });
        const df = await rf.json().catch(() => ({}));
        if (df && df.configured !== false && df.driveUrl) {
          status.sucesso(`Artes salvas no Drive (${df.salvos}). Link enviado no Slack pra aprovação.`, 7000);
        }
      } catch {}
    } catch (e: any) {
      status.erro(e?.message || "Falha ao salvar os slides.");
    } finally {
      setSalvando(false);
    }
  };

  const exportarSlideAtual = async () => {
    const element = slideRefs.current.get(sl.slideAtivo.id);
    if (!element) {
      status.erro("Slide não está pronto. Aguarde.");
      return;
    }
    status.exportando(1, 1);
    const nome = `${nomeArquivoZip}-slide-${String(sl.indiceAtivo + 1).padStart(2, "0")}`;
    const ok = await baixarSlideUnico(element, nome);
    if (ok) {
      status.sucesso("Slide baixado!", 2500);
    } else {
      status.erro("Erro ao gerar PNG.");
    }
  };

  // ====== Helpers de UI ======
  const togglePainelCola = () => {
    setMostrarPainelCola((v) => !v);
    if (!mostrarPainelCola) {
      setMostrarPainelIA(false);
      setMostrarPainelEstilo(false);
      setMostrarPainelBanco(false);
      setMostrarPainelAgenda(false);
    }
  };

  const togglePainelIA = () => {
    setMostrarPainelIA((v) => !v);
    if (!mostrarPainelIA) {
      setMostrarPainelCola(false);
      setMostrarPainelEstilo(false);
      setMostrarPainelBanco(false);
      setMostrarPainelAgenda(false);
    }
  };

  const togglePainelEstilo = () => {
    setMostrarPainelEstilo((v) => !v);
    if (!mostrarPainelEstilo) {
      setMostrarPainelCola(false);
      setMostrarPainelIA(false);
      setMostrarPainelBanco(false);
      setMostrarPainelAgenda(false);
    }
  };

  const togglePainelBanco = () => {
    setMostrarPainelBanco((v) => !v);
    if (!mostrarPainelBanco) {
      setMostrarPainelCola(false);
      setMostrarPainelIA(false);
      setMostrarPainelEstilo(false);
      setMostrarPainelAgenda(false);
    }
  };

  const togglePainelAgenda = () => {
    setMostrarPainelAgenda((v) => !v);
    if (!mostrarPainelAgenda) {
      setMostrarPainelCola(false);
      setMostrarPainelIA(false);
      setMostrarPainelEstilo(false);
      setMostrarPainelBanco(false);
    }
  };

  // Reuso do banco de imagens: aplica a URL pública no slide ativo (sem Gemini).
  const usarImagemNoSlide = useCallback(
    (url: string) => {
      sl.setSlides((lista) =>
        lista.map((s, i) =>
          i === sl.indiceAtivo
            ? { ...s, fotoUrl: url, fotoOrigem: "ia", imgStatus: "ok", imgErro: undefined }
            : s
        )
      );
      status.sucesso(`Imagem aplicada ao slide ${sl.indiceAtivo + 1}.`, 3000);
    },
    [sl, status]
  );

  const inverterCores = () => {
    sl.setSlides((lista) => inverterCoresDeck(lista));
    status.sucesso("Cores invertidas (preto ⇄ amarelo).", 2000);
  };

  const resetarEstruturaPadrao = () => {
    if (window.confirm("Isso apaga os slides atuais e recarrega a estrutura padrão de 7 slides. Continuar?")) {
      sl.limparTudo(temaId);
      status.sucesso("Estrutura padrão recarregada (7 slides).", 2500);
    }
  };

  const nomeLayoutPorId = (id: string) =>
    temaAtivo.layouts.find((l) => l.id === id)?.nome || id;

  // ============================================================
  return (
    <div className="w-full min-h-screen bg-[#0f0f0f]">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <StatusBar status={status.status} onDismiss={status.resetStatus} />

        <Toolbar
          marca={marca}
          onMarcaChange={setMarca}
          numSlides={sl.slides.length}
          status={status.status}
          mostrarPainelCola={mostrarPainelCola}
          mostrarPainelIA={mostrarPainelIA}
          onTogglePainelCola={togglePainelCola}
          onTogglePainelIA={togglePainelIA}
          onExportarSlideAtual={exportarSlideAtual}
          onExportarTudo={exportarTudo}
          onSalvarSlides={salvarSlides}
          salvando={salvando}
          mostrarPainelEstilo={mostrarPainelEstilo}
          onTogglePainelEstilo={togglePainelEstilo}
          mostrarPainelBanco={mostrarPainelBanco}
          onTogglePainelBanco={togglePainelBanco}
          mostrarPainelAgenda={mostrarPainelAgenda}
          onTogglePainelAgenda={togglePainelAgenda}
          onGerarImagens={img.gerarLote}
          gerandoImagens={img.gerandoLote}
          progressoImagens={img.progresso}
          slidesPendentes={img.slidesPendentes}
          onInverterCores={inverterCores}
          onLimparTudo={resetarEstruturaPadrao}
        />

        {mostrarPainelEstilo && (
          <EstiloVisualPanel img={img} onFechar={() => setMostrarPainelEstilo(false)} />
        )}

        {mostrarPainelBanco && (
          <BancoPanel
            img={img}
            onFechar={() => setMostrarPainelBanco(false)}
            onUsarNoSlide={usarImagemNoSlide}
            slideAtivoNum={sl.indiceAtivo + 1}
          />
        )}

        {mostrarPainelAgenda && (
          <AgendaPanel
            mes={img.banco.mes}
            semana={img.banco.semana}
            onFechar={() => setMostrarPainelAgenda(false)}
          />
        )}

        {img.gerandoLote && img.progresso && (
          <div className="bg-[#141414] border border-[#FFC528]/30 rounded-xl p-4 flex items-center gap-4">
            <Loader2 className="animate-spin text-[#FFC528] flex-shrink-0" size={20} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1 gap-3">
                <span className="text-sm font-bold text-white">
                  Gerando imagem {img.progresso.atual} de {img.progresso.total}
                </span>
                <span className="text-xs text-gray-400 truncate">{img.progresso.rotulo}</span>
              </div>
              <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FFC528] transition-all"
                  style={{ width: `${Math.round((img.progresso.atual / img.progresso.total) * 100)}%` }}
                />
              </div>
            </div>
            <button
              onClick={img.cancelarLote}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold bg-[#1a1a1a] border border-gray-700 text-gray-300 hover:border-red-500 hover:text-red-400 transition-all flex-shrink-0"
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        )}

        {mostrarPainelIA && (
          <IAPanel
            tema={ia.temaIA}
            onTemaChange={ia.setTemaIA}
            numSlides={sl.slides.length}
            prompt={ia.promptGerado}
            onCopiarPrompt={ia.copiarPrompt}
            promptCopiado={ia.promptCopiado}
            resposta={ia.respostaIA}
            onRespostaChange={ia.setRespostaIA}
            onFormatar={() => {
              ia.formatarResposta();
              setMostrarPainelIA(false);
            }}
            onGerarViaAPI={async () => {
              await ia.gerarViaAPI();
              setMostrarPainelIA(false);
            }}
            gerandoViaAPI={ia.gerandoViaAPI}
            modeloIA={ia.modeloIA}
            onModeloChange={ia.setModeloIA}
            chaveManualIA={ia.chaveManualIA}
            onChaveManualChange={ia.atualizarChaveManual}
          />
        )}

        {mostrarPainelCola && (
          <PastePanel
            texto={textoColado}
            onTextoChange={setTextoColado}
            onAplicar={processarTextoColado}
            onFechar={() => setMostrarPainelCola(false)}
          />
        )}

        {/* Grid principal */}
        <div className="grid grid-cols-12 gap-4">
          {/* COLUNA 1 — Lista de slides */}
          <aside className="col-span-12 md:col-span-2">
            <SlideList
              slides={sl.slides}
              indiceAtivo={sl.indiceAtivo}
              temaId={temaId}
              nomeLayoutPorId={nomeLayoutPorId}
              onSelect={sl.setIndiceAtivo}
              onAdicionar={adicionarSlide}
              onRemover={sl.removerSlide}
              onDuplicar={sl.duplicarSlide}
              onMoverCima={(i) => sl.moverSlide(i, i - 1)}
              onMoverBaixo={(i) => sl.moverSlide(i, i + 1)}
            />
          </aside>

          {/* COLUNA 2 — Preview grande */}
          <section className="col-span-12 md:col-span-6">
            <SlidePreview
              slide={sl.slideAtivo}
              indiceAtivo={sl.indiceAtivo}
              total={sl.slides.length}
              marca={marca}
              temaId={temaId}
              onAnterior={() => sl.setIndiceAtivo((i) => Math.max(0, i - 1))}
              onProximo={() =>
                sl.setIndiceAtivo((i) => Math.min(sl.slides.length - 1, i + 1))
              }
              onSlideChange={sl.atualizarSlide}
            />
          </section>

          {/* COLUNA 3 — Painel de edição */}
          <aside className="col-span-12 md:col-span-4">
            <div className="bg-[#141414] rounded-xl border border-gray-800 p-4 space-y-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <EditPanel
                slide={sl.slideAtivo}
                onChange={sl.atualizarSlide}
                temaId={temaId}
                onTrocarTema={trocarTema}
                temaAtivo={temaAtivo}
                onGerarImagem={(forcar) => img.gerarSlide(sl.slideAtivo.id, { forcar })}
              />
            </div>
          </aside>
        </div>

        {/* SLIDES OCULTOS EM ESCALA REAL (só pra captura do html-to-image) */}
        <div
          style={{
            position: "fixed",
            left: -10000,
            top: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
          aria-hidden="true"
        >
          {sl.slides.map((s, i) => (
            <div
              key={s.id}
              ref={(el) => {
                if (el) slideRefs.current.set(s.id, el);
                else slideRefs.current.delete(s.id);
              }}
            >
              <CarrosselSlide
                slide={s}
                index={i}
                total={sl.slides.length}
                marca={marca}
                temaId={temaId}
                escalaReal
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
