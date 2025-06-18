<template>
    <!-- 双重检查：只在开发环境显示 -->
    <div v-if="shouldShowEnvironmentInfo" class="environment-info">
        <h3>🔧 环境信息</h3>
        <div class="info-grid">
            <div class="info-item">
                <strong>运行模式:</strong>
                <span :class="{ 'dev': isDevelopment, 'prod': !isDevelopment }">
                    {{ isDevelopment ? '开发环境' : '生产环境' }}
                </span>
            </div>
            <div class="info-item">
                <strong>主机名:</strong>
                <span>{{ hostname }}</span>
            </div>
            <div class="info-item">
                <strong>是否本地:</strong>
                <span :class="{ 'local': isLocalhost, 'remote': !isLocalhost }">
                    {{ isLocalhost ? '是' : '否' }}
                </span>
            </div>
            <div class="info-item">
                <strong>API基础URL:</strong>
                <span class="api-url">{{ apiBaseUrl }}</span>
            </div>
            <div class="info-item" v-if="isForceApiUrl">
                <strong>⚠️ 强制API:</strong>
                <span class="force-api">使用线上API进行测试</span>
            </div>
            <div class="info-item">
                <strong>当前URL:</strong>
                <span>{{ currentUrl }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const hostname = ref(window.location.hostname)
const currentUrl = ref(window.location.href)

// 严格的开发环境检查
const isDevelopment = computed(() => {
    return import.meta.env.DEV &&
        (hostname.value === 'localhost' ||
            hostname.value === '127.0.0.1' ||
            hostname.value === '0.0.0.0')
})
const isLocalhost = computed(() =>
    hostname.value === 'localhost' ||
    hostname.value === '127.0.0.1' ||
    hostname.value === '0.0.0.0'
)

const isForceApiUrl = computed(() => !!import.meta.env.VITE_FORCE_API_URL)

// 双重检查：确保只在开发环境显示组件
const shouldShowEnvironmentInfo = computed(() => {
    // 如果设置了隐藏环境信息的变量，则不显示
    if (import.meta.env.VITE_HIDE_ENV_INFO === 'true') {
        return false
    }

    return import.meta.env.DEV &&
        import.meta.env.MODE === 'development' &&
        (hostname.value === 'localhost' ||
            hostname.value === '127.0.0.1' ||
            hostname.value === '0.0.0.0')
})

const apiBaseUrl = computed(() => {
    const forceApiUrl = import.meta.env.VITE_FORCE_API_URL
    if (forceApiUrl) {
        return `${forceApiUrl}/api (强制使用线上API)`
    }

    if (isDevelopment.value || isLocalhost.value) {
        return '/api (通过代理到 http://localhost:8000)'
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://140.120.40.192'
    return `${baseUrl}/api`
})

onMounted(() => {
    // 只在开发环境输出调试信息
    if (shouldShowEnvironmentInfo.value) {
        console.log('🔧 Environment Info Component Loaded')
        console.log('  - Development:', isDevelopment.value)
        console.log('  - Localhost:', isLocalhost.value)
        console.log('  - Mode:', import.meta.env.MODE)
        console.log('  - Should Show:', shouldShowEnvironmentInfo.value)
        console.log('  - API Base URL:', apiBaseUrl.value)
    }
})
</script>

<style scoped>
.environment-info {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    font-family: monospace;
}

.info-grid {
    display: grid;
    gap: 0.5rem;
    margin-top: 1rem;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.info-item strong {
    color: #495057;
}

.dev {
    color: #28a745;
    font-weight: bold;
}

.prod {
    color: #dc3545;
    font-weight: bold;
}

.local {
    color: #17a2b8;
    font-weight: bold;
}

.remote {
    color: #6c757d;
}

.api-url {
    color: #007bff;
    font-weight: bold;
}

.force-api {
    color: #dc3545;
    font-weight: bold;
}
</style>