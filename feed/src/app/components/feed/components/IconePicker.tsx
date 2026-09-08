/**
 * IconePicker — buscador de ícones Lucide com input de pesquisa.
 *
 * v7.7.19: usa dynamic import pra carregar lista de ícones só quando
 * o picker é aberto. Evita inflar o bundle inicial.
 */
import { useState, useMemo, useEffect } from "react";
import { Search, X } from "lucide-react";
import IconeLucide from "./IconeLucide";

interface IconePickerProps {
  valor?: string;
  onChange: (nome: string | undefined) => void;
  defaultNome?: string;
}

let listaIconesCache: string[] | null = null;

async function carregarListaIcones(): Promise<string[]> {
  if (listaIconesCache) return listaIconesCache;
  const lucide = await import("lucide-react");
  listaIconesCache = Object.keys(lucide).filter((k) => {
    const v = (lucide as Record<string, unknown>)[k];
    if (!v) return false;
    // Ícones do lucide podem ser function (versões antigas) OU
    // object com $$typeof = forwardRef (versões novas).
    const ehFuncao = typeof v === "function";
    const ehForwardRef =
      typeof v === "object" &&
      v !== null &&
      "$$typeof" in v &&
      "render" in v;
    if (!ehFuncao && !ehForwardRef) return false;
    // Apenas nomes PascalCase
    if (!/^[A-Z]/.test(k)) return false;
    // Excluir alias com sufixo "Icon" (existem como duplicata)
    if (k.endsWith("Icon")) return false;
    // Excluir helpers
    if (k.startsWith("Lucide")) return false;
    if (["Icon", "createLucideIcon"].includes(k)) return false;
    return true;
  });
  return listaIconesCache;
}

export default function IconePicker({
  valor,
  onChange,
  defaultNome = "RefreshCcw",
}: IconePickerProps) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [todosIcones, setTodosIcones] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);

  const nomeAtual = valor ?? defaultNome;

  useEffect(() => {
    if (aberto && todosIcones.length === 0) {
      setCarregando(true);
      carregarListaIcones()
        .then((nomes) => {
          setTodosIcones(nomes);
          setCarregando(false);
        })
        .catch(() => setCarregando(false));
    }
  }, [aberto, todosIcones.length]);

  const filtrados = useMemo(() => {
    if (!busca.trim() || todosIcones.length === 0) return [];
    const termo = busca.trim().toLowerCase();
    return todosIcones.filter((nome) => nome.toLowerCase().includes(termo)).slice(0, 60);
  }, [busca, todosIcones]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 10,
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0d0d0d",
            borderRadius: 4,
          }}
        >
          <IconeLucide nome={nomeAtual} size={24} color="#FFC528" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#888", fontFamily: "Poppins, sans-serif" }}>
            Ícone atual
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#fff",
              fontWeight: 600,
              fontFamily: "Poppins, sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {nomeAtual}
          </div>
        </div>
        <button
          onClick={() => setAberto(!aberto)}
          style={{
            padding: "6px 10px",
            fontSize: 11,
            background: aberto ? "#FFC528" : "#2a2a2a",
            color: aberto ? "#000" : "#FFC528",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 600,
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {aberto ? "Fechar" : "Trocar"}
        </button>
      </div>

      {aberto && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {carregando && todosIcones.length === 0 && (
            <p style={{ fontSize: 11, color: "#888", margin: 0, fontFamily: "Poppins, sans-serif" }}>
              Carregando lista de ícones…
            </p>
          )}

          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#666",
              }}
            />
            <input
              type="text"
              autoFocus
              placeholder={
                todosIcones.length === 0
                  ? "Carregando ícones…"
                  : "Buscar ícone (ex: dollar, arrow, heart)..."
              }
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                background: "#0d0d0d",
                border: "1px solid #2a2a2a",
                borderRadius: 4,
                color: "#fff",
                fontSize: 12,
                fontFamily: "Poppins, sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#666",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Limpar busca"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {!busca && todosIcones.length > 0 && (
            <p
              style={{
                fontSize: 10,
                color: "#666",
                margin: 0,
                fontStyle: "italic",
                fontFamily: "Poppins, sans-serif",
                lineHeight: 1.4,
              }}
            >
              Digite pra buscar entre {todosIcones.length} ícones do Lucide. Ex: "dollar", "arrow", "credit", "user"…
            </p>
          )}

          {busca && filtrados.length === 0 && todosIcones.length > 0 && (
            <p style={{ fontSize: 11, color: "#888", margin: 0, fontFamily: "Poppins, sans-serif" }}>
              Nenhum ícone encontrado pra "{busca}".
            </p>
          )}

          {filtrados.length > 0 && (
            <>
              <p style={{ fontSize: 10, color: "#666", margin: 0, fontFamily: "Poppins, sans-serif" }}>
                {filtrados.length === 60
                  ? "Primeiros 60 resultados"
                  : `${filtrados.length} resultado${filtrados.length !== 1 ? "s" : ""}`}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 4,
                  maxHeight: 240,
                  overflowY: "auto",
                  padding: 4,
                  background: "#0d0d0d",
                  border: "1px solid #2a2a2a",
                  borderRadius: 4,
                }}
              >
                {filtrados.map((nome) => {
                  const ativo = nome === nomeAtual;
                  return (
                    <button
                      key={nome}
                      onClick={() => {
                        onChange(nome === defaultNome ? undefined : nome);
                        setAberto(false);
                        setBusca("");
                      }}
                      title={nome}
                      style={{
                        aspectRatio: "1 / 1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: ativo ? "#FFC528" : "transparent",
                        border: ativo ? "none" : "1px solid #2a2a2a",
                        borderRadius: 4,
                        cursor: "pointer",
                        color: ativo ? "#000" : "#ddd",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!ativo) e.currentTarget.style.background = "#2a2a2a";
                      }}
                      onMouseLeave={(e) => {
                        if (!ativo) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <IconeLucide nome={nome} size={20} />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {valor !== undefined && (
            <button
              onClick={() => {
                onChange(undefined);
                setAberto(false);
                setBusca("");
              }}
              style={{
                fontSize: 10,
                color: "#888",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                alignSelf: "flex-start",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              ↺ Voltar pro ícone padrão ({defaultNome})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
