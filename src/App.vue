<template>
    <header class="app-header">
        <div class="container">
            <div class="header-content">
                <div class="logo-section">
                    <img src="/logo.jpg" alt="抽獎系統 Logo" class="logo" />
                    <h1>抽獎系統</h1>
                </div>
                <nav v-if="isLoggedIn" class="nav-section">
                    <router-link to="/" class="nav-link">
                        <span class="nav-icon">🏠</span>
                        首頁
                    </router-link>
                    <router-link to="/lottery" @click="resetLotteryState" class="nav-link">
                        <span class="nav-icon">🎲</span>
                        抽獎管理
                    </router-link>
                    <a href="#" @click.prevent="logout" class="nav-link logout-link">
                        <span class="nav-icon">🚪</span>
                        登出
                    </a>
                </nav>
            </div>
        </div>
    </header>

    <main class="container">
        <router-view />
    </main>

    <footer class="app-footer">
        <div class="container">
            <p>&copy; {{ new Date().getFullYear() }} 抽獎系統</p>
        </div>
    </footer>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useLotteryStore } from './stores/lottery';

const router = useRouter();
const authStore = useAuthStore();
const lotteryStore = useLotteryStore();

const isLoggedIn = computed(() => authStore.isAuthenticated);

const logout = () => {
    authStore.logout();
    router.push('/login');
};

const resetLotteryState = () => {
    // Reset lottery state when clicking on lottery management
    lotteryStore.selectType(null);
};
</script>

<style>
.app-header {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 50%, #1f4e79 100%);
    color: white;
    padding: 1rem 0;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(52, 152, 219, 0.3);
    position: relative;
    overflow: hidden;
}

.app-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="20" cy="80" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    pointer-events: none;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
}

.logo-section {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.logo {
    width: 100px;
    height: 100px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    transition: transform 0.3s ease;
}

.logo:hover {
    transform: scale(1.1) rotate(5deg);
}

.app-header h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    letter-spacing: 1px;
}

.nav-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
    text-decoration: none;
    padding: 0.75rem 1.25rem;
    border-radius: 25px;
    transition: all 0.3s ease;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
}

.nav-link::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
}

.nav-link:hover::before {
    left: 100%;
}

.nav-link:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-link.router-link-active {
    background: rgba(255, 255, 255, 0.25);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.nav-icon {
    font-size: 1.1rem;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.logout-link:hover {
    background: rgba(231, 76, 60, 0.8);
    border-color: rgba(231, 76, 60, 0.6);
}

.app-footer {
    margin-top: 2rem;
    padding: 1.5rem 0;
    text-align: center;
    color: #666;
    border-top: 1px solid #eee;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.app-footer p {
    margin: 0;
    font-size: 0.9rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        gap: 1rem;
    }

    .logo-section {
        justify-content: center;
    }

    .nav-section {
        flex-wrap: wrap;
        justify-content: center;
    }

    .nav-link {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }

    .app-header h1 {
        font-size: 1.5rem;
    }

    .logo {
        width: 40px;
        height: 40px;
    }
}
</style>