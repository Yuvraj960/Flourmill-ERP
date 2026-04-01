import axios from 'axios'

/**
 * Central Axios instance.
 * Base URL is set via VITE_API_BASE_URL env variable (falls back to /api
 * which is proxied to http://localhost:5000 by Vite in dev mode).
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
})

// ── Request interceptor: attach JWT from localStorage ──────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ms_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error),
)

// ── Response interceptor: global 401 handling ─────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('ms_token')
            localStorage.removeItem('ms_user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    },
)

// ── Auth endpoints ─────────────────────────────────────────────────────────
export const authAPI = {
    adminLogin: (data) => api.post('/auth/admin/login', data),
    customerLogin: (data) => api.post('/auth/customer/login', data),
    register: (data) => api.post('/auth/customer/register', data),
    me: () => api.get('/auth/me'),
}

// ── Vault endpoints ────────────────────────────────────────────────────────
export const vaultAPI = {
    getBalance: (profileId) => api.get(`/vault/${profileId}`),
    deposit: (data) => api.post('/vault/deposit', data),
    withdraw: (data) => api.post('/vault/withdraw', data),
}

// ── Ledger endpoints ───────────────────────────────────────────────────────
export const ledgerAPI = {
    getAll: (params) => api.get('/ledger', { params }),
    retailSale: (data) => api.post('/ledger/retail-sale', data),
}

// ── Inventory endpoints ────────────────────────────────────────────────────
export const inventoryAPI = {
    getAll: () => api.get('/inventory'),
    create: (data) => api.post('/inventory', data),
    update: (id, data) => api.put(`/inventory/${id}`, data),
    delete: (id) => api.delete(`/inventory/${id}`),
    lowStock: () => api.get('/inventory/low-stock'),
}

// ── Customer / Admin management endpoints ─────────────────────────────────
export const customerAPI = {
    getAll: () => api.get('/customers'),
    getByMillId: (millId) => api.get(`/customers/${millId}`),
    recoverPassword: (millId) => api.get(`/customers/${millId}/password`),
}

// ── AI Service endpoints (proxied via /ai → ai-service) ───────────────────
export const aiAPI = {
    getForecasts: () => api.get('/ai/forecast'),
    runForecast: () => api.post('/ai/forecast/run'),
    getProcurement: () => api.get('/ai/procurement'),
    chat: (data) => api.post('/ai/chat', data),
}

export default api
