import { toPng } from "html-to-image";

/**
 * Dimensões do design base. PRECISAM bater com as do LinkedInCover.tsx.
 * Mudamos de 1200×675 para 1280×720 para gerar a PNG em 1:1,
 * sem precisar de pixelRatio e sem espaço branco nas bordas.
 */
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

/** Tamanho final padrão da saída (igual ao base → captura 1:1). */
export const TAMANHO_LINKEDIN = { width: BASE_WIDTH, height: BASE_HEIGHT } as const;

// ============================================================
// VALIDAÇÃO DE URLS DE IMAGEM
// ============================================================

/**
 * Verifica se uma URL pode ser carregada como imagem.
 * Retorna `true` se a imagem carregou, `false` se falhou (404, CORS, etc.).
 *
 * Usa `new Image()` por ser o teste mais fiel ao que o html-to-image
 * vai fazer internamente — se a imagem carregar aqui, ela carrega lá.
 */
function urlCarregaComoImagem(src: string, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(false);
      return;
    }
    // data URLs sempre carregam
    if (src.startsWith("data:")) {
      resolve(true);
      return;
    }

    const img = new Image();
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }

    const timer = window.setTimeout(() => {
      // Timeout de carregamento — trata como falha
      img.onload = null;
      img.onerror = null;
      resolve(false);
    }, timeoutMs);

    img.onload = () => {
      window.clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    img.src = src;
  });
}

/**
 * Mensagem amigável pra cada tipo de URL que tipicamente quebra.
 */
function mensagemErroUrl(src: string): string {
  // Caminhos /assets/<hash>.png são referências que vinham do Figma Make
  // e podem não existir no build de produção da Vercel.
  if (/^\/assets\/[a-f0-9]+\.(png|jpg|jpeg|webp|gif)$/i.test(src)) {
    return (
      "A imagem padrão da capa não está disponível no servidor. " +
      "Selecione uma foto na biblioteca ou faça upload de uma imagem antes de baixar."
    );
  }
  if (src.startsWith("/assets/")) {
    return (
      "Não foi possível carregar uma imagem local da capa. " +
      "Tente trocar a foto antes de baixar."
    );
  }
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return (
      "Não foi possível carregar a foto externa. " +
      "Verifique se a URL é válida ou troque por outra imagem."
    );
  }
  return "Não foi possível carregar uma das imagens da capa. Troque a imagem e tente novamente.";
}

/**
 * Pré-valida todas as imagens dentro de um elemento.
 * Retorna lista de URLs que falharam.
 */
async function validarImagensDoElemento(container: HTMLElement): Promise<string[]> {
  const imgs = Array.from(container.querySelectorAll("img"));
  const urls = imgs.map((i) => i.src).filter(Boolean);

  const resultados = await Promise.all(
    urls.map(async (url) => ({ url, ok: await urlCarregaComoImagem(url) }))
  );

  return resultados.filter((r) => !r.ok).map((r) => r.url);
}

// ============================================================
// PRELOAD (mantido pro path feliz)
// ============================================================

/**
 * Pré-carrega uma imagem forçando CORS anônimo.
 * data URLs (upload local) resolvem instantaneamente sem crossOrigin.
 *
 * IMPORTANTE: nunca rejeita — sempre resolve, mesmo em erro.
 * O tratamento de imagens quebradas fica em validarImagensDoElemento()
 * (que roda antes) e no filter() do toPng (que roda depois).
 */
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

async function preloadAllImages(container: HTMLElement): Promise<void> {
  const images = container.querySelectorAll("img");
  const urls = Array.from(images)
    .map((img) => img.src)
    .filter((src) => !!src);
  await Promise.all(urls.map(preloadImage));
}

// ============================================================
// CONVERSÃO ROBUSTA DE ERROS
// ============================================================

/**
 * Converte qualquer erro (Error, Event, string, objeto) em um Error com mensagem útil.
 *
 * Sem isso, html-to-image às vezes rejeita com um Event do DOM (quando uma img
 * interna falha no clone), e `String(event)` vira o famigerado "[object Event]".
 */
