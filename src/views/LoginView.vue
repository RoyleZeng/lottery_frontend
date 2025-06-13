<template>
    <div class="login-container">
        <div class="card login-card">
            <h2>抽獎系統登入</h2>

            <div v-if="error" class="alert alert-danger">
                {{ error }}
            </div>

            <form @submit.prevent="handleLogin">
                <div class="form-group">
                    <label for="username" class="form-label">帳號</label>
                    <input type="text" id="username" v-model="username" class="form-control" required
                        autocomplete="username" />
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">密碼</label>
                    <input type="password" id="password" v-model="password" class="form-control" required
                        autocomplete="current-password" />
                </div>

                <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
                    {{ loading ? '登入中...' : '登入' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
    loading.value = true;
    error.value = '';

    try {
        const success = await authStore.login(username.value, password.value);

        if (success) {
            router.push('/');
        } else {
            error.value = '登入失敗，請檢查帳號密碼是否正確';
        }
    } catch (err) {
        error.value = '登入時發生錯誤，請稍後再試';
        console.error('Login error:', err);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 70vh;
}

.login-card {
    width: 100%;
    max-width: 400px;
}

.login-card h2 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #3498db;
}

.login-btn {
    width: 100%;
    margin-top: 1rem;
}
</style>