import { create } from 'zustand';

interface GenerationFailureState {
  failedByParent: Record<string, number>;
  incrementFailed: (parentCorrelationId: string) => void;
  clearForParent: (parentCorrelationId: string) => void;
}

export const useGenerationFailureStore = create<GenerationFailureState>((set) => ({
  failedByParent: {},
  incrementFailed: (parentCorrelationId) =>
    set((state) => ({
      failedByParent: {
        ...state.failedByParent,
        [parentCorrelationId]: (state.failedByParent[parentCorrelationId] ?? 0) + 1
      }
    })),
  clearForParent: (parentCorrelationId) =>
    set((state) => {
      if (!(parentCorrelationId in state.failedByParent)) return state;
      const next = { ...state.failedByParent };
      delete next[parentCorrelationId];
      return { failedByParent: next };
    })
}));
