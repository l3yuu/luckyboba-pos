import axios from 'axios';

/**
 * AXIOS INSTANCE CONFIGURATION
 */
const api = axios.create({
    // Value: https://luckyboba-pos-production.up.railway.app/api
    baseURL: import.meta.env.VITE_API_BASE_URL,
    
    // Allows browser to send/receive cookies cross-domain (Required for Sanctum)
    withCredentials: true,
    
    // Automatic XSRF header handling for supported backends
    withXSRFToken: true,
    
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }
});

/**
 * MANUAL CSRF INTERCEPTOR
 * Manually injects the X-XSRF-TOKEN header into requests.
 */
api.interceptors.request.use((config) => {
    // 1. Get cookies and find the XSRF-TOKEN
    const name = "XSRF-TOKEN=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    
    let token = "";
    for (let i = 0; i < ca.length; i++) {
        const c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            token = c.substring(name.length, c.length);
        }
    }

    // 2. If token exists, attach it to the header Laravel expects
    if (token) {
        config.headers['X-XSRF-TOKEN'] = token;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

/**
 * RESPONSE INTERCEPTOR
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 419) {
            console.error("CSRF Token mismatch or Session expired.");
            // Optional: Redirect to login or refresh page
            // window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default api;