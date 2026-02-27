import axios from 'axios';

const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL;
    if (url) {
        // Ensure url doesn't end with slash before appending
        url = url.replace(/\/$/, '');
        return url.endsWith('/api') ? url : `${url}/api`;
    }
    return 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const parsed = JSON.parse(userInfo);
            if (parsed.token) {
                config.headers.Authorization = `Bearer ${parsed.token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401s
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
