/**
 * Vercel Function: /api/imagem
 *
 * Proxy para a API de imagem do Gemini (linha "Nano Banana").
 * Mantém a GEMINI_API_KEY segura no servidor.
 *
 * Configure a chave em: Vercel Dashboard → Project → Settings → Environment Variables
 *   Nome: GEMINI_API_KEY
 *   Valor: (chave do Google AI Studio — https://aistudio.google.com/apikey)
 *
 * Alternativa: o usuário pode informar a própria chave no app; ela é enviada
 * no corpo (campo `apiKey`) e tem prioridade sobre a do servidor. Útil quando
 * cada pessoa usa a própria cota, sem redeploy.
 *
 * O frontend chama POST /api/imagem com:
 *   { prompt, aspectRatio?, model?, imageSize?, apiKey? }
 * e recebe:
 *   { imagem: "data:image/png;base64,....", modelo, mimeType }  ou  { error }
 *
 * API de referência (07/2026): generateContent com responseModalities=["IMAGE"]
 * e generationConfig.imageConfig.aspectRatio.
 * https://ai.google.dev/gemini-api/docs/image-generation
 *
 * v7.8.0 — feature de geração de imagens com IA.
 */

export const config = {
  runtime: "edge",
};

// Modelos de imagem válidos (Google AI). Confirme IDs atuais na doc oficial.
const MODELOS_PERMITIDOS = [
  "gemini-2.5-flash-image", // Nano Banana — estável, camada grátis generosa (default)
  "gemini-3-pro-image",     // Nano Banana Pro — qualidade superior (se disponível na conta)
  "gemini-3-flash-image",   // Nano Banana 2
];

const MODELO_DEFAULT = "gemini-2.5-flash-image";

// Proporções suportadas pelo Gemini (subset relevante ao app).
const ASPECTOS_VALIDOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];

// Status que justificam avisar o usuário de sobrecarga (não fatal de config).
const STATUS_SOBRECARGA = [429, 500, 502, 503, 504];

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Use POST" }, 405);
  }

  let body: {
    prompt?: string;
    aspectRatio?: string;
    model?: string;
    imageSize?: string;
    apiKey?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido no corpo da requisição." }, 400);
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt) {
    return json({ error: "Campo 'prompt' é obrigatório." }, 400);
  }

  // Chave: prioridade para a do usuário (bring-your-own-key); senão, a do servidor.
  const apiKey = (body.apiKey || "").trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          "Chave do Gemini não configurada. Informe sua chave no painel 'Estilo visual' do app, ou defina GEMINI_API_KEY em: Vercel Dashboard → Project → Settings → Environment Variables. Gere uma chave grátis em https://aistudio.google.com/apikey",
      },
      500
    );
  }

  const modelo = MODELOS_PERMITIDOS.includes(body.model || "")
    ? (body.model as string)
    : MODELO_DEFAULT;

  const aspectRatio = ASPECTOS_VALIDOS.includes(body.aspectRatio || "")
    ? (body.aspectRatio as string)
    : "4:5";

  const imageSize = ["1K", "2K", "4K"].includes(body.imageSize || "")
    ? (body.imageSize as string)
    : "1K";

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

  let resp: Response;
  try {
    resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      }),
    });
  } catch (err: any) {
    return json(
      { error: `Erro de rede ao chamar o Gemini: ${err?.message || String(err)}` },
      502
    );
  }

  if (!resp.ok) {
    const textoErro = await resp.text().catch(() => "");
    return json({ error: traduzirErro(resp.status, textoErro) }, resp.status === 401 ? 401 : 502);
  }

  let data: any;
  try {
    data = await resp.json();
  } catch {
    return json({ error: "Resposta do Gemini não pôde ser lida." }, 502);
  }

  // Procura a primeira parte com imagem inline (base64).
  const partes: any[] = data?.candidates?.[0]?.content?.parts || [];
  const parteImagem = partes.find((p) => p?.inlineData?.data || p?.inline_data?.data);
  const inline = parteImagem?.inlineData || parteImagem?.inline_data;

  if (!inline?.data) {
    // Pode ter vindo bloqueado por segurança ou só texto.
    const motivoBloqueio =
      data?.candidates?.[0]?.finishReason ||
      data?.promptFeedback?.blockReason ||
      "";
    const textoResposta = partes.find((p) => p?.text)?.text;
    return json(
      {
        error: motivoBloqueio
          ? `O Gemini não retornou imagem (motivo: ${motivoBloqueio}). Ajuste o prompt da cena e tente de novo.`
          : textoResposta
          ? `O modelo respondeu em texto em vez de imagem. Reformule o prompt da cena.`
          : "O Gemini não retornou nenhuma imagem. Tente novamente.",
      },
      502
    );
  }

  const mimeType = inline.mimeType || inline.mime_type || "image/png";
  const dataUrl = `data:${mimeType};base64,${inline.data}`;

  return json({ imagem: dataUrl, modelo, mimeType });
}

// ============================================================
// HELPERS
// ============================================================

function traduzirErro(status: number, textoErro: string): string {
  const erro = (textoErro || "").toLowerCase();

  if (status === 400 && erro.includes("api key")) {
    return "Chave do Gemini inválida ou mal formatada (verifique em aistudio.google.com/apikey).";
  }
  if (status === 401 || status === 403) {
    return "Chave do Gemini inválida, revogada ou sem permissão para gerar imagens.";
  }
  if (status === 429) {
    return "Cota do Gemini estourada (rate limit). Aguarde um minuto e tente de novo, ou use outra chave.";
  }
  if (STATUS_SOBRECARGA.includes(status)) {
    return "Gemini com erro temporário. Tente novamente em alguns segundos.";
  }
  if (erro.includes("safety") || erro.includes("blocked")) {
    return "Prompt bloqueado por política de segurança. Ajuste a descrição da cena.";
  }
  return `Erro HTTP ${status} do Gemini: ${(textoErro || "").slice(0, 200)}`;
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
