import axios from 'axios'

// Environment detection and API base URL configuration
const getApiBaseUrl = () => {
    // Check for forced API URL (for testing production API locally)
    const forceApiUrl = import.meta.env.VITE_FORCE_API_URL
    if (forceApiUrl) {
        // 线上API需要 /api 前缀
        return `${forceApiUrl}/api`
    }
    
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV
    
    // Check if we're running on localhost (development)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '0.0.0.0'
    
    // Development environment: use proxy (proxy will remove /api prefix)
    if (isDevelopment || isLocalhost) {
        return '/api'
    }
    
    // Production environment: use direct API URL with /api prefix
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://140.120.40.192'
    return `${baseUrl}/api`
}

// Get the API base URL
const apiBaseUrl = getApiBaseUrl()

// Log environment info for debugging
console.log('🔧 API Configuration:')
console.log('  - Environment:', import.meta.env.DEV ? 'Development' : 'Production')
console.log('  - Hostname:', window.location.hostname)
console.log('  - API Base URL:', apiBaseUrl)

// Create axios instance with default config
const api = axios.create({
    baseURL: apiBaseUrl,
    timeout: 60000, // Extended to 1 minute for file upload and processing
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// Add debug logging for axios instance creation
console.log('🚀 Axios instance created:')
console.log('  - Base URL:', apiBaseUrl)
console.log('  - Interceptors count:', api.interceptors.request.handlers.length)

// Also set default Authorization header as fallback
const updateDefaultHeaders = () => {
    const token = localStorage.getItem('token')
    if (token) {
        api.defaults.headers.common['Authorization'] = token
        console.log('🔧 Default Authorization header updated (no Bearer prefix)')
    } else {
        delete api.defaults.headers.common['Authorization']
        console.log('🗑️ Default Authorization header removed')
    }
}

// Update default headers on initial load
updateDefaultHeaders()

// Export the update function for manual refresh
window.updateApiHeaders = updateDefaultHeaders

// Request interceptor
api.interceptors.request.use(
    config => {
        // Get token from localStorage
        const token = localStorage.getItem('token')
        console.log('🔐 Request Interceptor:')
        console.log('  - Token exists:', !!token)
        console.log('  - Token length:', token ? token.length : 0)
        console.log('  - Request URL:', config.url)
        console.log('  - Request method:', config.method)
        console.log('  - Original headers:', JSON.stringify(config.headers, null, 2))
        
        if (token) {
            // Set Authorization header directly with token (no "Bearer " prefix)
            config.headers['Authorization'] = token
            config.headers.Authorization = token
            if (!config.headers.common) config.headers.common = {}
            config.headers.common['Authorization'] = token
            
            console.log('  - Authorization header added (no Bearer prefix):', token.substring(0, 30) + '...')
            console.log('  - Final headers:', JSON.stringify(config.headers, null, 2))
        } else {
            console.log('  - No token found, Authorization header NOT added')
        }
        
        return config
    },
    error => {
        console.error('Request interceptor error:', error)
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    response => response,
    error => {
        const { response } = error

        if (response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }

        return Promise.reject(error)
    }
)

export default api 