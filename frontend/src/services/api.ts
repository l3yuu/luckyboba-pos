import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    // Note: withCredentials is NOT needed for Bearer Tokens
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Build-Version': 'lucky-boba-v2'
    }
});

api.interceptors.request.use((config) => {
    // Grab the Bearer token from storage
    const token = localStorage.getItem('lucky_boba_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Bearer Token attached to header.");
    } else {
        console.warn("No Bearer Token found in storage.");
    }
    
    return config;
}, (error) => Promise.reject(error));

export default api;