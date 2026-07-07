import { useState, useCallback, useEffect, useRef } from "react";
import {
  gerarImagem,
  ErroGerarImagem,
  ESTILO_VISUAL_PADRAO,
  NEGATIVE_PROMPT_PADRAO,
  carregarPresets,
  salvarPresets,
  type FormatoImagem,
  type PresetEstilo,
  type ImagemSlide,
} from "../../lib/gerarImagem";

// ============================================================
// PERSISTÊNCIA (localStorage) — compartilhada por todos os editores
// ============================================================
const KEY_ESTILO = "parceleaqui:estiloVisual:v1";
const KEY_NEGATIVE = "parceleaqui:negativePrompt:v1";
const KEY_CHAVE = "gemini_api_key_manual";
const KEY_MODELO = "parceleaqui:gemini:modelo:v1";

function ler(key: string, fallback: string): string {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? v : fallback;
  } catch {
    return fallback;
  }
}

function gravar(key: string, valor: string): void {
  try {
    if (valor) localStorage.setItem(key, valor);
    else localStorage.removeItem(key);
  } catch {
    // ignora
  }
}

/** Status mínimo que os hooks de imagem precisam (compatível com useStatus). */
export interface StatusMinimo {
  sucesso: (msg: string, ms?: number) => void;
  erro: (msg: string, ms?: number) => void;
}

// ============================================================
// useEstiloVisual — config global (estética, negative, chave, presets)
// ============================================================
export interface EstiloVisualControls {
  estiloVisual: string;
  setEstiloVisual: (v: string) => void;
  negativePrompt: string;
  setNegativePrompt: (v: string) => void;
  chaveGemini: string;
  setChaveGemini: (v: string) => void;
  modelo: string;
  setModelo: (v: string) => void;
  resetarEstiloPadrao: () => void;
  presets: PresetEstilo[];
  salvarPresetAtual: (nome: string) => void;
  aplicarPreset: (id: string) => void;
  removerPreset: (id: string) => void;
}

export function useEstiloVisual(status: StatusMinimo): EstiloVisualControls {
  const [estiloVisual, setEstiloVisualState] = useState(() =>
    ler(KEY_ESTILO, ESTILO_VISUAL_PADRAO)
  );
  const [negativePrompt, setNegativePromptState] = useState(() =>
    ler(KEY_NEGATIVE, NEGATIVE_PROMPT_PADRAO)
  );
  const [chaveGemini, setChaveGeminiState] = useState(() => ler(KEY_CHAVE, ""));
  const [modelo, setModeloState] = useState(() => ler(KEY_MODELO, "gemini-2.5-flash-image"));
  const [presets, setPresets] = useState<PresetEstilo[]>(() => carregarPresets());

  useEffect(() => gravar(KEY_ESTILO, estiloVisual), [estiloVisual]);
  useEffect(() => gravar(KEY_NEGATIVE, negativePrompt), [negativePrompt]);
  useEffect(() => gravar(KEY_CHAVE, chaveGemini), [chaveGemini]);
  useEffect(() => gravar(KEY_MODELO, modelo), [modelo]);

  const setEstiloVisual = useCallback((v: string) => setEstiloVisualState(v), []);
  const setNegativePrompt = useCallback((v: string) => setNegativePromptState(v), []);
  const setChaveGemini = useCallback((v: string) => setChaveGeminiState(v.trim()), []);
  const setModelo = useCallback((v: string) => setModeloState(v), []);

  const resetarEstiloPadrao = useCallback(() => {
    setEstiloVisualState(ESTILO_VISUAL_PADRAO);
    setNegativePromptState(NEGATIVE_PROMPT_PADRAO);
  }, []);

  const persistirPresets = useCallback((novos: PresetEstilo[]) => {
    setPresets(novos);
    salvarPresets(novos);
  }, []);

  const salvarPresetAtual = useCallback(
    (nome: string) => {
      const nomeLimpo = nome.trim();
      if (!nomeLimpo) return;
      const novo: PresetEstilo = {
        id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        nome: nomeLimpo,
        estiloVisual,
        negativePrompt,
      };
      persistirPresets([...presets, novo]);
      status.sucesso(`Preset "${nomeLimpo}" salvo.`, 2500);
    },
    [estiloVisual, negativePrompt, presets, persistirPresets, status]
  );

  const aplicarPreset = useCallback(
    (id: string) => {
      const p = presets.find((x) => x.id === id);
      if (!p) return;
      setEstiloVisualState(p.estiloVisual);
      setNegativePromptState(p.negativePrompt);
      status.sucesso(`Estilo "${p.nome}" aplicado.`, 2000);
    },
    [presets, status]
  );

  const removerPreset = useCallback(
    (id: string) => persistirPresets(presets.filter((x) => x.id !== id)),
    [presets, persistirPresets]
  );

  return {
    estiloVisual,
    setEstiloVisual,
    negativePrompt,
    setNegativePrompt,
    chaveGemini,
    setChaveGemini,
    modelo,
    setModelo,
    resetarEstiloPadrao,
    presets,
    salvarPresetAtual,
    aplicarPreset,
    removerPreset,
  };
}

