import { useEffect, useState } from "react";
import { supabase, authConfigurado, chaveAcesso } from "../lib/supabaseClient";
import { Loader2, Mail, ShieldAlert, LogOut } from "lucide-react";

type Estado = "carregando" | "deslogado" | "verificando" | "autorizado" | "negado";

/**
 * Portão de autenticação — v7.29.
 *
 * A TELA DE LOGIN SAIU. Por padrão o app abre direto no editor, sem nenhuma
 * etapa no meio. O que autoriza as chamadas /api/* passou a ser a chave de
 * acesso compartilhada (VITE_CHAVE_ACESSO no build, CHAVE_ACESSO no servidor),
 * enviada automaticamente pelo `authHeaders()`.
 *
 * Como voltar atrás, se um dia precisar: defina VITE_LOGIN=on no build. O
 * magic link volta exatamente como era, com uma diferença: o veredito de
 * acesso fica gravado no navegador, a revalidação roda em segundo plano e
 * falha de rede não desloga mais ninguém no meio do expediente.
 *
 * O que isso significa na prática: quem abrir a URL do app vê a interface.
 * Gerar texto, gerar imagem, salvar slides, importar legendas e aprovar a
 * semana continuam exigindo a chave, então cota de IA e banco seguem
 * protegidos. A chave viaja no bundle do navegador, então ela segura visitante
 * casual e robô de busca, não alguém determinado que abra o código da página.
 */

const CHAVE_ACESSO_LOCAL = "gp:acesso:v1";

const env: any = (import.meta as any).env || {};
/** Login desligado por padrão. VITE_LOGIN=on religa o magic link. */
const loginLigado = String(env.VITE_LOGIN || "").toLowerCase() === "on";

interface AcessoSalvo {
  email: string;
  em: number;
}

function lerAcesso(): AcessoSalvo | null {
  try {
    const cru = localStorage.getItem(CHAVE_ACESSO_LOCAL);
    if (!cru) return null;
    const d = JSON.parse(cru);
    return d && typeof d.email === "string" ? d : null;
  } catch {
    return null;
  }
}

function salvarAcesso(email: string | null): void {
  try {
    if (email) localStorage.setItem(CHAVE_ACESSO_LOCAL, JSON.stringify({ email, em: Date.now() }));
    else localStorage.removeItem(CHAVE_ACESSO_LOCAL);
  } catch {
    /* modo privado do navegador: segue sem cache */
  }
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  // Caminho padrão: sem login, sem tela, sem espera.
  if (!loginLigado || !authConfigurado) return <>{children}</>;
  return <PortaoMagicLink>{children}</PortaoMagicLink>;
}

/** Só entra em cena com VITE_LOGIN=on. */
function PortaoMagicLink({ children }: { children: React.ReactNode }) {
  const acessoSalvo = lerAcesso();

  const [estado, setEstado] = useState<Estado>(acessoSalvo ? "autorizado" : "carregando");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [emailSessao, setEmailSessao] = useState<string | null>(acessoSalvo?.email ?? null);

  // Saída explícita por ?logout=1.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("logout") !== "1") return;
    salvarAcesso(null);
    supabase?.auth.signOut().finally(() => {
      p.delete("logout");
      const q = p.toString();
      window.location.replace(window.location.pathname + (q ? "?" + q : ""));
    });
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let ativo = true;
    let temAcessoConhecido = Boolean(acessoSalvo);

    const checar = async (session: any) => {
      if (!ativo) return;

      if (!session) {
        temAcessoConhecido = false;
        salvarAcesso(null);
        setEstado("deslogado");
        return;
      }

      const emailAtual = session.user?.email ?? null;
      setEmailSessao(emailAtual);
      if (!temAcessoConhecido) setEstado("verificando");

      try {
        const r = await fetch("/api/auth/check", {
          method: "POST",
          headers: { Authorization: "Bearer " + session.access_token },
        });
        if (!ativo) return;

        if (!r.ok && r.status >= 500) {
          // Servidor com problema: mantém quem já estava dentro.
          if (!temAcessoConhecido) setEstado("negado");
          return;
        }

        const d = await r.json().catch(() => null);
        if (!ativo) return;

        if (d && d.authorized) {
          temAcessoConhecido = true;
          salvarAcesso(emailAtual);
          setEstado("autorizado");
        } else if (d) {
          temAcessoConhecido = false;
          salvarAcesso(null);
          setEstado("negado");
        } else if (!temAcessoConhecido) {
          setEstado("negado");
        }
      } catch {
        // Rede fora do ar não desloga quem já estava trabalhando.
        if (ativo && !temAcessoConhecido) setEstado("negado");
      }
    };

    supabase.auth.getSession().then(({ data }) => checar(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === "TOKEN_REFRESHED" || evento === "USER_UPDATED") {
        if (session?.user?.email) salvarAcesso(session.user.email);
        return;
      }
      checar(session);
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    salvarAcesso(null);
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
            Abra o e-mail que enviamos para <b>{email}</b> e clique no link pra entrar. Depois desta
            vez o app não pede login de novo neste navegador.
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
          <p style={{ fontSize: 11.5, color: "#6E7480", textAlign: "center", margin: "14px 0 0", lineHeight: 1.5 }}>
            Uma vez só. O app guarda o acesso neste navegador e não pede de novo.
          </p>
        </form>
      )}
    </div>
  );
}

/** Silencia o aviso de variável não usada quando o login está desligado. */
void chaveAcesso;
