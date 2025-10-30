import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '')
    const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
    const isAuthenticated = computed(() => !!token.value)

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { email: username, password })

            if (response.data && response.data.result.access_token) {
                token.value = response.data.result.access_token
                user.value = response.data.result.user

                localStorage.setItem('token', token.value)
                localStorage.setItem('user', JSON.stringify(user.value))

                // Update axios default headers
                if (window.updateApiHeaders) {
                    window.updateApiHeaders()
                }

                return true
            }
            return false
        } catch (error) {
            console.error('Login failed:', error)
            return false
        }
    }

    const logout = () => {
        token.value = ''
        user.value = null

        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    return {
        token,
        user,
        isAuthenticated,
        login,
        logout
    }
}) 