function normalizarErro(err: unknown): Error {
  if (err instanceof Error) return err;

  // Event do DOM (img.onerror, etc.)
  if (typeof Event !== "undefined" && err instanceof Event) {
    const target = err.target as HTMLImageElement | null;
    const src = target?.src;
    if (target?.tagName === "IMG" && src) {
      return new Error(mensagemErroUrl(src));
    }
    return new Error(
      "Falha ao carregar um recurso da página. Recarregue e tente novamente."
    );
  }

  if (typeof err === "string") return new Error(err);

  if (err && typeof err === "object") {
    const anyErr = err as { message?: string };
    if (typeof anyErr.message === "string" && anyErr.message) {
      return new Error(anyErr.message);
    }
  }

  return new Error("Erro desconhecido ao gerar a imagem.");
}

// ============================================================
// GERAÇÃO DO PNG
// ============================================================

export interface TamanhoSaida {
  width: number;
  height: number;
}

export interface GerarOpcoes {
  /** Tamanho final da imagem (padrão 1280×720 — ideal LinkedIn) */
  tamanho?: TamanhoSaida;
  /** Pular validação prévia (útil pra geração em lote já validada). */
  pularValidacao?: boolean;
}

export interface GerarDownloadOpcoes extends GerarOpcoes {
  nomeArquivo: string;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Gera o dataURL PNG do elemento em 1:1 com suas dimensões reais.
 *
 * Como o componente já renderiza em 1280×720, NÃO usamos pixelRatio
 * nem canvasWidth/Height — isso evita o bug de espaço em branco
 * quando o canvas fica maior que o conteúdo renderizado.
 *
 * Se `tamanho` for diferente do base, aplicamos pixelRatio proporcional
 * (válido só quando as proporções batem: 16:9).
 */
async function gerarDataURL(
  elemento: HTMLElement,
  tamanho: TamanhoSaida = TAMANHO_LINKEDIN,
  pularValidacao = false
): Promise<string> {
  // 0. Pré-validação: detecta URLs quebradas ANTES do toPng,
  //    pra dar erro humano em vez de "[object Event]".
  if (!pularValidacao) {
    const urlsQuebradas = await validarImagensDoElemento(elemento);
    if (urlsQuebradas.length > 0) {
      throw new Error(mensagemErroUrl(urlsQuebradas[0]));
    }
  }

  // 1. Fontes
  await document.fonts.ready;

  // 2. Pré-carrega imagens
  await preloadAllImages(elemento);

  // 3. Espera frame (garante layout estabilizado)
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // 4. Calcula pixelRatio só se saída for diferente do base
  const pixelRatio = tamanho.width === BASE_WIDTH ? 1 : tamanho.width / BASE_WIDTH;

  // 5. Gera o PNG
  try {
    const dataUrl = await toPng(elemento, {
      cacheBust: true,
      pixelRatio,
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
      backgroundColor: "#ffffff",
      skipFonts: false,
      fetchRequestInit: {
        cache: "no-cache",
        mode: "cors",
        credentials: "omit",
      },
      filter: (node: HTMLElement) => {
        if (node.tagName === "IFRAME") return false;
        if (node.tagName === "IMG") {
          const img = node as HTMLImageElement;
          if (img.src && (!img.complete || img.naturalWidth === 0)) {
            console.warn("[gerarCapa] Pulando imagem quebrada:", img.src);
            return false;
          }
        }
        return true;
      },
    });

    return dataUrl;
  } catch (raw) {
    // html-to-image às vezes rejeita com um Event do DOM
    throw normalizarErro(raw);
  }
}

/** Converte um data URL (base64) em Blob. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Gera uma PNG e retorna o Blob (sem disparar download).
 * Útil para agrupar múltiplas imagens num ZIP.
 */
export async function gerarCapaBlob(
  elemento: HTMLElement,
  opcoes: GerarOpcoes = {}
): Promise<Blob> {
  const dataUrl = await gerarDataURL(elemento, opcoes.tamanho, opcoes.pularValidacao);
  return dataUrlToBlob(dataUrl);
}

/** Gera um PNG do elemento e dispara o download automático. */
export async function gerarCapaPNG(
  elemento: HTMLElement,
  opcoes: GerarDownloadOpcoes
): Promise<boolean> {
  try {
    const dataUrl = await gerarDataURL(
      elemento,
      opcoes.tamanho,
      opcoes.pularValidacao
    );

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = opcoes.nomeArquivo.endsWith(".png")
      ? opcoes.nomeArquivo
      : `${opcoes.nomeArquivo}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    opcoes.onSuccess?.();
    return true;
  } catch (raw) {
    const error = normalizarErro(raw);
    console.error("[gerarCapaPNG] Erro:", error);
    opcoes.onError?.(error);
    return false;
  }
}
