import React from "react";
import { useTheme } from "../lib/ThemeProvider";
import { SPACING, RADIUS, SHADOW, FONT_WEIGHT, FONT_SIZE, TRANSITION } from "../lib/designSystem";

// ============================================================
// BUTTON — 3 variantes, 3 tamanhos
// ============================================================

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  loading,
  fullWidth,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { theme } = useTheme();

  const sizeStyles = {
    sm: { height: 32, padding: "0 12px", fontSize: FONT_SIZE.xs, gap: 6, radius: RADIUS.sm },
    md: { height: 40, padding: "0 16px", fontSize: FONT_SIZE.base, gap: 8, radius: RADIUS.md },
    lg: { height: 48, padding: "0 24px", fontSize: FONT_SIZE.md, gap: 10, radius: RADIUS.md },
  };
  const s = sizeStyles[size];

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: theme.accent.primary,
      color: theme.text.inverse,
      border: `1px solid ${theme.accent.primary}`,
      fontWeight: FONT_WEIGHT.bold,
      boxShadow: SHADOW.yellow,
    },
    secondary: {
      backgroundColor: theme.bg.sunken,
      color: theme.text.primary,
      border: `1px solid ${theme.border.default}`,
      fontWeight: FONT_WEIGHT.semibold,
    },
    ghost: {
      backgroundColor: "transparent",
      color: theme.text.secondary,
      border: `1px solid transparent`,
      fontWeight: FONT_WEIGHT.medium,
    },
    danger: {
      backgroundColor: "transparent",
      color: "#EF4444",
      border: `1px solid #EF4444`,
      fontWeight: FONT_WEIGHT.semibold,
    },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        borderRadius: s.radius,
        fontFamily: "'Poppins', sans-serif",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.5 : 1,
        transition: TRANSITION.fast,
        width: fullWidth ? "100%" : undefined,
        whiteSpace: "nowrap",
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        const el = e.currentTarget;
        if (variant === "primary") {
          el.style.backgroundColor = theme.accent.hover;
          el.style.transform = "translateY(-1px)";
        } else if (variant === "secondary") {
          el.style.backgroundColor = theme.bg.elevated;
          el.style.borderColor = theme.accent.primary;
        } else if (variant === "ghost") {
          el.style.backgroundColor = theme.bg.sunken;
          el.style.color = theme.text.primary;
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        Object.assign(el.style, variantStyles[variant]);
        el.style.transform = "translateY(0)";
      }}
      {...rest}
    >
      {loading ? <Spinner size={size === "sm" ? 12 : 14} /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================
// CARD — container premium com variantes
// ============================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "raised" | "elevated" | "sunken" | "outlined";
  padding?: keyof typeof SPACING;
  hoverable?: boolean;
}

export function Card({ variant = "raised", padding = 6, hoverable, style, children, ...rest }: CardProps) {
  const { theme } = useTheme();
  const variantStyles: Record<string, React.CSSProperties> = {
    raised: {
      backgroundColor: theme.bg.raised,
      border: `1px solid ${theme.border.default}`,
    },
    elevated: {
      backgroundColor: theme.bg.elevated,
      border: `1px solid ${theme.border.default}`,
      boxShadow: theme.mode === "dark" ? SHADOW.md : SHADOW.sm,
    },
    sunken: {
      backgroundColor: theme.bg.sunken,
      border: `1px solid ${theme.border.muted}`,
    },
    outlined: {
      backgroundColor: "transparent",
      border: `1px solid ${theme.border.default}`,
    },
  };

  return (
    <div
      style={{
        borderRadius: RADIUS.xl,
        padding: SPACING[padding],
        transition: TRANSITION.base,
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.borderColor = theme.accent.primary;
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.borderColor = variantStyles[variant].border?.toString().split(" ").pop() || "";
      } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

// ============================================================
// INPUT — campo de texto premium
// ============================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
}

export function Input({ icon, error, style, ...rest }: InputProps) {
  const { theme } = useTheme();
  return (
    <div style={{ position: "relative", width: "100%" }}>
      {icon && (
        <div
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: theme.text.muted,
            pointerEvents: "none",
            display: "flex",
          }}
        >
          {icon}
        </div>
      )}
      <input
        style={{
          width: "100%",
          height: 40,
          padding: icon ? "0 12px 0 36px" : "0 12px",
          backgroundColor: theme.bg.sunken,
          border: `1px solid ${error ? "#EF4444" : theme.border.default}`,
          borderRadius: RADIUS.md,
          color: theme.text.primary,
          fontSize: FONT_SIZE.base,
          fontFamily: "'Poppins', sans-serif",
          fontWeight: FONT_WEIGHT.medium,
          outline: "none",
          transition: TRANSITION.fast,
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = theme.accent.primary;
          e.currentTarget.style.boxShadow = `0 0 0 1px rgba(255, 255, 255, 0.12)`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "#EF4444" : theme.border.default;
          e.currentTarget.style.boxShadow = "none";
        }}
        {...rest}
      />
    </div>
  );
}

