import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Build-Version': 'lucky-boba-v2'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('lucky_boba_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Handle Session Expiry (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/login');
        const isLogoutRequest = error.config?.url?.includes('/logout');

        if (error.response?.status === 401 && !isLoginRequest && !isLogoutRequest) {
            localStorage.removeItem('lucky_boba_token');
            localStorage.removeItem('lucky_boba_authenticated');
            localStorage.removeItem('dashboard_stats');
            localStorage.removeItem('dashboard_stats_timestamp');
            
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login?reason=expired';
            }
        }
        return Promise.reject(error);
    }
);

export default api;