/**
 * Slack via Incoming Webhook — posta num canal e menciona quem estiver em
 * SLACK_MENCOES. Env server-side: SLACK_WEBHOOK_URL (URL do webhook),
 * SLACK_MENCOES (ex.: "<@U0DANIEL> <@U0VICTOR>"). Best-effort: nunca lança.
 */
export async function enviarSlack(texto: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return; // não configurado → silencioso
  const mencoes = (process.env.SLACK_MENCOES || "").trim();
  const text = mencoes ? `${texto} ${mencoes}` : texto;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) {
      console.error("[slack] webhook falhou", r.status, (await r.text().catch(() => "")).slice(0, 200));
    }
  } catch (e: any) {
    console.error("[slack] erro webhook", e?.message || e);
  }
}
