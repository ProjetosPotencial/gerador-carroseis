import { useState, useCallback, useEffect } from "react";
import type { SlideData, LayoutId, TemaId } from "../temas/tipos";
import { obterTema, criarSlideVazio } from "../temas/tipos";
import { obterTema as buscarTema } from "../temas";

const AUTOSAVE_KEY = "parceleaqui:carrossel:slides:v1";

function uid() {
  return Math.random().toString(36).substring(2, 10);
}

function novoSlide(layout: LayoutId): SlideData {
  return criarSlideVazio(layout, "preto");
}

/** Cria a lista inicial de slides a partir dos exemplos do tema. */
export function slidesIniciaisDoTema(temaId: TemaId): SlideData[] {
  const tema = buscarTema(temaId);
  return tema.slidesExemplo.map((s) => ({ ...s, id: uid() }));
}

/** v7.8: inverte a cor de fundo (preto ⇄ amarelo) dos slides de cor sólida.
 * Não mexe em layouts de foto (que têm fundo escuro por natureza). */
export function inverterCoresDeck(slides: SlideData[]): SlideData[] {
  return slides.map((s) => {
    if ((s.layout || "").includes("foto")) return s;
    if (s.corFundo !== "preto" && s.corFundo !== "amarelo") return s;
    const novaCor: SlideData["corFundo"] = s.corFundo === "preto" ? "amarelo" : "preto";
    // Ao trocar a cor, zera as cores de texto travadas: o contraste passa a ser
    // resolvido pelo tema — fundo amarelo => TODO texto preto; fundo preto => padrão claro.
    return {
      ...s,
      corFundo: novaCor,
      corKicker: undefined,
      corHeadline: undefined,
      corDestaque: undefined,
      corTopbar: undefined,
      corRodape: undefined,
      corNumero: undefined,
      corSetinha: undefined,
    };
  });
}

const PARIDADE_KEY = "parceleaqui:carrossel:paridadeCor:v1";

/** v7.8: estrutura padrão do tema alternando a paleta a cada novo carrossel
 * (um preto/amarelo, o próximo com as cores invertidas). Automação-friendly. */
export function proximaEstruturaPadrao(temaId: TemaId): SlideData[] {
  let p = 0;
  try {
    p = parseInt(localStorage.getItem(PARIDADE_KEY) || "0", 10) || 0;
  } catch {}
  let slides = slidesIniciaisDoTema(temaId);
  if (p % 2 === 1) slides = inverterCoresDeck(slides);
  try {
    localStorage.setItem(PARIDADE_KEY, String((p + 1) % 1000000));
  } catch {}
  return slides;
}

function carregarSalvos(): SlideData[] | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (parsed.some((s) => !s?.id || !s?.layout)) return null;
    return parsed as SlideData[];
  } catch {
    return null;
  }
}

function salvarSlides(slides: SlideData[]) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(slides));
  } catch {}
}

export interface UseSlidesReturn {
  slides: SlideData[];
  setSlides: React.Dispatch<React.SetStateAction<SlideData[]>>;
  indiceAtivo: number;
  setIndiceAtivo: React.Dispatch<React.SetStateAction<number>>;
  slideAtivo: SlideData;
  atualizarSlide: (patch: Partial<SlideData>) => void;
  adicionarSlide: (layout?: LayoutId) => void;
  removerSlide: (i: number) => void;
  duplicarSlide: (i: number) => void;
  moverSlide: (de: number, para: number) => void;
  resetarParaExemplos: (temaId: TemaId) => void;
  limparTudo: (temaId: TemaId) => void;
}

/**
 * Hook que centraliza o state e as ações de manipulação de slides.
 * Usado pelo CarrosselEditor pra evitar passar 6+ callbacks por props.
 *
 * Auto-save (v7.7.15): persiste slides no localStorage. Quando o
 * usuário recarrega a página, volta exatamente como estava.
 */
export function useSlides(temaIdInicial: TemaId): UseSlidesReturn {
  const [slides, setSlides] = useState<SlideData[]>(
    () => carregarSalvos() ?? proximaEstruturaPadrao(temaIdInicial)
  );
  const [indiceAtivo, setIndiceAtivo] = useState(0);

  // Auto-save: salva sempre que slides mudam
  useEffect(() => {
    salvarSlides(slides);
  }, [slides]);

  const slideAtivo = slides[indiceAtivo];

  const atualizarSlide = useCallback(
    (patch: Partial<SlideData>) => {
      setSlides((lista) =>
        lista.map((s, i) => (i === indiceAtivo ? { ...s, ...patch } : s))
      );
    },
    [indiceAtivo]
  );

  const adicionarSlide = useCallback(
    (layout?: LayoutId) => {
      // Caller passa layoutFinal já decidido (ou o orquestrador escolhe o default do tema)
      const layoutEscolhido = layout || ("tipografia_pura" as LayoutId);
      setSlides((lista) => {
        const novo = novoSlide(layoutEscolhido);
        const antes = lista.slice(0, indiceAtivo + 1);
        const depois = lista.slice(indiceAtivo + 1);
        return [...antes, novo, ...depois];
      });
      setIndiceAtivo((i) => i + 1);
    },
    [indiceAtivo]
  );

  const removerSlide = useCallback(
    (i: number) => {
      if (slides.length <= 1) return;
      setSlides((lista) => lista.filter((_, idx) => idx !== i));
      setIndiceAtivo((cur) => {
        if (cur === i) return Math.max(0, cur - 1);
        if (cur > i) return cur - 1;
        return cur;
      });
    },
    [slides.length]
  );

  const duplicarSlide = useCallback((i: number) => {
    setSlides((lista) => {
      const copia = { ...lista[i], id: uid() };
      return [...lista.slice(0, i + 1), copia, ...lista.slice(i + 1)];
    });
    setIndiceAtivo(i + 1);
  }, []);

  const moverSlide = useCallback(
    (de: number, para: number) => {
      if (para < 0 || para >= slides.length) return;
      setSlides((lista) => {
        const copia = [...lista];
        const [item] = copia.splice(de, 1);
        copia.splice(para, 0, item);
        return copia;
      });
      setIndiceAtivo(para);
    },
    [slides.length]
  );

  const resetarParaExemplos = useCallback((temaId: TemaId) => {
    setSlides(proximaEstruturaPadrao(temaId));
    setIndiceAtivo(0);
  }, []);

  const limparTudo = useCallback((temaId: TemaId) => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch {}
    setSlides(proximaEstruturaPadrao(temaId));
    setIndiceAtivo(0);
  }, []);

  return {
    slides,
    setSlides,
    indiceAtivo,
    setIndiceAtivo,
    slideAtivo,
    atualizarSlide,
    adicionarSlide,
    removerSlide,
    duplicarSlide,
    moverSlide,
    resetarParaExemplos,
    limparTudo,
  };
}
