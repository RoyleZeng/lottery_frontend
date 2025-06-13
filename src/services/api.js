import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.PROD ? 'http://140.120.40.192/api' : '/api', // Production vs Development
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// Request interceptor
api.interceptors.request.use(
    config => {
        // Get token from localStorage
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    error => {
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