// ============================================================
// useImagens — geração por slide + em lote (carrossel, feed/stories)
// ============================================================
interface UseImagensOptions<T extends ImagemSlide> {
  slides: T[];
  setSlides: React.Dispatch<React.SetStateAction<T[]>>;
  status: StatusMinimo;
  formato?: FormatoImagem;
  resolverFormato?: (slide: T) => FormatoImagem;
}

export interface ProgressoLote {
  atual: number;
  total: number;
}

export interface UseImagensReturn<T extends ImagemSlide> extends EstiloVisualControls {
  gerandoLote: boolean;
  progresso: ProgressoLote | null;
  gerarSlide: (id: string, opts?: { forcar?: boolean }) => Promise<void>;
  gerarLote: () => Promise<void>;
  slidesPendentes: number;
}

export function useImagens<T extends ImagemSlide>({
  slides,
  setSlides,
  status,
  formato,
  resolverFormato,
}: UseImagensOptions<T>): UseImagensReturn<T> {
  const estilo = useEstiloVisual(status);

  const [gerandoLote, setGerandoLote] = useState(false);
  const [progresso, setProgresso] = useState<ProgressoLote | null>(null);

  const slidesRef = useRef<T[]>(slides);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  const patchSlide = useCallback(
    (id: string, patch: Partial<T>) => {
      setSlides((lista) => lista.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [setSlides]
  );

  const formatoDe = useCallback(
    (slide: T): FormatoImagem =>
      resolverFormato ? resolverFormato(slide) : formato || "carrossel",
    [resolverFormato, formato]
  );

  const gerarSlidePorId = useCallback(
    async (id: string): Promise<boolean> => {
      const slide = slidesRef.current.find((s) => s.id === id);
      if (!slide) return false;
      const cena = (slide.imgPrompt || "").trim();
      if (!cena) {
        patchSlide(id, {
          imgStatus: "erro",
          imgErro: "Sem prompt de imagem (IMGPROMPT).",
        } as Partial<T>);
        return false;
      }

      patchSlide(id, { imgStatus: "gerando", imgErro: undefined } as Partial<T>);
      try {
        const { dataUrl } = await gerarImagem({
          cena,
          estiloVisual: estilo.estiloVisual,
          negativePrompt: estilo.negativePrompt,
          formato: formatoDe(slide),
          modelo: estilo.modelo || undefined,
          apiKey: estilo.chaveGemini || undefined,
        });
        patchSlide(id, {
          fotoUrl: dataUrl,
          fotoOrigem: "ia",
          imgStatus: "ok",
          imgErro: undefined,
        } as Partial<T>);
        return true;
      } catch (err: any) {
        const msg =
          err instanceof ErroGerarImagem
            ? err.message
            : err?.message || "Erro ao gerar imagem.";
        patchSlide(id, { imgStatus: "erro", imgErro: msg } as Partial<T>);
        return false;
      }
    },
    [estilo.estiloVisual, estilo.negativePrompt, estilo.modelo, estilo.chaveGemini, formatoDe, patchSlide]
  );

  const gerarSlide = useCallback(
    async (id: string, opts?: { forcar?: boolean }) => {
      const slide = slidesRef.current.find((s) => s.id === id);
      if (!slide) return;
      if (!opts?.forcar && slide.fotoUrl && slide.fotoOrigem !== "ia") {
        const ok = window.confirm(
          "Este slide já tem uma foto manual. Substituir pela imagem gerada por IA?"
        );
        if (!ok) return;
      }
      const sucesso = await gerarSlidePorId(id);
      if (sucesso) status.sucesso("Imagem gerada!", 2000);
      else {
        const s = slidesRef.current.find((x) => x.id === id);
        status.erro(s?.imgErro || "Falha ao gerar a imagem.");
      }
    },
    [gerarSlidePorId, status]
  );

  const slidesPendentes = slides.filter(
    (s) => (s.imgPrompt || "").trim() && !s.fotoUrl
  ).length;

  const gerarLote = useCallback(async () => {
    const alvo = slidesRef.current.filter(
      (s) => (s.imgPrompt || "").trim() && !s.fotoUrl
    );
    if (alvo.length === 0) {
      status.erro(
        "Nenhum slide para gerar. Adicione IMGPROMPT nos slides que ainda não têm foto."
      );
      return;
    }
    setGerandoLote(true);
    let ok = 0;
    let falhas = 0;
    for (let i = 0; i < alvo.length; i++) {
      setProgresso({ atual: i + 1, total: alvo.length });
      const sucesso = await gerarSlidePorId(alvo[i].id);
      if (sucesso) ok++;
      else falhas++;
    }
    setGerandoLote(false);
    setProgresso(null);
    if (falhas === 0) {
      status.sucesso(`${ok} ${ok === 1 ? "imagem gerada" : "imagens geradas"}!`, 4000);
    } else {
      status.erro(
        `${ok} geradas, ${falhas} com erro. Veja os slides marcados e tente regerar.`
      );
    }
  }, [gerarSlidePorId, status]);

  return {
    ...estilo,
    gerandoLote,
    progresso,
    gerarSlide,
    gerarLote,
    slidesPendentes,
  };
}
