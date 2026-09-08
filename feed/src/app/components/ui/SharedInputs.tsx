/**
 * SharedInputs — componentes de formulário reutilizáveis.
 * Substitui as definições duplicadas em CoverEditorAvancado e GeradorLote.
 */
import React from "react";

// ============================================================
// FIELD WRAPPER
// ============================================================
export function FieldWrapper({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--v6-text-secondary)]">
        {label}
      </label>
      {children}
      {hint && <div className="text-xs text-[var(--v6-text-muted)]">{hint}</div>}
    </div>
  );
}

// ============================================================
// TOGGLE FIELD — label com checkbox + conteúdo condicionado
// ============================================================
export function ToggleField({
  id,
  label,
  checked,
  onChange,
  children,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer select-none group">
        <div
          onClick={() => onChange(!checked)}
          role="checkbox"
          aria-checked={checked}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") onChange(!checked); }}
          className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
            checked ? "bg-[#FFC528]" : "bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              checked ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </div>
        <span className="text-sm text-[var(--v6-text-secondary)] group-hover:text-[var(--v6-text-primary)] transition-colors">
          {label}
        </span>
      </label>
      <div className={`transition-opacity duration-150 ${checked ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// TEXT INPUT — styled com tokens v6
// ============================================================
export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
  disabled,
  type = "text",
  className = "",
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className={`w-full px-3 py-2.5 rounded-lg text-sm
        bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)]
        text-[var(--v6-text-primary)] placeholder:text-[var(--v6-text-muted)]
        focus:outline-none focus:border-[#FFC528] focus:ring-2 focus:ring-[#FFC528]/20
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-[border-color,box-shadow] duration-150
        ${className}`}
    />
  );
}

// ============================================================
// TEXTAREA — styled com tokens v6
// ============================================================
export function Textarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  disabled,
  readOnly,
  mono,
  resize = true,
  className = "",
  onFocus,
}: {
  id?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  readOnly?: boolean;
  mono?: boolean;
  resize?: boolean;
  className?: string;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      disabled={disabled}
      readOnly={readOnly}
      onFocus={onFocus}
      className={`w-full px-3 py-2.5 rounded-lg text-sm
        bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)]
        text-[var(--v6-text-primary)] placeholder:text-[var(--v6-text-muted)]
        focus:outline-none focus:border-[#FFC528] focus:ring-2 focus:ring-[#FFC528]/20
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-[border-color,box-shadow] duration-150
        ${mono ? "font-mono" : ""}
        ${resize ? "resize-y" : "resize-none"}
        ${className}`}
      spellCheck={false}
    />
  );
}

// ============================================================
// SELECT — styled com tokens v6
// ============================================================
export function Select({
  id,
  value,
  onChange,
  children,
  className = "",
}: {
  id?: string;
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2.5 rounded-lg text-sm
        bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)]
        text-[var(--v6-text-primary)]
        focus:outline-none focus:border-[#FFC528] focus:ring-2 focus:ring-[#FFC528]/20
        transition-[border-color,box-shadow] duration-150
        cursor-pointer
        ${className}`}
    >
      {children}
    </select>
  );
}
