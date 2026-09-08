import { useEffect, useState } from "react";
import { Lock, Loader2, LogOut } from "lucide-react";

/**
 * Portão de acesso por SENHA ÚNICA (client-side, v7.27.1).
 * - Sem e-mail/Supabase: digita a senha uma vez e fica logado por 7 dias
 *   (guardado no localStorage deste navegador).
 * - A senha pode ser trocada pela env de build VITE_APP_SENHA; se não houver,
 *   usa o padrão abaixo. Gate simples: como roda no navegador, a senha não é
 *   segredo forte — serve pra evitar acesso casual.
 */
const SENHA = (((import.meta as any).env?.VITE_APP_SENHA as string) || "Potencial@2026").trim();
const CHAVE = "parceleaqui:acesso:v1";
const DIAS = 7;
const DUR_MS = DIAS * 24 * 60 * 60 * 1000;

function sessaoValida(): boolean {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (!raw) return false;
    const { exp } = JSON.parse(raw);
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<"carregando" | "deslogado" | "autorizado">("carregando");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setEstado(sessaoValida() ? "autorizado" : "deslogado");
  }, []);

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha === SENHA) {
      try {
        localStorage.setItem(CHAVE, JSON.stringify({ exp: Date.now() + DUR_MS }));
      } catch {}
      setErro(null);
      setEstado("autorizado");
    } else {
      setErro("Senha incorreta.");
    }
  };

  const sair = () => {
    try { localStorage.removeItem(CHAVE); } catch {}
    setSenha("");
    setEstado("deslogado");
  };

  if (estado === "autorizado") {
    return (
      <>
        {children}
        <button
          onClick={sair}
          title="Sair"
          style={{
            position: "fixed", bottom: 16, left: 16, zIndex: 9999,
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 12px", borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.15)", background: "rgba(20,22,26,0.85)",
            color: "#AEB2BC", cursor: "pointer", fontSize: 12, fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <LogOut size={13} /> Sair
        </button>
      </>
    );
  }

  const wrap = (inner: React.ReactNode) => (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#16181C", color: "#F5F6F8", fontFamily: "'Poppins', sans-serif", padding: 24,
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 400, background: "#1D2025",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32,
        }}
      >
        {inner}
      </div>
    </div>
  );

  if (estado === "carregando")
    return wrap(
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", color: "#AEB2BC" }}>
        <Loader2 size={18} className="animate-spin" /> Carregando…
      </div>
    );

  return wrap(
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Gerador Potencial</h1>
        <p style={{ fontSize: 13, color: "#AEB2BC", margin: 0 }}>Digite a senha de acesso</p>
      </div>
      <form onSubmit={entrar}>
        <input
          type="password"
          required
          autoFocus
          value={senha}
          onChange={(e) => { setSenha(e.target.value); setErro(null); }}
          placeholder="Senha"
          style={{
            width: "100%", boxSizing: "border-box", background: "#16181C",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
            padding: "12px 14px", color: "#F5F6F8", fontSize: 14, marginBottom: 12,
          }}
        />
        {erro && <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 12px" }}>{erro}</p>}
        <button
          type="submit"
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px", borderRadius: 9999, border: "none", background: "#FFC528",
            color: "#111", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}
        >
          <Lock size={16} /> Entrar
        </button>
        <p style={{ fontSize: 11, color: "#6b7280", textAlign: "center", margin: "14px 0 0" }}>
          O acesso fica salvo por {DIAS} dias neste navegador.
        </p>
      </form>
    </div>
  );
}
