import { useState, useEffect, useRef } from "react";
import CoverEditorAvancado from "./components/CoverEditorAvancado";
import GeradorLote from "./components/GeradorLote";
import CarrosselEditor from "./components/CarrosselEditor";
import { FeedEditor } from "./components/feed";
import imgLogoGrupo from "../imports/logo_potencial_dark.png";
import imgLogoPotencialFooter from "../imports/Logo_-_Potencial_Tecnologia_Horizontal_Negativa__2-2.png";
import {
  LayoutDashboard,
  Layers,
  GalleryHorizontal,
  Linkedin,
  Instagram,
  ChevronDown,
  Sun,
  Moon,
  Image as ImageIcon,
} from "lucide-react";
import { ThemeProvider, useTheme } from "./lib/ThemeProvider";
import { SPACING, RADIUS, FONT_WEIGHT, FONT_SIZE, TRANSITION, SHADOW } from "./lib/designSystem";
import { Badge } from "./components/ui-premium";

type Modo = "editor" | "lote" | "carrossel" | "feed";

interface ModoDef {
  id: Modo;
  categoria: "linkedin" | "instagram";
  label: string;
  icone: React.ReactNode;
  descricao: string;
}

const MODOS: ModoDef[] = [
  {
    id: "editor",
    categoria: "linkedin",
    label: "Capa individual",
    icone: <LayoutDashboard size={14} strokeWidth={1.75} />,
    descricao: "Uma capa de newsletter por vez",
  },
  {
    id: "lote",
    categoria: "linkedin",
    label: "Lote de capas",
    icone: <Layers size={14} strokeWidth={1.75} />,
    descricao: "Várias capas de uma vez em ZIP",
  },
  {
    id: "carrossel",
    categoria: "instagram",
    label: "Carrossel",
    icone: <GalleryHorizontal size={14} strokeWidth={1.75} />,
    descricao: "Editor editorial com múltiplos slides",
  },
  {
    id: "feed",
    categoria: "instagram",
    label: "Feed & Stories",
    icone: <ImageIcon size={14} strokeWidth={1.75} />,
    descricao: "Templates Parcele Aqui (1080×1350 / 1080×1920)",
  },
];

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

