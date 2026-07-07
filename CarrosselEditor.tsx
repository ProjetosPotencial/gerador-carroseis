import { useState, useRef, useMemo, useCallback } from "react";
import CarrosselSlide from "./CarrosselSlide";
import { TEMAS_DISPONIVEIS, obterTema } from "./temas";
import { ErroParseTexto, parsearTextoColado, sincronizarSlides } from "../lib/parsearTextoColado";
import { baixarCarrosselZIP, baixarSlideUnico } from "../lib/gerarCarrossel";
import {
  useSlides,
  useStatus,
  useIA,
  useImagens,
  inverterCoresDeck,
  Toolbar,
  StatusBar,
  SlideList,
  SlidePreview,
  EditPanel,
  IAPanel,
  PastePanel,
  EstiloVisualPanel,
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
  // v7.8 — geração de imagens com IA (Gemini). Carrossel = formato 4:5.
  const img = useImagens({
    slides: sl.slides,
    setSlides: sl.setSlides,
    formato: "carrossel",
    status,
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
      const slidesFinais = sincronizarSlides(sl.slides, novosSlides);
      sl.setSlides(slidesFinais);
      sl.setIndiceAtivo(0);
      setMostrarPainelCola(false);
      setTextoColado("");

      const numAdicionados = Math.max(0, novosSlides.length - sl.slides.length);
      const numRemovidos = Math.max(0, sl.slides.length - novosSlides.length);
      let msg = `${novosSlides.length} ${
        novosSlides.length === 1 ? "slide aplicado" : "slides aplicados"
      }`;
      if (numAdicionados > 0) msg += ` (+${numAdicionados} novos)`;
      if (numRemovidos > 0) msg += ` (-${numRemovidos} removidos)`;
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
  }, [textoColado, sl, status]);

  // Nome do arquivo ZIP baseado na primeira headline
  const nomeArquivoZip = useMemo(() => {
    const primeira = sl.slides[0]?.headline || "carrossel";
    const slug = primeira
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    return `carrossel-${slug || "novo"}`;
  }, [sl.slides]);

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
    }
  };

  const togglePainelIA = () => {
    setMostrarPainelIA((v) => !v);
    if (!mostrarPainelIA) {
      setMostrarPainelCola(false);
      setMostrarPainelEstilo(false);
    }
  };

  const inverterCores = () => {
    sl.setSlides((lista) => inverterCoresDeck(lista));
    status.sucesso("Cores invertidas (preto ⇄ amarelo).", 2000);
  };

  const resetarEstruturaPadrao = () => {
    if (
      window.confirm(
        "Isso apaga os slides atuais e recarrega a estrutura padrão de 7 slides. Continuar?"
      )
    ) {
      sl.limparTudo(temaId);
      status.sucesso("Estrutura padrão recarregada (7 slides).", 2500);
    }
  };

  const togglePainelEstilo = () => {
    setMostrarPainelEstilo((v) => !v);
    if (!mostrarPainelEstilo) {
      setMostrarPainelCola(false);
      setMostrarPainelIA(false);
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
          mostrarPainelEstilo={mostrarPainelEstilo}
          onTogglePainelEstilo={togglePainelEstilo}
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
