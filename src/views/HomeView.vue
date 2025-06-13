<template>
    <div class="home">
        <h2>抽獎系統首頁</h2>

        <div class="welcome-section card">
            <h3>歡迎使用抽獎系統</h3>
            <p>本系統提供以下功能：</p>
            <ul>
                <li>學生學習問卷抽獎管理</li>
                <li>期末評量抽獎管理</li>
            </ul>

            <div class="action-buttons">
                <router-link to="/lottery" class="btn btn-primary">進入抽獎管理</router-link>
            </div>
        </div>

        <div class="features-section card">
            <h3>系統功能說明</h3>

            <div class="feature-item">
                <h4>抽獎活動選擇</h4>
                <p>選擇要進行的特定抽獎活動，如「113-2學期學生學習問卷抽獎」、「113-2學期期末評量抽獎」等。</p>
            </div>

            <div class="feature-item">
                <h4>檢視待抽名單</h4>
                <p>顯示當前選定抽獎活動的待抽學生名單，包含總人數與各項資訊。</p>
            </div>

            <div class="feature-item">
                <h4>獎項設定</h4>
                <p>為當前選定的抽獎活動設定獎品名稱與數量，可動態增加或刪除獎項。</p>
            </div>

            <div class="feature-item">
                <h4>執行抽獎</h4>
                <p>從待抽名單中隨機抽出中獎者，並即時顯示各獎項的中獎名單。</p>
            </div>

            <div class="feature-item">
                <h4>匯出中獎名單</h4>
                <p>將特定抽獎活動的完整中獎名單匯出為 Excel 檔案。</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
</script>

<style scoped>
.home h2 {
    margin-bottom: 1.5rem;
}

.welcome-section {
    margin-bottom: 2rem;
}

.welcome-section h3 {
    color: #3498db;
    margin-bottom: 1rem;
}

.action-buttons {
    margin-top: 1.5rem;
}

.features-section h3 {
    color: #3498db;
    margin-bottom: 1.5rem;
}

.feature-item {
    margin-bottom: 1.5rem;
}

.feature-item h4 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
}
</style>