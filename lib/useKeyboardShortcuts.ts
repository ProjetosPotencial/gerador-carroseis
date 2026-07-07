/**
 * useKeyboardShortcuts — atalhos de teclado globais para o editor.
 * Registra listeners no document com cleanup correto.
 */
import { useEffect, useCallback } from "react";

export interface ShortcutMap {
  [combo: string]: (e: KeyboardEvent) => void;
}

/**
 * Normaliza um evento de teclado para uma string de atalho.
 * Exemplos: "ctrl+z", "arrowleft", "d", "delete"
 */
function normalizeCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  parts.push(e.key.toLowerCase());
  return parts.join("+");
}

/**
 * Hook principal para atalhos globais.
 *
 * @param shortcuts - mapa de combo → handler
 * @param enabled - se false, desativa todos os atalhos (ex: quando input está focado)
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled: boolean = true
): void {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Não ativa atalhos quando o foco está em campos de texto
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      const combo = normalizeCombo(e);

      // Atalhos que funcionam mesmo em campos de texto (Ctrl+Z, Ctrl+Y)
      const allowedInEditing = ["ctrl+z", "ctrl+y", "ctrl+shift+z"];

      if (isEditing && !allowedInEditing.includes(combo)) return;

      const fn = shortcuts[combo];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handler]);
}

/**
 * Atalhos padrão do editor de carrossel.
 * Use como base e sobreponha o que precisar.
 */
export interface EditorShortcutOptions {
  onPrev: () => void;
  onNext: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onNew: () => void;
  onDelete: () => void;
  onExport: () => void;
  enabled?: boolean;
}

export function useEditorShortcuts({
  onPrev,
  onNext,
  onUndo,
  onRedo,
  onDuplicate,
  onNew,
  onDelete,
  onExport,
  enabled = true,
}: EditorShortcutOptions): void {
  useKeyboardShortcuts(
    {
      arrowleft: onPrev,
      arrowright: onNext,
      j: onPrev,
      k: onNext,
      "ctrl+z": onUndo,
      "ctrl+y": onRedo,
      "ctrl+shift+z": onRedo,
      d: onDuplicate,
      n: onNew,
      delete: onDelete,
      backspace: onDelete,
      "ctrl+e": onExport,
    },
    enabled
  );
}
