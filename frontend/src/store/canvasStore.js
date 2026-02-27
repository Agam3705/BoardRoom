import { create } from 'zustand';

const useCanvasStore = create((set, get) => ({
    tool: 'pencil', // pencil, eraser
    color: '#000000',
    brushSize: 3,
    elements: [],
    history: [],
    historyStep: -1,

    setTool: (tool) => set({ tool }),
    setColor: (color) => set({ color }),
    setBrushSize: (size) => set({ brushSize: size }),

    setElements: (newElements, emit = true) => {
        const { history, historyStep, elements } = get();

        // We update history for local drawing (emit=true) or if another user added/removed an element
        // For simple properties change (like dragging), we might skip history to save memory, 
        // but for now let's record if length changed or if emit is true.
        const isNewAction = emit || newElements.length !== elements.length;

        if (isNewAction) {
            const newHistory = history.slice(0, historyStep + 1);
            newHistory.push(newElements);
            set({
                elements: newElements,
                history: newHistory,
                historyStep: newHistory.length - 1
            });
        } else {
            set({ elements: newElements });
        }
    },

    clearCanvas: () => set({ elements: [], history: [[]], historyStep: 0 }),

    undo: () => {
        const { historyStep, history } = get();
        if (historyStep > 0) {
            const newStep = historyStep - 1;
            set({
                historyStep: newStep,
                elements: history[newStep]
            });
            return history[newStep];
        }
        return null;
    },

    redo: () => {
        const { historyStep, history } = get();
        if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            set({
                historyStep: newStep,
                elements: history[newStep]
            });
            return history[newStep];
        }
        return null;
    },

    setHistoryStep: (step) => {
        const { history } = get();
        if (step >= 0 && step < history.length) {
            set({
                historyStep: step,
                elements: history[step]
            });
            return history[step];
        }
        return null;
    }
}));

export default useCanvasStore;
