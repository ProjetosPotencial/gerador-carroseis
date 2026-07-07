/**
 * Geração de imagem com IA (Gemini / Nano Banana) — v7.8
 *
 * Responsável por:
 *  - Compor o prompt final em 3 camadas (cena + estilo visual + negativo).
 *  - Mapear o formato ativo do app para o aspect ratio suportado pelo Gemini.
 *  - Chamar o proxy /api/imagem e devolver um data URL pronto pro slot de foto.
 *
 * A "saída técnica" (proporção e resolução) NÃO vai no texto do prompt — vai
 * pelos parâmetros aspectRatio/imageSize da API. Por isso o IMGPROMPT descreve
 * apenas a cena, e a estética/proporção são responsabilidade do app.
 */

// ============================================================
// FORMATO ATIVO → ASPECT RATIO
// ============================================================

/** Formatos do app que mapeiam para proporções do Gemini. */
export type FormatoImagem = "carrossel" | "feed" | "stories" | "linkedin" | "quadrado";

/**
 * Formato mínimo de slide que o hook de geração precisa. Qualquer editor
 * (carrossel, feed/stories) cujo slide tenha estes campos pode reusar useImagens.
 */
export interface ImagemSlide {
  id: string;
  imgPrompt?: string;
  fotoUrl?: string;
  fotoOrigem?: "ia" | "manual";
  imgStatus?: "idle" | "gerando" | "ok" | "erro";
  imgErro?: string;
}

const ASPECT_POR_FORMATO: Record<FormatoImagem, string> = {
  carrossel: "4:5", // Instagram carrossel (1080x1350)
  feed: "4:5",
  stories: "9:16",
  linkedin: "16:9", // capa LinkedIn (1280x720)
  quadrado: "1:1",
};

export function aspectRatioDoFormato(formato: FormatoImagem): string {
  return ASPECT_POR_FORMATO[formato] || "4:5";
}

// ============================================================
// DEFAULTS DE ESTILO (Design System Parcele Aqui v1.1 — Fotografia)
// ============================================================

/** Estética fixa aplicada a todas as imagens da sessão. Editável pelo usuário. */
export const ESTILO_VISUAL_PADRAO =
  "Interior escandinavo clean e minimalista, paredes creme e amarelo quente, madeira de carvalho clara, mobiliário mid-century, espaço arejado e luminoso; luz natural de dia, quente e suave; figurino retrô relaxado; estética de cor Kodak Portra 400, grade quente porém limpa, contraste natural suave com pretos levemente elevados, halation sutil, saturação contida; pessoa brasileira real e diversa, expressão natural e espontânea; fotografia publicitária autêntica; foco nítido, lente 50mm, photoreal, 4k.";

/** Prompt negativo global (exclusões). O grão NÃO vai no positivo (aplicado em pós). */
export const NEGATIVE_PROMPT_PADRAO =
  "film grain, heavy noise, blur, soft focus, low resolution, peeling paint, decay, clutter, dark gloomy space, night, cool blue cast, oversharpened HDR, plastic waxy skin, stiff staged posing, tense or worried expression, neon colors, text, watermark, logo";

// ============================================================
// COMPOSIÇÃO DO PROMPT FINAL
// ============================================================

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

// ============================================================
// CHAMADA À API (via Vercel Function /api/imagem)
// ============================================================

export class ErroGerarImagem extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErroGerarImagem";
  }
}

export interface GerarImagemOpcoes {
  cena: string;
  estiloVisual: string;
  negativePrompt?: string;
  formato?: FormatoImagem;
  modelo?: string;
  imageSize?: string;
  apiKey?: string;
}

export interface GerarImagemResultado {
  dataUrl: string;
  modelo: string;
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

  const prompt = comporPromptFinal({
    cena,
    estiloVisual: opcoes.estiloVisual,
    negativePrompt: opcoes.negativePrompt,
  });

  const aspectRatio = aspectRatioDoFormato(opcoes.formato || "carrossel");

  let resp: Response;
  try {
    resp = await fetch("/api/imagem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        aspectRatio,
        model: opcoes.modelo,
        imageSize: opcoes.imageSize || "1K",
        ...(opcoes.apiKey ? { apiKey: opcoes.apiKey } : {}),
      }),
    });
  } catch (err: any) {
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
    throw new ErroGerarImagem(erro.error || `Erro HTTP ${resp.status}`);
  }

  const data = await resp.json();
  if (!data?.imagem) {
    throw new ErroGerarImagem(data?.error || "A API não retornou nenhuma imagem.");
  }

  return { dataUrl: data.imagem, modelo: data.modelo || "gemini" };
}

// ============================================================
// PRESETS DE ESTILO (persistidos em localStorage)
// ============================================================

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
    // localStorage indisponível — ignora
  }
}
