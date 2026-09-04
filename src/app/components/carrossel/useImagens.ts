import { useState, useCallback, useEffect, useRef } from "react";
import { authHeaders } from "../../lib/supabaseClient";
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
  } catch {}
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface StatusMinimo {
  sucesso: (msg: string, ms?: number) => void;
  erro: (msg: string, ms?: number) => void;
}

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
  const [estiloVisual, setEstiloVisualState] = useState(() => ler(KEY_ESTILO, ESTILO_VISUAL_PADRAO));
  const [negativePrompt, setNegativePromptState] = useState(() => ler(KEY_NEGATIVE, NEGATIVE_PROMPT_PADRAO));
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
    estiloVisual, setEstiloVisual, negativePrompt, setNegativePrompt,
    chaveGemini, setChaveGemini, modelo, setModelo, resetarEstiloPadrao,
    presets, salvarPresetAtual, aplicarPreset, removerPreset,
  };
}

// ============================================================
// useBancoConfig — metadados globais p/ arquivar no banco de imagens
// ============================================================
const KEY_BANCO = "parceleaqui:banco:v1";

export interface BancoConfig {
  vertical: string;
  mes: string;
  semana: string;
  peca: string;
  tags: string; // separada por vírgula na UI; vira array no envio
}

const BANCO_PADRAO: BancoConfig = { vertical: "", mes: "", semana: "", peca: "", tags: "" };

export interface BancoConfigControls {
  banco: BancoConfig;
  setBancoCampo: (campo: keyof BancoConfig, valor: string) => void;
  resetarBanco: () => void;
  /** Metadados base (sem slide/layout, que são por-slide). Tags viram array. */
  bancoMetaBase: () => {
    vertical?: string;
    mes?: string;
    semana?: string;
    peca?: string;
    tags?: string[];
  };
}

export function useBancoConfig(): BancoConfigControls {
  const [banco, setBanco] = useState<BancoConfig>(() => {
    try {
      const raw = localStorage.getItem(KEY_BANCO);
      if (raw) return { ...BANCO_PADRAO, ...JSON.parse(raw) };
    } catch {}
    return BANCO_PADRAO;
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY_BANCO, JSON.stringify(banco));
    } catch {}
  }, [banco]);

  const setBancoCampo = useCallback(
    (campo: keyof BancoConfig, valor: string) => setBanco((b) => ({ ...b, [campo]: valor })),
    []
  );
  const resetarBanco = useCallback(() => setBanco(BANCO_PADRAO), []);
  const bancoMetaBase = useCallback(() => {
    const s = (v: string) => (v.trim() ? v.trim() : undefined);
    const tags = banco.tags.split(",").map((x) => x.trim()).filter(Boolean);
    return {
      vertical: s(banco.vertical),
      mes: s(banco.mes),
      semana: s(banco.semana),
      peca: s(banco.peca),
      tags: tags.length ? tags : undefined,
    };
  }, [banco]);

  return { banco, setBancoCampo, resetarBanco, bancoMetaBase };
}

// ============================================================
// useImagens — geração por slide + lote com progresso e cancelar
// ============================================================
interface UseImagensOptions<T extends ImagemSlide> {
  slides: T[];
  setSlides: React.Dispatch<React.SetStateAction<T[]>>;
  status: StatusMinimo;
  formato?: FormatoImagem;
  resolverFormato?: (slide: T) => FormatoImagem;
  /** Rótulo do slide pro loader (ex.: KICKER). */
  rotularSlide?: (slide: T) => string;
}

export interface ProgressoLote {
  atual: number;
  total: number;
  rotulo?: string;
}

export interface UseImagensReturn<T extends ImagemSlide> extends EstiloVisualControls, BancoConfigControls {
  gerandoLote: boolean;
  progresso: ProgressoLote | null;
  gerarSlide: (id: string, opts?: { forcar?: boolean }) => Promise<void>;
  gerarLote: () => Promise<void>;
  cancelarLote: () => void;
  slidesPendentes: number;
}

