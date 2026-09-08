/**
 * useLocalStorage — hook genérico para persistência no localStorage.
 * Serializa/deserializa JSON com tratamento seguro de erros.
 */
import { useState, useCallback, useEffect, useRef } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // quota exceeded ou modo privado — ignora silenciosamente
        }
        return next;
      });
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {}
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * useLocalStorageDebounced — igual ao acima mas persiste com delay.
 * Útil para evitar escritas excessivas durante edição contínua.
 */
export function useLocalStorageDebounced<T>(
  key: string,
  value: T,
  delayMs: number = 800
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, value, delayMs]);
}