function AppShell() {
  const [modo, setModo] = useState<Modo>("editor");
  const { theme, mode, toggle } = useTheme();

  useEffect(() => {
    document.title = "Gerador Potencial — Conteúdo LinkedIn & Instagram";
  }, []);

  const modoAtual = MODOS.find((m) => m.id === modo)!;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.bg.base,
        color: theme.text.primary,
        fontFamily: "'Poppins', sans-serif",
        transition: "background-color 250ms ease, color 250ms ease",
      }}
    >
      {/* ================ HEADER ================ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 70,
          backgroundColor: theme.mode === "dark" ? "rgba(5, 5, 5, 0.8)" : "rgba(250, 250, 248, 0.8)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          borderBottom: `1px solid ${theme.border.default}`,
        }}
      >
        <div
          style={{
            maxWidth: 1600,
            margin: "0 auto",
            padding: `0 ${SPACING[6]}`,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: SPACING[4],
          }}
        >
          {/* Logo + título */}
          <div style={{ display: "flex", alignItems: "center", gap: SPACING[4] }}>
            <img
              src={imgLogoGrupo}
              alt="Grupo Potencial"
              style={{
                height: 30,
                filter: mode === "light" ? "invert(1) brightness(0.3)" : "none",
                transition: TRANSITION.base,
              }}
            />
            <div
              style={{
                height: 32,
                width: 1,
                backgroundColor: theme.border.default,
              }}
            />
            <div>
              <h1
                style={{
                  fontSize: FONT_SIZE.md,
                  fontWeight: FONT_WEIGHT.bold,
                  color: theme.text.primary,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Gerador Potencial
              </h1>
              <p
                style={{
                  fontSize: FONT_SIZE.xs,
                  color: theme.text.muted,
                  margin: 0,
                  marginTop: 2,
                  letterSpacing: "0.02em",
                }}
              >
                Conteúdo · LinkedIn · Instagram
              </p>
            </div>
          </div>

          {/* Navegação + theme toggle */}
          <nav style={{ display: "flex", alignItems: "center", gap: SPACING[2] }}>
            <PlatformDropdown
              icone={<Linkedin size={16} strokeWidth={1.75} />}
              label="LinkedIn"
              modos={MODOS.filter((m) => m.categoria === "linkedin")}
              modoAtivo={modo}
              onSelect={setModo}
            />
            <PlatformDropdown
              icone={<Instagram size={16} strokeWidth={1.75} />}
              label="Instagram"
              modos={MODOS.filter((m) => m.categoria === "instagram")}
              modoAtivo={modo}
              onSelect={setModo}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: SPACING[2],
                padding: `${SPACING[2]} ${SPACING[3]}`,
                backgroundColor: theme.bg.sunken,
                borderRadius: RADIUS.md,
                border: `1px solid ${theme.border.default}`,
                fontSize: FONT_SIZE.sm,
              }}
            >
              <span style={{ color: theme.text.muted, fontWeight: FONT_WEIGHT.medium }}>
                Ativo:
              </span>
              <span
                style={{
                  color: theme.accent.primary,
                  fontWeight: FONT_WEIGHT.bold,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {modoAtual.icone}
                {modoAtual.label}
              </span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={`Mudar para modo ${mode === "dark" ? "claro" : "escuro"}`}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.bg.sunken,
                border: `1px solid ${theme.border.default}`,
                borderRadius: RADIUS.md,
                color: theme.text.secondary,
                cursor: "pointer",
                transition: TRANSITION.fast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.accent.primary;
                e.currentTarget.style.color = theme.accent.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.border.default;
                e.currentTarget.style.color = theme.text.secondary;
              }}
            >
              {mode === "dark" ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
            </button>
          </nav>
        </div>
      </header>

      {/* ================ MAIN ================ */}
      <main style={{ flex: 1 }}>
        {modo === "editor" && <CoverEditorAvancado />}
        {modo === "lote" && <GeradorLote />}
        {modo === "carrossel" && <CarrosselEditor />}
        {modo === "feed" && <FeedEditor />}
      </main>

      {/* ================ FOOTER ================ */}
      <footer
        style={{
          backgroundColor: theme.bg.raised,
          borderTop: `1px solid ${theme.border.default}`,
        }}
      >
        <div
          style={{
            maxWidth: 1600,
            margin: "0 auto",
            padding: `${SPACING[6]} ${SPACING[6]}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: SPACING[4],
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: theme.text.muted, fontSize: FONT_SIZE.sm }}>
            Desenvolvido por
          </span>
          <img
            src={imgLogoPotencialFooter}
            alt="Potencial Tecnologia"
            style={{
              height: 60,
              opacity: 0.9,
              filter: mode === "light" ? "invert(1) brightness(0.3)" : "none",
              transition: TRANSITION.base,
            }}
          />
          <Badge variant="muted">v{__APP_VERSION__} · {new Date().getFullYear()}</Badge>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// PLATFORM DROPDOWN (refatorado com sistema de tema)
// ============================================================

function PlatformDropdown({
  icone,
  label,
  modos,
  modoAtivo,
  onSelect,
}: {
  icone: React.ReactNode;
  label: string;
  modos: ModoDef[];
  modoAtivo: Modo;
  onSelect: (id: Modo) => void;
}) {
  const { theme } = useTheme();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [aberto]);

  const temAtivo = modos.some((m) => m.id === modoAtivo);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: SPACING[2],
          height: 36,
          padding: `0 ${SPACING[4]}`,
          backgroundColor: temAtivo ? theme.accent.primary : theme.bg.sunken,
          color: temAtivo ? theme.text.inverse : theme.text.secondary,
          border: `1px solid ${temAtivo ? theme.accent.primary : theme.border.default}`,
          borderRadius: RADIUS.md,
          fontSize: FONT_SIZE.sm,
          fontWeight: FONT_WEIGHT.bold,
          fontFamily: "'Poppins', sans-serif",
          cursor: "pointer",
          transition: TRANSITION.fast,
          boxShadow: temAtivo ? "0 1px 3px rgba(0, 0, 0, 0.4)" : "none",
        }}
        onMouseEnter={(e) => {
          if (!temAtivo) {
            e.currentTarget.style.borderColor = theme.accent.primary;
            e.currentTarget.style.color = theme.text.primary;
          }
        }}
        onMouseLeave={(e) => {
          if (!temAtivo) {
            e.currentTarget.style.borderColor = theme.border.default;
            e.currentTarget.style.color = theme.text.secondary;
          }
        }}
      >
        {icone}
        {label}
        <ChevronDown
          size={14}
          strokeWidth={2}
          style={{
            transition: TRANSITION.fast,
            transform: aberto ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {aberto && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 280,
            backgroundColor: theme.bg.elevated,
            border: `1px solid ${theme.border.default}`,
            borderRadius: RADIUS.lg,
            boxShadow: SHADOW.xl,
            overflow: "hidden",
            zIndex: 100,
            animation: "fadeIn 150ms ease-out",
          }}
        >
          {modos.map((m, idx) => {
            const ativo = m.id === modoAtivo;
            return (
              <button
                key={m.id}
                role="menuitem"
                onClick={() => {
                  onSelect(m.id);
                  setAberto(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: `${SPACING[3]} ${SPACING[4]}`,
                  backgroundColor: ativo ? `${theme.accent.primary}1A` : "transparent",
                  color: ativo ? theme.accent.primary : theme.text.secondary,
                  border: "none",
                  borderBottom:
                    idx < modos.length - 1 ? `1px solid ${theme.border.muted}` : "none",
                  cursor: "pointer",
                  transition: TRANSITION.fast,
                  fontFamily: "'Poppins', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (!ativo) {
                    e.currentTarget.style.backgroundColor = theme.bg.sunken;
                    e.currentTarget.style.color = theme.text.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!ativo) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = theme.text.secondary;
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[2],
                    fontSize: FONT_SIZE.base,
                    fontWeight: FONT_WEIGHT.bold,
                  }}
                >
                  {m.icone}
                  {m.label}
                  {ativo && (
                    <span style={{ marginLeft: "auto" }}>
                      <Badge variant="accent">ATIVO</Badge>
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: FONT_SIZE.xs,
                    color: theme.text.muted,
                    marginTop: SPACING[1],
                    fontWeight: FONT_WEIGHT.regular,
                  }}
                >
                  {m.descricao}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
