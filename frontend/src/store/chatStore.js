import { create } from 'zustand';

const useChatStore = create((set) => ({
    messages: [],
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    updateMessage: (id, updater) => set((state) => ({
        messages: state.messages.map(m => m.id === id ? updater(m) : m)
    })),
    clearMessages: () => set({ messages: [] }),
}));

export default useChatStore;
