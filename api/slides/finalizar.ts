/**
 * Vercel Function: POST /api/slides/finalizar — v7.20
 *
 * Depois que os slides finais já foram salvos no Supabase, copia cada PNG
 * para a PASTA DA SEMANA no Google Drive (o mesmo Drive do conteúdo:
 * DRIVE_CONTENT_FOLDER_ID) em "…/{Mês}/Semana NN …/Artes Finais/{Peça}/" e
 * manda o link dessa pasta no Slack para aprovação.
 *
 * Best-effort: se o Google Drive não estiver configurado, devolve
 * { configured:false } sem quebrar o fluxo (o Supabase já guardou as artes).
 *
 * Envs: GOOGLE_SERVICE_ACCOUNT_KEY (JSON ou base64), DRIVE_CONTENT_FOLDER_ID,
 * SLACK_WEBHOOK_URL, SLACK_MENCOES, APP_URL, EMAILS_AUTORIZADOS, SUPABASE_*.
 */
import { createSign } from "node:crypto";

export const maxDuration = 60;

// ---- auth das rotas (inline; lib/ não empacota no Vercel) ----
async function verificarAcesso(
  req: Request
): Promise<{ ok: boolean; email?: string; erro?: string; status?: number }> {
  const allow = (process.env.EMAILS_AUTORIZADOS || "").trim();
  if (!allow) return { ok: true };
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: true };
  const auth = req.headers.get("authorization") || "";
  const token = /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, "").trim() : "";
  if (!token) return { ok: false, status: 401, erro: "Não autenticado." };
  try {
    const r = await fetch(base.replace(/\/+$/, "") + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: key },
    });
    if (!r.ok) return { ok: false, status: 401, erro: "Sessão inválida ou expirada." };
    const u = await r.json();
    const email = String(u?.email || "").toLowerCase();
    const lista = allow.toLowerCase().split(/[\s,;]+/).filter(Boolean);
    if (email && lista.includes(email)) return { ok: true, email };
    return { ok: false, status: 403, erro: "E-mail não autorizado." };
  } catch {
    return { ok: false, status: 401, erro: "Falha ao validar a sessão." };
  }
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

async function enviarSlack(texto: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  const mencoes = (process.env.SLACK_MENCOES || "").trim();
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: mencoes ? `${texto} ${mencoes}` : texto }),
    });
  } catch {}
}

