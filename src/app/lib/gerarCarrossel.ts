import { toPng, getFontEmbedCSS } from "html-to-image";
import JSZip from "jszip";

/**
 * v7.7.11: dimensões agora são DETECTADAS dinamicamente do elemento,
 * em vez de hardcoded 1080x1350. Isso corrige o bug de Stories cortado
 * no export — antes, qualquer slide (incluindo 1080x1920) era capturado
 * como 1080x1350 e o resultado saía cortado embaixo.
 *
 * Como funciona:
 *  - Lê `getBoundingClientRect()` do elemento renderizado
 *  - Aplica pixelRatio pra ter resolução final em 1080×altura
 *  - Funciona pra Feed (1080x1350), Stories (1080x1920), ou qualquer
 *    futuro formato sem precisar tocar nesse arquivo.
 */

// v7.20.2: pré-computa o CSS das fontes UMA vez (com timeout de segurança).
// Antes, o html-to-image tentava baixar+embutir dezenas de arquivos do Google
// Fonts (cross-origin) em CADA slide — o que travava o "Salvar slides" no slide 1.
// Agora computa 1x, cacheia, e reusa em todos os slides. Se travar/demorar,
// cai pra "" (fontes já carregadas na página são usadas na rasterização).
let _fontCssCache: string | null = null;
export async function fontCssUmaVez(): Promise<string> {
  if (_fontCssCache !== null) return _fontCssCache;
  try {
    _fontCssCache = await Promise.race([
      getFontEmbedCSS(document.body),
      new Promise<string>((_, rej) => setTimeout(() => rej(new Error("timeout")), 20000)),
    ]);
  } catch {
    _fontCssCache = "";
  }
  return _fontCssCache;
}

/** Pré-carrega uma imagem forçando CORS anônimo. */
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

/**
 * Gera o dataURL PNG de um único slide com dimensões dinâmicas.
 *
 * v7.7.11: detecta as dimensões REAIS do elemento renderizado em vez de
 * usar 1080x1350 fixo. Multiplica pelo pixelRatio pra exportar sempre
 * em 1080 de largura (e altura proporcional, ex: 1350 feed, 1920 stories).
 */
export async function gerarSlideDataURL(elemento: HTMLElement): Promise<string> {
  await document.fonts.ready;
  await preloadAllImages(elemento);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Dimensões REAIS do elemento renderizado (em px de tela, com escala aplicada)
  const fontEmbedCSS = await fontCssUmaVez();
  const rect = elemento.getBoundingClientRect();
  const larguraTela = rect.width;
  const alturaTela = rect.height;

  // O preview costuma estar em escala (ex: 50%) pra caber na UI.
  // Pra exportar em 1080 de largura, calculo o pixelRatio necessário:
  const LARGURA_FINAL = 1080;
  const pixelRatio = LARGURA_FINAL / larguraTela;
  const alturaFinal = Math.round(alturaTela * pixelRatio);

  const dataUrl = await toPng(elemento, {
    cacheBust: true,
    pixelRatio,
    width: larguraTela,
    height: alturaTela,
    canvasWidth: LARGURA_FINAL,
    canvasHeight: alturaFinal,
    backgroundColor: "#0a0a0a",
    fontEmbedCSS,
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
          console.warn("[gerarCarrossel] Pulando imagem quebrada:", img.src);
          return false;
        }
      }
      return true;
    },
  });

  return dataUrl;
}

/** Converte dataURL em Blob. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export interface SlideRef {
  index: number;
  element: HTMLDivElement;
}

export interface GerarCarrosselOpcoes {
  slides: SlideRef[];
  nomeBase: string;
  onProgress?: (atual: number, total: number) => void;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Gera PNG de um único slide e dispara download.
 * Usado pelo botão "Baixar este slide" no card individual (v7.7.11).
 */
export async function baixarSlideUnico(
  elemento: HTMLElement,
  nomeArquivo: string
): Promise<boolean> {
  try {
    const dataUrl = await gerarSlideDataURL(elemento);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = nomeArquivo.endsWith(".png") ? nomeArquivo : `${nomeArquivo}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error("[baixarSlideUnico] Erro:", err);
    return false;
  }
}

/**
 * Gera todos os slides, empacota num ZIP e dispara download.
 */
export async function baixarCarrosselZIP(opcoes: GerarCarrosselOpcoes): Promise<boolean> {
  const { slides, nomeBase, onProgress, onSuccess, onError } = opcoes;

  try {
    const zip = new JSZip();
    const pasta = zip.folder(nomeBase);
    if (!pasta) throw new Error("Falha ao criar pasta no ZIP.");

    for (let i = 0; i < slides.length; i++) {
      const { index, element } = slides[i];
      onProgress?.(i + 1, slides.length);

      // v7.20.3: isola o slide da captura (esconde os outros) p/ toPng rápido.
      slides.forEach((sl, j) => { if (j !== i) sl.element.style.display = "none"; });
      let dataUrl: string;
      try {
        dataUrl = await gerarSlideDataURL(element);
      } finally {
        slides.forEach((sl) => { sl.element.style.display = ""; });
      }
      const blob = dataUrlToBlob(dataUrl);
      const nomeSlide = `slide-${index + 1}.png`;
      pasta.file(nomeSlide, blob);
    }

    // Gera e baixa o ZIP
    const conteudo = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(conteudo);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nomeBase}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onSuccess?.();
    return true;
  } catch (err: any) {
    const error = err instanceof Error ? err : new Error(String(err?.message || err));
    console.error("[baixarCarrosselZIP] Erro:", error);
    onError?.(error);
    return false;
  }
}
