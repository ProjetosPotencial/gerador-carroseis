/**
 * ConfirmModal — substitui window.confirm() nativo.
 * Usa @radix-ui/react-dialog (já instalado) para dialog acessível.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { useState, useCallback } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmModalProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = "Confirmar ação",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "warning",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const iconColor = variant === "danger" ? "#EF4444" : variant === "warning" ? "#F59E0B" : "#3B82F6";

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          style={{ animation: "fadeIn 150ms ease-out" }}
        />
        <Dialog.Content
          className="fixed z-[201] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[90vw] max-w-[420px] rounded-2xl shadow-2xl p-6
            bg-[var(--v6-bg-elevated)] border border-[var(--v6-border)]"
          style={{ animation: "slideUpIn 200ms cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Icon */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${iconColor}20` }}
            >
              <AlertTriangle size={20} style={{ color: iconColor }} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-base font-bold text-[var(--v6-text-primary)] mb-1">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-[var(--v6-text-secondary)] leading-relaxed">
                {message}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-md text-[var(--v6-text-muted)] hover:text-[var(--v6-text-primary)]
                  hover:bg-[var(--v6-bg-sunken)] transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium
                bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)]
                text-[var(--v6-text-secondary)] hover:text-[var(--v6-text-primary)]
                hover:border-[var(--v6-border)] transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{
                backgroundColor: variant === "danger" ? "#EF4444" : "#FFC528",
                color: variant === "danger" ? "#fff" : "#000",
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ============================================================
// Hook useConfirm — API imperativa para abrir o modal
// ============================================================
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((v: boolean) => void) | null;
  }>({
    open: false,
    options: { message: "" },
    resolve: null,
  });

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({ open: true, options, resolve });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false, resolve: null }));
  }, [state]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false, resolve: null }));
  }, [state]);

  const modal = (
    <ConfirmModal
      open={state.open}
      {...state.options}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, modal };
}
