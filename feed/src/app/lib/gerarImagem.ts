/**
 * Geração de imagem com IA (Gemini / Nano Banana) — v7.8
 */

import { authHeaders } from "./supabaseClient";

export type FormatoImagem = "carrossel" | "feed" | "stories" | "linkedin" | "quadrado";

export interface ImagemSlide {
  id: string;
  imgPrompt?: string;
  fotoUrl?: string;
  fotoOrigem?: "ia" | "manual";
  imgStatus?: "idle" | "gerando" | "ok" | "erro";
  imgErro?: string;
}

const ASPECT_POR_FORMATO: Record<FormatoImagem, string> = {
  carrossel: "4:5",
  feed: "4:5",
  stories: "9:16",
  linkedin: "16:9",
  quadrado: "1:1",
};

export function aspectRatioDoFormato(formato: FormatoImagem): string {
  return ASPECT_POR_FORMATO[formato] || "4:5";
}

export const ESTILO_VISUAL_PADRAO =
  "Interior escandinavo clean e minimalista, paredes creme e amarelo quente, madeira de carvalho clara, mobiliário mid-century, espaço arejado e luminoso; luz natural de dia, quente e suave; figurino retrô relaxado; estética de cor Kodak Portra 400, grade quente porém limpa, contraste natural suave com pretos levemente elevados, halation sutil, saturação contida; pessoa brasileira real e diversa, expressão natural e espontânea; fotografia publicitária autêntica; foco nítido, lente 50mm, photoreal, 4k.";

export const NEGATIVE_PROMPT_PADRAO =
  "film grain, heavy noise, blur, soft focus, low resolution, peeling paint, decay, clutter, dark gloomy space, night, cool blue cast, oversharpened HDR, plastic waxy skin, stiff staged posing, tense or worried expression, neon colors, text, watermark, logo";

export interface ComporPromptOpcoes {
  cena: string;
  estiloVisual: string;
  negativePrompt?: string;
}

export function comporPromptFinal({
  cena,
  estiloVisual,
  negativePrompt,
}: ComporPromptOpcoes): string {
  const partes: string[] = [];
  const cenaLimpa = (cena || "").trim();
  const estiloLimpo = (estiloVisual || "").trim();
  const negativoLimpo = (negativePrompt || "").trim();

  if (cenaLimpa) partes.push(cenaLimpa);
  if (estiloLimpo) partes.push(estiloLimpo);

  let prompt = partes.join(". ");
  if (negativoLimpo) {
    prompt += `\n\nEvite / não inclua (negative prompt): ${negativoLimpo}.`;
  }
  return prompt.trim();
}

export class ErroGerarImagem extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ErroGerarImagem";
    this.status = status;
  }
}

/** Metadados de arquivamento no banco de imagens (Supabase). */
export interface BancoMeta {
  vertical?: string;
  mes?: string;
  semana?: string;
  peca?: string;
  slide?: number;
  layout?: string;
  tags?: string[];
}

export interface GerarImagemOpcoes {
  cena: string;
  estiloVisual: string;
  negativePrompt?: string;
  formato?: FormatoImagem;
  modelo?: string;
  imageSize?: string;
  apiKey?: string;
  /** v7.9.1: permite abortar a requisição (botão Cancelar). */
  signal?: AbortSignal;
  /** v7.11: metadados p/ o banco de imagens (arquivamento no Supabase). */
  banco?: BancoMeta;
}

export interface GerarImagemResultado {
  dataUrl: string;
  modelo: string;
  /** URL pública no banco de imagens, se o Supabase estiver configurado. */
  bancoUrl?: string;
}

export async function gerarImagem(
  opcoes: GerarImagemOpcoes
): Promise<GerarImagemResultado> {
  const cena = (opcoes.cena || "").trim();
  if (!cena) {
    throw new ErroGerarImagem(
      "Este slide não tem prompt de imagem (IMGPROMPT). Escreva uma descrição de cena antes de gerar."
    );
  }

  const aspectRatio = aspectRatioDoFormato(opcoes.formato || "carrossel");

  let resp: Response;
  try {
    resp = await fetch("/api/imagem", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({
        // A composição do prompt final é feita no servidor (rota /api/imagem),
        // que também escolhe o provedor (gemini/openrouter/openai) por env.
        cena,
        estiloVisual: opcoes.estiloVisual,
        negative: opcoes.negativePrompt,
        aspectRatio,
        model: opcoes.modelo,
        imageSize: opcoes.imageSize || "1K",
        ...(opcoes.apiKey ? { apiKey: opcoes.apiKey } : {}),
        ...(opcoes.banco ? { banco: opcoes.banco } : {}),
      }),
      signal: opcoes.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") throw err; // cancelamento — propaga
    throw new ErroGerarImagem(
      `Não foi possível chamar /api/imagem. Verifique se o endpoint está publicado na Vercel (${
        err?.message || err
      }).`
    );
  }

  if (!resp.ok) {
    const erro = await resp
      .json()
      .catch(() => ({ error: `Erro HTTP ${resp.status}` }));
    throw new ErroGerarImagem(erro.error || `Erro HTTP ${resp.status}`, resp.status);
  }

  const data = await resp.json();
  if (!data?.imagem) {
    throw new ErroGerarImagem(data?.error || "A API não retornou nenhuma imagem.");
  }

  return { dataUrl: data.imagem, modelo: data.modelo || "gemini", bancoUrl: data.bancoUrl || undefined };
}

export interface PresetEstilo {
  id: string;
  nome: string;
  estiloVisual: string;
  negativePrompt: string;
}

const PRESETS_KEY = "parceleaqui:estilo:presets:v1";

export function carregarPresets(): PresetEstilo[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && p.id && p.nome);
  } catch {
    return [];
  }
}

export function salvarPresets(presets: PresetEstilo[]): void {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // ignora
  }
}