export function useImagens<T extends ImagemSlide>({
  slides,
  setSlides,
  status,
  formato,
  resolverFormato,
  rotularSlide,
}: UseImagensOptions<T>): UseImagensReturn<T> {
  const estilo = useEstiloVisual(status);
  const banco = useBancoConfig();
  const bancoRef = useRef(banco);
  useEffect(() => {
    bancoRef.current = banco;
  }, [banco]);

  const [gerandoLote, setGerandoLote] = useState(false);
  const [progresso, setProgresso] = useState<ProgressoLote | null>(null);

  const slidesRef = useRef<T[]>(slides);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  const abortRef = useRef<AbortController | null>(null);
  const canceladoRef = useRef(false);

  const patchSlide = useCallback(
    (id: string, patch: Partial<T>) => {
      setSlides((lista) => lista.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [setSlides]
  );

  const formatoDe = useCallback(
    (slide: T): FormatoImagem => (resolverFormato ? resolverFormato(slide) : formato || "carrossel"),
    [resolverFormato, formato]
  );

  // Gera 1 slide. Retorna true (ok), false (erro) ou "cancel" (abortado).
  const gerarSlidePorId = useCallback(
    async (id: string, signal?: AbortSignal): Promise<boolean | "cancel"> => {
      const slide = slidesRef.current.find((s) => s.id === id);
      if (!slide) return false;
      const cena = (slide.imgPrompt || "").trim();
      if (!cena) {
        patchSlide(id, { imgStatus: "erro", imgErro: "Sem prompt de imagem (IMGPROMPT)." } as Partial<T>);
        return false;
      }
      patchSlide(id, { imgStatus: "gerando", imgErro: undefined } as Partial<T>);

      for (let tentativa = 0; tentativa < 2; tentativa++) {
        try {
          const idxBanco = slidesRef.current.findIndex((s) => s.id === id);
          const { dataUrl, bancoUrl } = await gerarImagem({
            cena,
            estiloVisual: estilo.estiloVisual,
            negativePrompt: estilo.negativePrompt,
            formato: formatoDe(slide),
            modelo: estilo.modelo || undefined,
            apiKey: estilo.chaveGemini || undefined,
            signal,
            banco: {
              ...bancoRef.current.bancoMetaBase(),
              slide: idxBanco >= 0 ? idxBanco + 1 : undefined,
              layout: (slide as any).layout || undefined,
            },
          });
          // v7.20.1: prefere a URL do Supabase (curta) ao base64 (pesado).
          // Base64 estourava a quota do localStorage e travava o html-to-image
          // ao compor a carrossel inteira. A imagem já foi salva no banco.
          patchSlide(id, {
            fotoUrl: bancoUrl || dataUrl,
            fotoOrigem: "ia",
            imgStatus: "ok",
            imgErro: undefined,
          } as Partial<T>);
          return true;
        } catch (err: any) {
          if (signal?.aborted || err?.name === "AbortError") {
            // cancelado: reverte o "gerando" pra idle, sem marcar erro
            patchSlide(id, { imgStatus: "idle", imgErro: undefined } as Partial<T>);
            return "cancel";
          }
          const st: number | undefined = err instanceof ErroGerarImagem ? err.status : undefined;
          const msg =
            err instanceof ErroGerarImagem ? err.message : err?.message || "Erro ao gerar imagem.";
          const retriavel = st === 429 || st === 408 || (typeof st === "number" && st >= 500);
          if (tentativa === 0 && retriavel) {
            await sleep(1500);
            continue;
          }
          patchSlide(id, { imgStatus: "erro", imgErro: msg } as Partial<T>);
          return false;
        }
      }
      return false;
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
      const r = await gerarSlidePorId(id);
      if (r === true) status.sucesso("Imagem gerada!", 2000);
      else if (r === false) {
        const s = slidesRef.current.find((x) => x.id === id);
        status.erro(s?.imgErro || "Falha ao gerar a imagem.");
      }
    },
    [gerarSlidePorId, status]
  );

  const slidesPendentes = slides.filter((s) => (s.imgPrompt || "").trim() && !s.fotoUrl).length;

  const cancelarLote = useCallback(() => {
    canceladoRef.current = true;
    abortRef.current?.abort();
  }, []);

  const gerarLote = useCallback(async () => {
    const alvo = slidesRef.current.filter((s) => (s.imgPrompt || "").trim() && !s.fotoUrl);
    if (alvo.length === 0) {
      status.erro("Nenhum slide para gerar. Adicione IMGPROMPT nos slides que ainda não têm foto.");
      return;
    }
    canceladoRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    setGerandoLote(true);

    let ok = 0;
    let falhas = 0;
    const total = alvo.length;
    for (let i = 0; i < alvo.length; i++) {
      if (canceladoRef.current) break;
      const id = alvo[i].id;
      const atualSlide = slidesRef.current.find((s) => s.id === id) || alvo[i];
      const idxDeck = slidesRef.current.findIndex((s) => s.id === id);
      const rot = rotularSlide ? rotularSlide(atualSlide).trim() : "";
      const rotulo = `Slide ${idxDeck + 1}${rot ? " — " + rot : ""}`;
      setProgresso({ atual: i + 1, total, rotulo });

      const r = await gerarSlidePorId(id, controller.signal);
      if (r === "cancel") break;
      if (r) ok++;
      else falhas++;
    }

    setGerandoLote(false);
    setProgresso(null);
    abortRef.current = null;

    // Rodada 4: avisava no Slack ao terminar o lote de geração.
    // v7.20: DESATIVADO — a aprovação agora sai no "Salvar slides"
    // (api/slides/finalizar) com o link da pasta no Drive, evitando spam ao
    // regenerar imagens. Mantido como referência.
    if (false && !canceladoRef.current && ok > 0) {
      try {
        const metaBanco = bancoRef.current.bancoMetaBase();
        await fetch("/api/slack/conferencia", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({
            peca: metaBanco.peca || "",
            semana: metaBanco.semana || "",
            mes: metaBanco.mes || "",
            n: ok,
            appUrl: typeof window !== "undefined" ? window.location.origin : "",
          }),
        });
      } catch {
        // notificação é best-effort — não afeta a geração
      }
    }

    if (canceladoRef.current) {
      status.sucesso(`Geração cancelada. ${ok} de ${total} concluídas.`, 4000);
    } else if (falhas === 0) {
      status.sucesso(`${ok} ${ok === 1 ? "imagem gerada" : "imagens geradas"}!`, 4000);
    } else {
      status.erro(`${ok} geradas, ${falhas} com erro. Use "Regerar" nos slides marcados.`);
    }
  }, [gerarSlidePorId, status, rotularSlide]);

  return {
    ...estilo,
    ...banco,
    gerandoLote,
    progresso,
    gerarSlide,
    gerarLote,
    cancelarLote,
    slidesPendentes,
  };
}
