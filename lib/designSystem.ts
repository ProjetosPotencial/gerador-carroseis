/**
 * DESIGN SYSTEM — Gerador Potencial v6
 * Tokens de cor, espaçamento e tipografia premium estilo fintech.
 * Base: 8-point grid. Radius: múltiplos de 4.
 */

// ============================================================
// PALETA
// ============================================================

export const COLORS = {
  // Amarelos Potencial — variações calibradas
  yellow: {
    DEFAULT: "#FFC528",   // Original Potencial (carrosséis e accent principal)
    soft: "#FFD960",      // Hover states, highlights
    deep: "#E5AC14",      // Pressed states
    cream: "#FFF4C2",     // Backgrounds claros com accent
    glow: "#FFC52833",    // 20% opacity para glows/focus rings
  },

  // Grafites (dark mode base)
  graphite: {
    void: "#050505",      // Fundo principal (mais escuro que preto puro)
    base: "#0A0A0A",      // Container principal
    raised: "#0F0F0F",    // Cards
    elevated: "#141414",  // Cards sobrepostos / painéis
    sunken: "#1A1A1A",    // Inputs, elementos interativos
    border: "#262626",    // Borders, dividers
    muted: "#3D3D3D",     // Texto desabilitado
    subtle: "#6B6B6B",    // Texto secundário
    soft: "#A1A1A1",      // Texto terciário
  },

  // Neutros (light mode)
  neutral: {
    paper: "#FAFAF8",     // Fundo principal light
    white: "#FFFFFF",     // Cards light
    sand: "#F5F3EE",      // Cards de acento
    cream: "#F0EFEB",     // Borders sutis light
    border: "#E5E5E5",    // Borders light
    muted: "#A1A1A1",     // Texto secundário light
    subtle: "#6B6B6B",    // Texto terciário light
    ink: "#1A1A1A",       // Texto primário light
  },

  // Feedback
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
} as const;

// ============================================================
// ESPAÇAMENTOS — 8-point grid
// ============================================================

export const SPACING = {
  0: "0",
  1: "4px",    // micro
  2: "8px",    // base
  3: "12px",
  4: "16px",   // compacto
  5: "20px",
  6: "24px",   // padrão
  8: "32px",   // generoso
  10: "40px",
  12: "48px",  // seção
  16: "64px",  // separadores grandes
  20: "80px",
  24: "96px",
} as const;

// ============================================================
// BORDER RADIUS
// ============================================================

export const RADIUS = {
  none: "0",
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",   // cards padrão
  xl: "20px",   // cards premium
  "2xl": "24px",
  "3xl": "28px", // cards grandes/destaque
  full: "9999px", // pills
} as const;

// ============================================================
// TIPOGRAFIA
// ============================================================

export const FONT_FAMILY = {
  sans: "'Poppins', 'Inter', system-ui, sans-serif",
  display: "'Poppins', 'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const FONT_SIZE = {
  xs: "11px",
  sm: "12px",
  base: "14px",
  md: "15px",
  lg: "17px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "30px",
  "4xl": "36px",
  "5xl": "48px",
} as const;

export const FONT_WEIGHT = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

// ============================================================
// SHADOWS
// ============================================================

export const SHADOW = {
  none: "none",
  xs: "0 1px 2px rgba(0, 0, 0, 0.25)",
  sm: "0 2px 6px rgba(0, 0, 0, 0.30)",
  md: "0 4px 16px rgba(0, 0, 0, 0.35)",
  lg: "0 8px 32px rgba(0, 0, 0, 0.40)",
  xl: "0 16px 48px rgba(0, 0, 0, 0.50)",
  yellow: "0 1px 3px rgba(0, 0, 0, 0.4)",
  yellowGlow: "0 0 0 1px rgba(255, 255, 255, 0.06)",
} as const;

// ============================================================
// TRANSITIONS
// ============================================================

export const TRANSITION = {
  fast: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// ============================================================
// THEME TYPE — usado pelo ThemeProvider
// ============================================================

export type Mode = "dark" | "light";

export interface Theme {
  mode: Mode;
  bg: {
    base: string;        // fundo do body
    raised: string;      // cards primários
    elevated: string;    // cards elevados/painéis
    sunken: string;      // inputs
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;     // texto sobre accent
  };
  border: {
    default: string;
    muted: string;
    strong: string;
  };
  accent: {
    primary: string;     // #FFC528
    hover: string;
    muted: string;
    glow: string;
  };
}

export const THEMES: Record<Mode, Theme> = {
  dark: {
    mode: "dark",
    bg: {
      base: COLORS.graphite.void,
      raised: COLORS.graphite.raised,
      elevated: COLORS.graphite.elevated,
      sunken: COLORS.graphite.sunken,
    },
    text: {
      primary: "#FFFFFF",
      secondary: COLORS.graphite.soft,
      muted: COLORS.graphite.subtle,
      inverse: COLORS.graphite.void,
    },
    border: {
      default: COLORS.graphite.border,
      muted: "#1F1F1F",
      strong: "#333333",
    },
    accent: {
      primary: COLORS.yellow.DEFAULT,
      hover: COLORS.yellow.soft,
      muted: COLORS.yellow.glow,
      glow: COLORS.yellow.glow,
    },
  },
  light: {
    mode: "light",
    bg: {
      base: COLORS.neutral.paper,
      raised: COLORS.neutral.white,
      elevated: COLORS.neutral.white,
      sunken: COLORS.neutral.sand,
    },
    text: {
      primary: COLORS.neutral.ink,
      secondary: COLORS.neutral.subtle,
      muted: COLORS.neutral.muted,
      inverse: COLORS.neutral.ink,
    },
    border: {
      default: COLORS.neutral.border,
      muted: COLORS.neutral.cream,
      strong: "#D1D5DB",
    },
    accent: {
      primary: COLORS.yellow.DEFAULT,
      hover: COLORS.yellow.deep,
      muted: COLORS.yellow.cream,
      glow: COLORS.yellow.glow,
    },
  },
};