// ============================================================
// TEXTAREA
// ============================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, style, ...rest }: TextareaProps) {
  const { theme } = useTheme();
  return (
    <textarea
      style={{
        width: "100%",
        padding: "10px 12px",
        backgroundColor: theme.bg.sunken,
        border: `1px solid ${error ? "#EF4444" : theme.border.default}`,
        borderRadius: RADIUS.md,
        color: theme.text.primary,
        fontSize: FONT_SIZE.base,
        fontFamily: "'Poppins', sans-serif",
        fontWeight: FONT_WEIGHT.regular,
        lineHeight: 1.5,
        outline: "none",
        resize: "none",
        transition: TRANSITION.fast,
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = theme.accent.primary;
        e.currentTarget.style.boxShadow = `0 0 0 1px rgba(255, 255, 255, 0.12)`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? "#EF4444" : theme.border.default;
        e.currentTarget.style.boxShadow = "none";
      }}
      {...rest}
    />
  );
}

// ============================================================
// SELECT — dropdown nativo estilizado
// ============================================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ children, style, ...rest }: SelectProps) {
  const { theme } = useTheme();
  return (
    <select
      style={{
        width: "100%",
        height: 40,
        padding: "0 36px 0 12px",
        backgroundColor: theme.bg.sunken,
        border: `1px solid ${theme.border.default}`,
        borderRadius: RADIUS.md,
        color: theme.text.primary,
        fontSize: FONT_SIZE.base,
        fontFamily: "'Poppins', sans-serif",
        fontWeight: FONT_WEIGHT.medium,
        outline: "none",
        cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(theme.text.muted)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        transition: TRANSITION.fast,
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = theme.accent.primary;
        e.currentTarget.style.boxShadow = `0 0 0 1px rgba(255, 255, 255, 0.12)`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = theme.border.default;
        e.currentTarget.style.boxShadow = "none";
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

// ============================================================
// LABEL — label consistente
// ============================================================

export function Label({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: FONT_WEIGHT.bold,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: theme.text.secondary,
        marginBottom: SPACING[2],
      }}
    >
      {icon}
      {children}
    </div>
  );
}

// ============================================================
// BADGE
// ============================================================

interface BadgeProps {
  variant?: "default" | "accent" | "success" | "danger" | "muted";
  children: React.ReactNode;
}

export function Badge({ variant = "default", children }: BadgeProps) {
  const { theme } = useTheme();
  const bg = {
    default: theme.bg.sunken,
    accent: theme.accent.primary,
    success: "#10B98120",
    danger: "#EF444420",
    muted: theme.bg.sunken,
  }[variant];
  const color = {
    default: theme.text.secondary,
    accent: theme.text.inverse,
    success: "#10B981",
    danger: "#EF4444",
    muted: theme.text.muted,
  }[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        padding: "0 8px",
        backgroundColor: bg,
        color,
        fontSize: 10,
        fontWeight: FONT_WEIGHT.bold,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        borderRadius: RADIUS.xs,
      }}
    >
      {children}
    </span>
  );
}

// ============================================================
// DIVIDER
// ============================================================

export function Divider({ vertical, margin = 4 }: { vertical?: boolean; margin?: keyof typeof SPACING }) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.border.default,
        ...(vertical
          ? { width: 1, height: "auto", margin: `0 ${SPACING[margin]}` }
          : { height: 1, width: "100%", margin: `${SPACING[margin]} 0` }),
      }}
    />
  );
}

// ============================================================
// TOGGLE SWITCH
// ============================================================

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  const { theme } = useTheme();
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: SPACING[2],
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 36,
          height: 20,
          backgroundColor: checked ? theme.accent.primary : theme.bg.sunken,
          border: `1px solid ${checked ? theme.accent.primary : theme.border.default}`,
          borderRadius: RADIUS.full,
          position: "relative",
          transition: TRANSITION.base,
        }}
        onClick={() => onChange(!checked)}
      >
        <div
          style={{
            position: "absolute",
            top: 1,
            left: checked ? 17 : 1,
            width: 16,
            height: 16,
            backgroundColor: checked ? theme.text.inverse : theme.text.secondary,
            borderRadius: "50%",
            transition: TRANSITION.base,
          }}
        />
      </div>
      {label && (
        <span
          style={{
            fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.medium,
            color: theme.text.secondary,
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
}
