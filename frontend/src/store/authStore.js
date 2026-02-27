import { create } from 'zustand';
import api from '../lib/axios';

const useAuthStore = create((set) => ({
    userInfo: localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null,
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            set({ userInfo: data, loading: false });
        } catch (error) {
            set({
                error: error.response && error.response.data.message ? error.response.data.message : error.message,
                loading: false,
            });
            throw error;
        }
    },

    googleLogin: async (token) => {
        set({ loading: true, error: null });
        try {
            const { data } = await api.post('/auth/google', { token });
            localStorage.setItem('userInfo', JSON.stringify(data));
            set({ userInfo: data, loading: false });
        } catch (error) {
            set({
                error: error.response && error.response.data.message ? error.response.data.message : error.message,
                loading: false,
            });
            throw error;
        }
    },

    register: async (name, email, password) => {
        set({ loading: true, error: null });
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            set({ userInfo: data, loading: false });
        } catch (error) {
            set({
                error: error.response && error.response.data.message ? error.response.data.message : error.message,
                loading: false,
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('userInfo');
        set({ userInfo: null });
    },

    clearError: () => set({ error: null })
}));

export default useAuthStore;
