import { useEffect, useState } from "react";
import { supabase, authConfigurado } from "../lib/supabaseClient";
import { Loader2, Mail, ShieldAlert, LogOut } from "lucide-react";

type Estado = "carregando" | "deslogado" | "verificando" | "autorizado" | "negado";

/**
 * Portão de autenticação. Só protege quando o Supabase Auth está configurado
 * (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY). Senão, libera (fallback de dev).
 * Fluxo: magic link → sessão → /api/auth/check valida a allowlist → libera.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>(authConfigurado ? "carregando" : "autorizado");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [emailSessao, setEmailSessao] = useState<string | null>(null);

  useEffect(() => {
    if (!authConfigurado || !supabase) return;
    let ativo = true;
    const checar = async (session: any) => {
      if (!session) {
        if (ativo) setEstado("deslogado");
        return;
      }
      if (ativo) {
        setEmailSessao(session.user?.email ?? null);
        setEstado("verificando");
      }
      try {
        const r = await fetch("/api/auth/check", {
          method: "POST",
          headers: { Authorization: "Bearer " + session.access_token },
        });
        const d = await r.json().catch(() => ({ authorized: false }));
        if (!ativo) return;
        setEstado(d.authorized ? "autorizado" : "negado");
      } catch {
        if (ativo) setEstado("negado");
      }
    };
    supabase.auth.getSession().then(({ data }) => checar(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => checar(session));
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const enviarLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setErro(error.message);
      else setEnviado(true);
    } catch (err: any) {
      setErro(err?.message || "Falha ao enviar o link.");
    } finally {
      setEnviando(false);
    }
  };

  const sair = async () => {
    if (supabase) await supabase.auth.signOut();
    setEstado("deslogado");
    setEnviado(false);
    setEmail("");
  };

  if (estado === "autorizado") return <>{children}</>;

  const wrap = (inner: React.ReactNode) => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#16181C",
        color: "#F5F6F8",
        fontFamily: "'Poppins', sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#1D2025",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 32,
        }}
      >
        {inner}
      </div>
    </div>
  );

  if (estado === "carregando" || estado === "verificando")
    return wrap(
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", color: "#AEB2BC" }}>
        <Loader2 size={18} className="animate-spin" />
        {estado === "verificando" ? "Verificando acesso…" : "Carregando…"}
      </div>
    );

  if (estado === "negado")
    return wrap(
      <div style={{ textAlign: "center" }}>
        <ShieldAlert size={32} style={{ color: "#FFC528", margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>Acesso não autorizado</h2>
        <p style={{ fontSize: 13, color: "#AEB2BC", margin: "0 0 20px" }}>
          O e-mail {emailSessao ? <b>{emailSessao}</b> : ""} não está na lista de acesso. Fale com o
          administrador.
        </p>
        <button
          onClick={sair}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "#F5F6F8",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <LogOut size={15} /> Sair
        </button>
      </div>
    );

  return wrap(
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Gerador Potencial</h1>
        <p style={{ fontSize: 13, color: "#AEB2BC", margin: 0 }}>Entre com seu e-mail autorizado</p>
      </div>
      {enviado ? (
        <div style={{ textAlign: "center" }}>
          <Mail size={30} style={{ color: "#FFC528", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, margin: "0 0 8px" }}>Link enviado!</p>
          <p style={{ fontSize: 13, color: "#AEB2BC", margin: 0 }}>
            Abra o e-mail que enviamos para <b>{email}</b> e clique no link pra entrar.
          </p>
          <button
            onClick={() => setEnviado(false)}
            style={{ marginTop: 16, background: "none", border: "none", color: "#FFC528", cursor: "pointer", fontSize: 13 }}
          >
            Usar outro e-mail
          </button>
        </div>
      ) : (
        <form onSubmit={enviarLink}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#16181C",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding: "12px 14px",
              color: "#F5F6F8",
              fontSize: 14,
              marginBottom: 12,
            }}
          />
          {erro && <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 12px" }}>{erro}</p>}
          <button
            type="submit"
            disabled={enviando}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px",
              borderRadius: 9999,
              border: "none",
              background: "#FFC528",
              color: "#111",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              opacity: enviando ? 0.6 : 1,
            }}
          >
            {enviando ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {enviando ? "Enviando…" : "Enviar link de acesso"}
          </button>
        </form>
      )}
    </div>
  );
}
