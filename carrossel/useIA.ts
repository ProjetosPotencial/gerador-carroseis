import { useState, useCallback, useMemo } from "react";
import {
  gerarPromptParaIA,
  parsearRespostaIA,
  ErroParseIA,
  chamarIADireto,
} from "../../lib/formatarCarrossel";
import type { SlideData, TemaConfig } from "../temas/tipos";
import type { UseStatusReturn } from "./useStatus";

interface UseIAOptions {
  slides: SlideData[];
  setSlides: React.Dispatch<React.SetStateAction<SlideData[]>>;
  setIndiceAtivo: React.Dispatch<React.SetStateAction<number>>;
  marca: string;
  temaAtivo: TemaConfig;
  status: UseStatusReturn;
}

export interface UseIAReturn {
  temaIA: string;
  setTemaIA: React.Dispatch<React.SetStateAction<string>>;
  respostaIA: string;
  setRespostaIA: React.Dispatch<React.SetStateAction<string>>;
  modeloIA: string;
  setModeloIA: React.Dispatch<React.SetStateAction<string>>;
  chaveManualIA: string;
  atualizarChaveManual: (v: string) => void;
  promptCopiado: boolean;
  promptGerado: string;
  gerandoViaAPI: boolean;
  copiarPrompt: () => Promise<void>;
  formatarResposta: () => void;
  gerarViaAPI: () => Promise<void>;
}

/**
 * Centraliza state e handlers da IA (modo simples + avançado).
 * Persiste a chave manual no localStorage.
 */
export function useIA({
  slides,
  setSlides,
  setIndiceAtivo,
  marca,
  temaAtivo,
  status,
}: UseIAOptions): UseIAReturn {
  const [temaIA, setTemaIA] = useState("");
  const [respostaIA, setRespostaIA] = useState("");
  const [modeloIA, setModeloIA] = useState("anthropic/claude-3.5-sonnet");
  const [promptCopiado, setPromptCopiado] = useState(false);
  const [gerandoViaAPI, setGerandoViaAPI] = useState(false);

  const [chaveManualIA, setChaveManualIA] = useState<string>(() => {
    try {
      return localStorage.getItem("openrouter_api_key_manual") || "";
    } catch {
      return "";
    }
  });

  const atualizarChaveManual = useCallback((nova: string) => {
    setChaveManualIA(nova);
    try {
      if (nova.trim()) {
        localStorage.setItem("openrouter_api_key_manual", nova.trim());
      } else {
        localStorage.removeItem("openrouter_api_key_manual");
      }
    } catch {
      // localStorage indisponível — não bloqueia uso
    }
  }, []);

  const promptGerado = useMemo(() => {
    if (!temaIA.trim()) return "";
    return gerarPromptParaIA({
      tema: temaIA,
      numeroSlides: slides.length,
      marca,
      temaVisual: temaAtivo,
    });
  }, [temaIA, slides.length, marca, temaAtivo]);

  const copiarPrompt = useCallback(async () => {
    if (!promptGerado) return;
    try {
      await navigator.clipboard.writeText(promptGerado);
      setPromptCopiado(true);
      setTimeout(() => setPromptCopiado(false), 2500);
    } catch {
      status.erro(
        "Não foi possível copiar automaticamente. Selecione o texto do prompt e copie manualmente."
      );
    }
  }, [promptGerado, status]);

  const formatarResposta = useCallback(() => {
    try {
      const novos = parsearRespostaIA(respostaIA);
      const comFotos: SlideData[] = novos.map((n, i) => ({
        ...n,
        fotoUrl: slides[i]?.fotoUrl || "",
        fotoUrl2: slides[i]?.fotoUrl2 || "",
      }));
      setSlides(comFotos);
      setIndiceAtivo(0);
      setRespostaIA("");
      status.sucesso(`${novos.length} slides formatados com sucesso!`);
    } catch (err: any) {
      const msg =
        err instanceof ErroParseIA
          ? err.message
          : err?.message || "Erro ao processar a resposta.";
      status.erro(msg);
    }
  }, [respostaIA, slides, setSlides, setIndiceAtivo, status]);

  const gerarViaAPI = useCallback(async () => {
    if (!temaIA.trim()) {
      status.erro("Descreva o tema antes de gerar.");
      return;
    }
    setGerandoViaAPI(true);
    try {
      const resultado = await chamarIADireto({
        tema: temaIA,
        numeroSlides: slides.length,
        marca,
        temaVisual: temaAtivo,
        modelo: modeloIA,
        apiKey: chaveManualIA.trim() || undefined,
      });
      const comFotos: SlideData[] = resultado.slides.map((n, i) => ({
        ...n,
        fotoUrl: slides[i]?.fotoUrl || "",
        fotoUrl2: slides[i]?.fotoUrl2 || "",
      }));
      setSlides(comFotos);
      setIndiceAtivo(0);
      setRespostaIA("");
      status.sucesso(
        `${resultado.slides.length} slides gerados via ${resultado.modelo
          .split("/")
          .pop()}!`,
        4000
      );
    } catch (err: any) {
      const msg =
        err instanceof ErroParseIA
          ? err.message
          : err?.message || "Erro ao chamar a API.";
      status.erro(msg);
    } finally {
      setGerandoViaAPI(false);
    }
  }, [
    temaIA,
    slides,
    setSlides,
    setIndiceAtivo,
    marca,
    temaAtivo,
    modeloIA,
    chaveManualIA,
    status,
  ]);

  return {
    temaIA,
    setTemaIA,
    respostaIA,
    setRespostaIA,
    modeloIA,
    setModeloIA,
    chaveManualIA,
    atualizarChaveManual,
    promptCopiado,
    promptGerado,
    gerandoViaAPI,
    copiarPrompt,
    formatarResposta,
    gerarViaAPI,
  };
}
