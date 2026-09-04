/**
 * Vercel Function: POST /api/produzir-semana — v7.19
 *
 * Rotina de sexta (Vercel Cron). LÊ o conteúdo da próxima semana DIRETO do
 * Google Drive (conta de serviço, leitura), parseia as 4 peças + legendas +
 * estilo visual, grava em conteudo_semanas + legendas no Supabase e avisa no
 * Slack. A geração de imagens + montagem dos slides + aprovação continuam no
 * app (limites do serverless: 60s e sem navegador pra renderizar).
 *
 * Protegido por CRON_SECRET (header Authorization: Bearer, que o Vercel Cron envia).
 * Best-effort: pasta/arquivo faltando avisa no Slack e não quebra.
 *
 * Envs: CRON_SECRET, GOOGLE_SERVICE_ACCOUNT_KEY (JSON, aceita base64),
 * DRIVE_CONTENT_FOLDER_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * SLACK_WEBHOOK_URL, SLACK_MENCOES, APP_URL.
 */
import { createSign } from "node:crypto";

export const maxDuration = 60;

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

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
  } catch (e: any) {
    console.error("[slack] erro", e?.message || e);
  }
}

// ---------- Google service account (JWT RS256 -> access token) ----------
function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function lerServiceAccount(): any | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    // aceita JSON puro ou base64 do JSON
    const txt = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(txt);
  } catch (e: any) {
    console.error("[drive] GOOGLE_SERVICE_ACCOUNT_KEY inválida", e?.message || e);
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
          scope: "https://www.googleapis.com/auth/drive.readonly",
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
    const assertion = `${signInput}.${signature}`;
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    const d = await r.json();
    return d.access_token || null;
  } catch (e: any) {
    console.error("[drive] getAccessToken falhou", e?.message || e);
    return null;
  }
}
async function driveList(token: string, q: string): Promise<any[]> {
  const url =
    "https://www.googleapis.com/drive/v3/files?" +
    new URLSearchParams({
      q,
      fields: "files(id,name,mimeType)",
      pageSize: "100",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
  const r = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  const d = await r.json();
  return Array.isArray(d.files) ? d.files : [];
}
async function driveDownload(token: string, fileId: string): Promise<string> {
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: "Bearer " + token } }
  );
  return await r.text();
}

// ---------- Semana-alvo (próxima segunda, BRT) ----------
function proximaSegunda(): Date {
  // "agora" em BRT (UTC-3), depois anda até a próxima segunda.
  const nowBRT = new Date(Date.now() - 3 * 3600 * 1000);
  const dow = nowBRT.getUTCDay(); // 0=dom..1=seg
  // dias até a próxima segunda (se hoje é seg, pega a de semana que vem)
  const delta = ((8 - dow) % 7) || 7;
  const seg = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), nowBRT.getUTCDate() + delta));
  return seg;
}