// ---- Google service account (JWT RS256 -> access token, escopo de ESCRITA) ----
function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function lerServiceAccount(): any | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    const txt = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
async function getAccessToken(sa: any): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
    const claim = b64url(
      Buffer.from(
        JSON.stringify({
          iss: sa.client_email,
          scope: "https://www.googleapis.com/auth/drive",
          aud: "https://oauth2.googleapis.com/token",
          iat: now,
          exp: now + 3600,
        })
      )
    );
    const signInput = header + "." + claim;
    const signer = createSign("RSA-SHA256");
    signer.update(signInput);
    signer.end();
    const signature = b64url(signer.sign(sa.private_key));
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${signInput}.${signature}`,
      }),
    });
    const d = await r.json();
    return d.access_token || null;
  } catch {
    return null;
  }
}
async function driveList(token: string, q: string): Promise<any[]> {
  const url =
    "https://www.googleapis.com/drive/v3/files?" +
    new URLSearchParams({
      q,
      fields: "files(id,name,mimeType,webViewLink)",
      pageSize: "200",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
  const r = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  const d = await r.json();
  return Array.isArray(d.files) ? d.files : [];
}
async function driveCreateFolder(token: string, name: string, parent: string): Promise<any | null> {
  const r = await fetch(
    "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parent],
      }),
    }
  );
  if (!r.ok) return null;
  return await r.json();
}
async function acharOuCriarPasta(token: string, name: string, parent: string): Promise<any | null> {
  const nomeEsc = name.replace(/'/g, "\\'");
  const achados = await driveList(
    token,
    `'${parent}' in parents and name='${nomeEsc}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  if (achados.length) return achados[0];
  return await driveCreateFolder(token, name, parent);
}
async function apagarPorNome(token: string, name: string, parent: string): Promise<void> {
  const nomeEsc = name.replace(/'/g, "\\'");
  const achados = await driveList(
    token,
    `'${parent}' in parents and name='${nomeEsc}' and trashed=false`
  );
  for (const f of achados) {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${f.id}?supportsAllDrives=true`,
      { method: "DELETE", headers: { Authorization: "Bearer " + token } }
    ).catch(() => {});
  }
}
async function subirPng(token: string, name: string, parent: string, bytes: Buffer): Promise<boolean> {
  const boundary = "==bd" + Date.now().toString(36);
  const meta = JSON.stringify({ name, parents: [parent] });
  const pre = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
      `--${boundary}\r\nContent-Type: image/png\r\n\r\n`,
    "utf8"
  );
  const post = Buffer.from(`\r\n--${boundary}--`, "utf8");
  const body = Buffer.concat([pre, bytes, post]);
  const r = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  return r.ok;
}

function segNome(v: any, fb: string): string {
  const s = String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\/\\]+/g, " ")
    .replace(/[^A-Za-z0-9\s._-]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return s || fb;
}

export async function POST(req: Request): Promise<Response> {
  const acesso = await verificarAcesso(req);
  if (!acesso.ok) return json({ error: acesso.erro || "Não autorizado." }, acesso.status || 401);

  const sa = lerServiceAccount();
  const root = process.env.DRIVE_CONTENT_FOLDER_ID;
  if (!sa || !root) return json({ configured: false });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }
  const mes = String(body.mes || "").trim();
  const semana = String(body.semana || "").trim();
  const peca = segNome(body.peca, "Carrossel");
  const slides: { n: number; url: string }[] = Array.isArray(body.slides) ? body.slides : [];
  if (!mes || !semana || slides.length === 0) {
    return json({ error: "Faltam mes, semana ou slides." }, 400);
  }

  const token = await getAccessToken(sa);
  if (!token) return json({ error: "Falha na autenticação do Google Drive." }, 502);

  try {
    // pasta do mês (dentro da raiz do conteúdo)
    const mesEsc = mes.replace(/'/g, "\\'");
    const mesFolders = await driveList(
      token,
      `'${root}' in parents and name='${mesEsc}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    const mesFolder = mesFolders[0] || (await driveCreateFolder(token, mes, root));
    if (!mesFolder) return json({ error: `Não achei/criei a pasta do mês ${mes}.` }, 502);

    // pasta da semana: acha por "Semana NN" (nome real tem sufixo "(dd-mm a dd-mm)")
    const num = (semana.match(/\d+/) || [""])[0];
    const todas = await driveList(
      token,
      `'${mesFolder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    let semanaFolder =
      todas.find((f: any) =>
        num ? new RegExp(`semana\\s*0*${num}\\b`, "i").test(f.name) : false
      ) || todas.find((f: any) => f.name === semana);
    if (!semanaFolder) semanaFolder = await driveCreateFolder(token, semana, mesFolder.id);
    if (!semanaFolder) return json({ error: `Não achei/criei a pasta da ${semana}.` }, 502);

    // …/Artes Finais/{Peça}
    const artesFolder = await acharOuCriarPasta(token, "Artes Finais", semanaFolder.id);
    if (!artesFolder) return json({ error: "Não criei a pasta 'Artes Finais'." }, 502);
    const pecaFolder = await acharOuCriarPasta(token, peca, artesFolder.id);
    if (!pecaFolder) return json({ error: `Não criei a pasta da peça ${peca}.` }, 502);

    // copia cada PNG do Supabase pro Drive
    let salvos = 0;
    for (const s of slides) {
      if (!s?.url) continue;
      const nome = `slide-${s.n}.png`;
      try {
        const resp = await fetch(s.url);
        if (!resp.ok) continue;
        const bytes = Buffer.from(await resp.arrayBuffer());
        await apagarPorNome(token, nome, pecaFolder.id); // evita duplicar em re-save
        if (await subirPng(token, nome, pecaFolder.id, bytes)) salvos++;
      } catch {}
    }

    const driveUrl =
      pecaFolder.webViewLink || `https://drive.google.com/drive/folders/${pecaFolder.id}`;

    await enviarSlack(
      `✅ Parcele Aqui — artes prontas: ${peca} da ${semana} (${mes}), ${salvos} imagem(ns) salva(s) no Drive. ` +
        `Confere e aprova a peça aqui: ${driveUrl}`
    );

    return json({ configured: true, driveUrl, salvos });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 502);
  }
}
