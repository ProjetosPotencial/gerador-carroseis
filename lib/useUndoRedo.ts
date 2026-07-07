/**
 * useUndoRedo — histórico de estados com undo/redo.
 * Armazena até MAX_HISTORY snapshots usando useReducer.
 */
import { useReducer, useCallback } from "react";

const MAX_HISTORY = 50;

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

type HistoryAction<T> =
  | { type: "SET"; payload: T }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; payload: T };

function historyReducer<T>(
  state: HistoryState<T>,
  action: HistoryAction<T>
): HistoryState<T> {
  switch (action.type) {
    case "SET": {
      const past = [...state.past, state.present].slice(-MAX_HISTORY);
      return { past, present: action.payload, future: [] };
    }
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }
    case "RESET": {
      return { past: [], present: action.payload, future: [] };
    }
  }
}

export interface UseUndoRedoReturn<T> {
  state: T;
  set: (value: T) => void;
  undo: () => void;
  redo: () => void;
  reset: (value: T) => void;
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
}

export function useUndoRedo<T>(initialState: T): UseUndoRedoReturn<T> {
  const [history, dispatch] = useReducer(
    historyReducer as (s: HistoryState<T>, a: HistoryAction<T>) => HistoryState<T>,
    { past: [], present: initialState, future: [] }
  );

  const set = useCallback((value: T) => {
    dispatch({ type: "SET", payload: value });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const reset = useCallback((value: T) => {
    dispatch({ type: "RESET", payload: value });
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historySize: history.past.length,
  };
}