// ---------- Parsers (inline) ----------
function extrairEstilo(texto: string): string {
  const m = texto.match(/ESTILO VISUAL DA SEMANA[^\n]*\n([\s\S]*?)\n=+/i);
  return m ? m[1].trim() : "";
}
// mapa peça -> dia/tipo
const PECA_MAP: Record<string, { dia: string; tipo: string }> = {
  "1": { dia: "segunda", tipo: "feed_stories" },
  "2": { dia: "quinta", tipo: "feed_stories" },
  "3": { dia: "quarta", tipo: "carrossel" },
  "4": { dia: "sexta", tipo: "carrossel" },
};
function dividirPecas(texto: string): { peca: number; payload: string }[] {
  const re = /^PEÇA\s+(\d)\b[^\n]*$/gim;
  const marks: { peca: number; i: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    marks.push({ peca: Number(m[1]), i: m.index, end: re.lastIndex });
  }
  return marks.map((c, idx) => {
    const bodyEnd = idx + 1 < marks.length ? marks[idx + 1].i : texto.length;
    return { peca: c.peca, payload: texto.slice(c.i, bodyEnd).trim() };
  });
}
function normDia(d: string): string {
  const x = d.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (x.startsWith("seg")) return "segunda";
  if (x.startsWith("qua")) return "quarta";
  if (x.startsWith("qui")) return "quinta";
  if (x.startsWith("sex")) return "sexta";
  return x;
}
function parsearLegendas(texto: string): { dia: string; tipo: string; titulo: string; instagram: string; linkedin: string }[] {
  const t = texto.replace(/\r\n/g, "\n");
  const headerRe = /^POST DE\s+([A-Za-zÇÁ-Úá-ú]+)\s*[—–-]\s*([^\n·]+?)\s*·\s*"?([^"\n]+?)"?\s*$/gim;
  const ms: { dia: string; formato: string; titulo: string; i: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(t)) !== null) {
    ms.push({ dia: m[1], formato: m[2].trim(), titulo: m[3].trim(), i: m.index, end: headerRe.lastIndex });
  }
  const sec = (body: string, de: string, ate: string | null): string => {
    const linhas = body.split("\n");
    let cap = false;
    const buf: string[] = [];
    for (const l of linhas) {
      const u = l.trim().toUpperCase();
      if (!cap) { if (u === de) cap = true; continue; }
      if (u.startsWith("====") || (ate && u === ate)) break;
      buf.push(l);
    }
    return buf.join("\n").trim();
  };
  return ms.map((c, idx) => {
    const body = t.slice(c.end, idx + 1 < ms.length ? ms[idx + 1].i : t.length);
    return {
      dia: normDia(c.dia),
      tipo: /carrossel/i.test(c.formato) ? "carrossel" : "post",
      titulo: c.titulo,
      instagram: sec(body, "INSTAGRAM", "LINKEDIN"),
      linkedin: sec(body, "LINKEDIN", null),
    };
  });
}

