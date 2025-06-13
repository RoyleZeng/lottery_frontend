<template>
    <div class="not-found">
        <h2>404 - 頁面未找到</h2>
        <p>您所請求的頁面不存在或已被移除。</p>
        <router-link to="/" class="btn">返回首頁</router-link>
    </div>
</template>

<style scoped>
.not-found {
    text-align: center;
    padding: 3rem 0;
}

.not-found h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #3498db;
}

.not-found p {
    margin-bottom: 2rem;
    font-size: 1.2rem;
}
</style>