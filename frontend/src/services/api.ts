import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }
});

api.interceptors.request.use((config) => {
    const name = "XSRF-TOKEN=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    
    let token = "";
    for (let i = 0; i < ca.length; i++) {
        const c = ca[i].trim(); // Fixed: Use 'const' to satisfy ESLint
        if (c.indexOf(name) === 0) {
            token = c.substring(name.length, c.length);
        }
    }

    if (token) {
        config.headers['X-XSRF-TOKEN'] = token;
    }
    
    return config;
}, (error) => Promise.reject(error));

export default api;