export async function POST(req: Request): Promise<Response> {
  // Auth do cron
  const segredo = process.env.CRON_SECRET;
  if (segredo) {
    const auth = req.headers.get("authorization") || "";
    const token = /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, "").trim() : "";
    if (token !== segredo) return json({ error: "Não autorizado." }, 401);
  }

  const base0 = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const folderRoot = process.env.DRIVE_CONTENT_FOLDER_ID;
  const sa = lerServiceAccount();
  if (!base0 || !key) return json({ ok: false, erro: "Supabase não configurado." });
  if (!sa || !folderRoot) {
    return json({ ok: false, erro: "Google Drive não configurado (GOOGLE_SERVICE_ACCOUNT_KEY / DRIVE_CONTENT_FOLDER_ID)." });
  }
  const base = base0.replace(/\/+$/, "");
  const H = { apikey: key, Authorization: "Bearer " + key };

  const seg = proximaSegunda();
  const mesNome = MESES_PT[seg.getUTCMonth()];
  const semanaTag = `${String(seg.getUTCDate()).padStart(2, "0")}-${String(seg.getUTCMonth() + 1).padStart(2, "0")}`;

  const token = await getAccessToken(sa);
  if (!token) {
    await enviarSlack(`⚠️ Produzir semana: não consegui autenticar no Google Drive.`);
    return json({ ok: false, erro: "Falha na autenticação do Google Drive." }, 502);
  }

  try {
    // 1) pasta do mês
    const mesFolders = await driveList(
      token,
      `'${folderRoot}' in parents and name='${mesNome}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    if (mesFolders.length === 0) {
      await enviarSlack(`📭 Produzir semana: pasta do mês "${mesNome}" não encontrada no Drive.`);
      return json({ ok: false, erro: `Pasta do mês ${mesNome} não encontrada.` });
    }
    const mesId = mesFolders[0].id;

    // 2) pasta da semana: nome contém a data da segunda-alvo (dd-mm)
    const semanaFolders = await driveList(
      token,
      `'${mesId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    const alvo = semanaFolders.find((f: any) => {
      const mm = String(f.name).match(/\((\d{2})-(\d{2})\s+a\s+(\d{2})-(\d{2})\)/);
      if (!mm) return false;
      const ini = `${mm[1]}-${mm[2]}`;
      const fim = `${mm[3]}-${mm[4]}`;
      // segunda-alvo dentro do intervalo (comparação simples dd-mm)
      return semanaTag >= ini && semanaTag <= fim;
    });
    if (!alvo) {
      await enviarSlack(`📭 Produzir semana: nenhuma pasta de semana em ${mesNome} cobre ${semanaTag}. Deixe a pasta "Semana 0X (${semanaTag} a ...)" no Drive.`);
      return json({ ok: false, erro: `Semana ${semanaTag} não encontrada em ${mesNome}.` });
    }
    const semanaNomeMatch = String(alvo.name).match(/Semana\s+\d+/i);
    const semanaLabel = semanaNomeMatch ? semanaNomeMatch[0] : alvo.name;

    // 3) arquivos .md da pasta
    const arquivos = await driveList(token, `'${alvo.id}' in parents and trashed=false`);
    const fPrompts = arquivos.find((f: any) => /01-prompts/i.test(f.name));
    const fLegendas = arquivos.find((f: any) => /02-legendas/i.test(f.name));
    if (!fPrompts || !fLegendas) {
      await enviarSlack(`📭 Produzir semana: faltam os .md (01-Prompts / 02-Legendas) na pasta ${alvo.name}.`);
      return json({ ok: false, erro: "Arquivos 01-Prompts/02-Legendas não encontrados." });
    }

    const [txtPrompts, txtLegendas] = await Promise.all([
      driveDownload(token, fPrompts.id),
      driveDownload(token, fLegendas.id),
    ]);

    const estilo = extrairEstilo(txtPrompts);
    const pecas = dividirPecas(txtPrompts);
    const legendas = parsearLegendas(txtLegendas);

    // segunda-alvo por dia (ISO)
    const isoDoDia = (dia: string): string => {
      const off: Record<string, number> = { segunda: 0, quarta: 2, quinta: 3, sexta: 4 };
      const d = new Date(seg);
      d.setUTCDate(d.getUTCDate() + (off[dia] ?? 0));
      return d.toISOString().slice(0, 10);
    };

    // 4) grava conteudo_semanas (payloads) — substitui a semana
    await fetch(base + `/rest/v1/conteudo_semanas?mes=eq.${encodeURIComponent(mesNome)}&semana=eq.${encodeURIComponent(semanaLabel)}`, {
      method: "DELETE", headers: { ...H, Prefer: "return=minimal" },
    }).catch(() => {});
    const rowsConteudo = pecas.map((p) => {
      const map = PECA_MAP[String(p.peca)] || { dia: "", tipo: "" };
      return {
        mes: mesNome, semana: semanaLabel,
        peca: `Peça ${p.peca}`, tipo: map.tipo, dia: map.dia,
        payload: (estilo ? `# ESTILO VISUAL\n${estilo}\n\n` : "") + p.payload,
        ordem: p.peca,
      };
    });
    if (rowsConteudo.length) {
      await fetch(base + "/rest/v1/conteudo_semanas", {
        method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(rowsConteudo),
      });
    }

    // 5) grava legendas — substitui a semana
    await fetch(base + `/rest/v1/legendas?mes=eq.${encodeURIComponent(mesNome)}&semana=eq.${encodeURIComponent(semanaLabel)}`, {
      method: "DELETE", headers: { ...H, Prefer: "return=minimal" },
    }).catch(() => {});
    const rowsLeg = legendas.map((l) => ({
      mes: mesNome, semana: semanaLabel, dia: l.dia, tipo: l.tipo,
      titulo: l.titulo, instagram: l.instagram, linkedin: l.linkedin, data: isoDoDia(l.dia),
    }));
    if (rowsLeg.length) {
      await fetch(base + "/rest/v1/legendas", {
        method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(rowsLeg),
      });
    }

    const appUrl = process.env.APP_URL || "";
    await enviarSlack(
      `📥 Produzir semana: ${semanaLabel} de ${mesNome} lida do Drive — ${rowsConteudo.length} peças e ${rowsLeg.length} legendas prontas. ` +
      `Abre o app pra gerar as imagens, revisar e aprovar${appUrl ? `: ${appUrl}` : "."}`
    );

    return json({
      ok: true, mes: mesNome, semana: semanaLabel,
      pecas: rowsConteudo.length, legendas: rowsLeg.length, estilo: Boolean(estilo),
    });
  } catch (e: any) {
    console.error("[produzir-semana] erro", e?.message || e);
    await enviarSlack(`🚨 Produzir semana falhou: ${e?.message || e}`);
    return json({ ok: false, erro: e?.message || String(e) }, 502);
  }
}
