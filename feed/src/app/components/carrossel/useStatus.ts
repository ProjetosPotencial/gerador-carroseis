import { useState, useCallback } from "react";

export type Status =
  | { tipo: "idle" }
  | { tipo: "exportando"; atual: number; total: number }
  | { tipo: "sucesso"; msg: string }
  | { tipo: "erro"; msg: string };

export interface UseStatusReturn {
  status: Status;
  setStatus: React.Dispatch<React.SetStateAction<Status>>;
  /** Limpa pra idle. */
  resetStatus: () => void;
  /** Atalho: marca sucesso e auto-limpa em N ms (default 3000). */
  sucesso: (msg: string, autoCloseMs?: number) => void;
  /** Atalho: marca erro (não auto-limpa). */
  erro: (msg: string) => void;
  /** Atalho: marca progresso de exportação. */
  exportando: (atual: number, total: number) => void;
}

/**
 * Hook que centraliza mensagens de status do editor (sucesso, erro, progresso).
 * Evita repetir setStatus + setTimeout em cada lugar.
 */
export function useStatus(): UseStatusReturn {
  const [status, setStatus] = useState<Status>({ tipo: "idle" });

  const resetStatus = useCallback(() => setStatus({ tipo: "idle" }), []);

  const sucesso = useCallback((msg: string, autoCloseMs: number = 3000) => {
    setStatus({ tipo: "sucesso", msg });
    if (autoCloseMs > 0) {
      setTimeout(() => setStatus({ tipo: "idle" }), autoCloseMs);
    }
  }, []);

  const erro = useCallback((msg: string) => {
    setStatus({ tipo: "erro", msg });
  }, []);

  const exportando = useCallback((atual: number, total: number) => {
    setStatus({ tipo: "exportando", atual, total });
  }, []);

  return { status, setStatus, resetStatus, sucesso, erro, exportando };
}
