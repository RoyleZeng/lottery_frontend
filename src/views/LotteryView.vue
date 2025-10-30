<template>
    <div class="lottery-view">
        <h2>抽獎管理</h2>

        <!-- Error Alert -->
        <div v-if="lotteryStore.error" class="alert alert-danger">
            {{ lotteryStore.error }}
        </div>

        <!-- Loading Indicator -->
        <div v-if="lotteryStore.loading" class="loading-indicator">
            <p>載入中，請稍候...</p>
        </div>

        <!-- Step 1: Type Selection -->
        <div class="card lottery-types" v-if="!lotteryStore.selectedType && !lotteryStore.loading">
            <h3>選擇抽獎類型</h3>
            <p>請選擇要進行的抽獎類型：</p>

            <div class="type-list">
                <div v-for="type in lotteryStore.lotteryTypes" :key="type.id" class="type-item"
                    @click="selectType(type.id)">
                    <h4>{{ type.name }}</h4>
                    <p>{{ type.description }}</p>
                </div>
            </div>
        </div>

        <!-- Step 2: Event Selection -->
        <div class="card lottery-events" v-if="lotteryStore.selectedType && !selectedEventId && !lotteryStore.loading">
            <div class="section-header">
                <h3>選擇抽獎活動</h3>
                <div class="header-actions">
                    <button class="btn btn-primary" @click="openCreateEventModal">
                        新增活動
                    </button>
                    <button class="btn btn-secondary" @click="goBackToTypes">
                        ← 返回類型選擇
                    </button>
                </div>
            </div>

            <div class="selected-type-info">
                <p><strong>已選擇類型：</strong>{{ getSelectedTypeName() }}</p>
            </div>

            <!-- Filter Section -->
            <div class="filter-section">
                <div class="filter-group">
                    <label for="year-filter" class="filter-label">📅 學年篩選：</label>
                    <select id="year-filter" v-model="selectedYear" @change="filterEventsByYear" class="filter-select">
                        <option value="">所有學年</option>
                        <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                    </select>
                </div>
                <div class="events-count">
                    <span class="count-badge">共 {{ filteredEvents.length }} 個活動</span>
                </div>
            </div>

            <div v-if="lotteryStore.lotteryEvents.length === 0" class="empty-state">
                <div class="empty-icon">🎯</div>
                <h3>目前沒有抽獎活動</h3>
                <p>請新增一個活動開始使用抽獎系統</p>
                <button class="btn btn-primary" @click="openCreateEventModal">
                    <span>📝</span> 立即新增活動
                </button>
            </div>

            <div v-else class="event-list">
                <div v-for="event in filteredEvents" :key="event.id" class="event-item" @click="selectEvent(event.id)">
                    <div class="event-header">
                        <span :class="getStatusClass(event.status)">
                            <span class="status-icon">{{ getStatusIcon(event.status) }}</span>
                            {{ getStatusText(event.status) }}
                        </span>
                        <div class="event-actions">
                            <button class="edit-btn" @click.stop="openEditEventModal(event)"
                                :disabled="lotteryStore.loading" title="編輯活動">
                                ✏️
                            </button>
                            <button class="delete-btn" @click.stop="confirmDeleteEvent(event)"
                                :disabled="lotteryStore.loading" title="刪除活動">
                                🗑️
                            </button>
                        </div>
                    </div>

                    <div class="event-content">
                        <h4>{{ event.name }}</h4>
                        <p class="academic-year">{{ event.academic_year_term }}</p>
                        <small class="event-description">{{ event.description }}</small>
                    </div>

                    <div class="event-footer">
                        <span class="event-date">{{ formatDate(event.event_date) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Event Modal -->
        <div v-if="showCreateEventModal" class="modal-overlay" @click="handleCreateModalBackgroundClick">
            <div class="modal-content create-event-modal" @click.stop>
                <div class="modal-header">
                    <h3>新增抽獎活動</h3>
                    <button class="modal-close" @click="closeCreateEventModal">×</button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="createEvent">
                        <div class="form-group">
                            <label for="event-name" class="form-label">活動名稱</label>
                            <input type="text" id="event-name" v-model="newEvent.name" class="form-control" required />
                        </div>

                        <div class="form-group">
                            <label for="academic-year-term" class="form-label">學年學期</label>
                            <input type="text" id="academic-year-term" v-model="newEvent.academic_year_term"
                                class="form-control" placeholder="例如：112-1" required />
                        </div>

                        <div class="form-group">
                            <label for="event-description" class="form-label">活動描述</label>
                            <textarea ref="descriptionTextarea" id="event-description" v-model="newEvent.description"
                                class="form-control" rows="3" required></textarea>
                        </div>

                        <div class="form-group">
                            <label for="event-date" class="form-label">活動日期</label>
                            <input type="datetime-local" id="event-date" v-model="newEvent.event_date"
                                class="form-control" required />
                        </div>

                        <div class="form-group">
                            <label for="event-type" class="form-label">活動類型</label>
                            <select id="event-type" v-model="newEvent.type" class="form-control" required>
                                <option value="general">學生學習問卷抽獎</option>
                                <option value="final_teaching">期末評量抽獎</option>
                            </select>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" @click="closeCreateEventModal">
                                取消
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="lotteryStore.loading">
                                建立活動
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Edit Event Modal -->
        <div v-if="showEditEventModal" class="modal-overlay" @click="handleEditModalBackgroundClick">
            <div class="modal-content edit-event-modal" @click.stop>
                <div class="modal-header">
                    <h3>編輯抽獎活動</h3>
                    <button class="modal-close" @click="closeEditEventModal">×</button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="updateEvent">
                        <div class="form-group">
                            <label for="edit-event-name" class="form-label">活動名稱</label>
                            <input type="text" id="edit-event-name" v-model="editEvent.name" class="form-control"
                                required />
                        </div>

                        <div class="form-group">
                            <label for="edit-academic-year-term" class="form-label">學年學期</label>
                            <input type="text" id="edit-academic-year-term" v-model="editEvent.academic_year_term"
                                class="form-control" placeholder="例如：112-1" required />
                        </div>

                        <div class="form-group">
                            <label for="edit-event-description" class="form-label">活動描述</label>
                            <textarea id="edit-event-description" v-model="editEvent.description" class="form-control"
                                rows="3" required></textarea>
                        </div>

                        <div class="form-group">
                            <label for="edit-event-date" class="form-label">活動日期</label>
                            <input type="datetime-local" id="edit-event-date" v-model="editEvent.event_date"
                                class="form-control" required />
                        </div>

                        <div class="form-group">
                            <label for="edit-event-type" class="form-label">活動類型</label>
                            <select id="edit-event-type" v-model="editEvent.type" class="form-control" required>
                                <option value="general">學生學習問卷抽獎</option>
                                <option value="final_teaching">期末評量抽獎</option>
                            </select>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" @click="closeEditEventModal">
                                取消
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="lotteryStore.loading">
                                更新活動
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Step 3: Lottery Management -->
        <div v-if="selectedEventId">
            <!-- Breadcrumb -->
            <div class="breadcrumb">
                <span @click="goBackToTypes" class="breadcrumb-link">{{ getSelectedTypeName() }}</span>
                <span class="breadcrumb-separator">></span>
                <span @click="goBackToEvents" class="breadcrumb-link">活動選擇</span>
                <span class="breadcrumb-separator">></span>
                <span>{{ getCurrentEventName() }}</span>
            </div>

            <!-- Tabs Navigation -->
            <div class="lottery-tabs">
                <div class="tab-item" :class="{ 'active': activeTab === 'participants' }"
                    @click="activeTab = 'participants'">
                    待抽名單
                </div>
                <div class="tab-item" :class="{ 'active': activeTab === 'prizes' }" @click="activeTab = 'prizes'">
                    獎項設定
                </div>
                <div class="tab-item" :class="{ 'active': activeTab === 'draw' }" @click="activeTab = 'draw'">
                    執行抽獎
                </div>
                <div class="tab-item" :class="{ 'active': activeTab === 'winners' }" @click="activeTab = 'winners'">
                    中獎名單
                </div>
            </div>

            <!-- Tab Content -->
            <div class="tab-content card">
                <!-- Participants Tab -->
                <div v-if="activeTab === 'participants'">
                    <div class="participants-header">
                        <h3>待抽名單</h3>
                        <div class="participants-actions">
                            <input type="file" ref="fileInput" @change="handleFileUpload" accept=".xlsx,.xls,.csv"
                                style="display: none" />
                            <button class="btn btn-primary" @click="$refs.fileInput.click()"
                                :disabled="lotteryStore.loading">
                                上傳檔案
                            </button>
                            <button class="btn btn-danger" @click="confirmDeleteAllParticipants"
                                :disabled="lotteryStore.loading || lotteryStore.participants.length === 0">
                                清空名單
                            </button>
                            <span class="participants-count">總人數: {{ lotteryStore.participantsTotal }}</span>
                        </div>
                    </div>

                    <div class="table-responsive" v-if="lotteryStore.participants.length > 0">
                        <table>
                            <thead>
                                <tr>
                                    <th>序號</th>
                                    <th v-for="column in getDisplayColumns()" :key="column.key">
                                        {{ column.label }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(participant, index) in lotteryStore.participants" :key="index">
                                    <td>{{ index + 1 }}</td>
                                    <td v-for="column in getDisplayColumns()" :key="`${index}-${column.key}`">
                                        <span v-if="column.type === 'boolean'">
                                            <span
                                                v-if="participant[column.key] === true || participant[column.key] === 'Y'"
                                                class="check-icon">✓</span>
                                            <span v-else class="cross-icon">✗</span>
                                        </span>
                                        <span v-else>{{ participant[column.key] || '-' }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-else>
                        <div class="empty-participants">
                            <p>沒有待抽名單資料</p>
                            <p>請上傳 Excel 或 CSV 檔案來匯入參與者名單</p>
                            <button class="btn btn-primary" @click="$refs.fileInput.click()">
                                上傳檔案
                            </button>
                        </div>
                    </div>

                    <!-- Upload Instructions -->
                    <div class="upload-instructions">
                        <h4>📋 檔案上傳說明</h4>
                        <div class="format-info">
                            <div class="format-section">
                                <h5>📊 學生學習問卷抽獎 欄位格式</h5>
                                <ul>
                                    <li><strong>student_id:</strong> 學號</li>
                                    <li><strong>name:</strong> 姓名</li>
                                    <li><strong>department:</strong> 系所</li>
                                    <li><strong>grade:</strong> 年級</li>
                                </ul>
                                <div class="download-sample">
                                    <button class="btn btn-outline-primary btn-sm"
                                        @click="downloadSampleCSV('general')">
                                        📥 下載範例檔案
                                    </button>
                                </div>
                            </div>
                            <div class="format-section">
                                <h5>📋 期末評量抽獎 欄位格式</h5>
                                <ul>
                                    <li><strong>student_id:</strong> 學號</li>
                                    <li><strong>name:</strong> 姓名</li>
                                    <li><strong>department:</strong> 系所</li>
                                    <li><strong>grade:</strong> 年級</li>
                                    <li><strong>required_surveys:</strong> 應填問卷數</li>
                                    <li><strong>completed_surveys:</strong> 已填問卷數</li>
                                    <li><strong>surveys_completed:</strong> 是否填畢 (Y/N)</li>
                                    <li><strong>valid_surveys:</strong> 有效問卷 (Y/N)</li>
                                </ul>
                                <div class="download-sample">
                                    <button class="btn btn-outline-primary btn-sm"
                                        @click="downloadSampleCSV('final_teaching')">
                                        📥 下載範例檔案
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="format-notes">
                            <p><strong>💡 上傳提示：</strong></p>
                            <ul>
                                <li>支援 Excel (.xlsx, .xls) 和 CSV (.csv) 格式</li>
                                <li>請確保第一行為欄位標題</li>
                                <li>欄位名稱請使用英文，如上方格式所示</li>
                                <li>布林值欄位請使用 Y/N 或 true/false</li>
                            </ul>
                        </div>
                    </div>


                </div>

                <!-- Prizes Tab -->
                <div v-if="activeTab === 'prizes'">
                    <h3>獎項設定</h3>

                    <form @submit.prevent="savePrizes">
                        <div v-for="(prize, index) in prizes" :key="index" class="prize-item">
                            <div class="form-group">
                                <label :for="`prize-name-${index}`" class="form-label">獎品名稱</label>
                                <input type="text" :id="`prize-name-${index}`" v-model="prize.name" class="form-control"
                                    required />
                            </div>

                            <div class="form-group">
                                <label :for="`prize-quantity-${index}`" class="form-label">數量</label>
                                <input type="number" :id="`prize-quantity-${index}`" v-model.number="prize.quantity"
                                    class="form-control" min="1" required />
                            </div>

                            <button type="button" class="btn btn-danger" @click="removePrize(index)"
                                v-if="prizes.length > 1">
                                刪除
                            </button>
                        </div>

                        <div class="prize-actions">
                            <button type="button" class="btn" @click="addPrize">
                                新增獎項
                            </button>

                            <div class="save-actions">
                                <button type="button" class="btn btn-danger" @click="resetPrizes">
                                    清除
                                </button>
                                <button type="submit" class="btn btn-success" :disabled="lotteryStore.loading">
                                    儲存設定
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Draw Tab -->
                <div v-if="activeTab === 'draw'">
                    <h3>執行抽獎</h3>

                    <div v-if="lotteryStore.prizeSettings.length === 0" class="no-prizes-warning">
                        <p>尚未設定獎項，請先至獎項設定頁面進行設定</p>
                        <button class="btn" @click="activeTab = 'prizes'">前往獎項設定</button>
                    </div>

                    <div v-else>
                        <div class="draw-instructions">
                            <p>點擊「開始抽獎」按鈕，系統將根據已設定的獎項及數量隨機抽出中獎者。</p>
                            <p>已設定的獎項：</p>
                            <ul>
                                <li v-for="(prize, index) in lotteryStore.prizeSettings" :key="index">
                                    {{ prize.name }} - {{ prize.quantity }}名
                                </li>
                            </ul>
                        </div>

                        <button class="btn draw-btn"
                            :class="{ 'draw-btn-completed': isDrawCompleted, 'draw-btn-active': !isDrawCompleted }"
                            @click="runLottery" :disabled="lotteryStore.loading || isDrawCompleted">
                            <span v-if="isDrawCompleted" class="btn-icon">✅</span>
                            <span v-else class="btn-icon">🎲</span>
                            {{ isDrawCompleted ? '已完成抽獎' : '開始抽獎' }}
                        </button>

                        <div v-if="Object.keys(lotteryStore.winners).length > 0" class="winners-summary">
                            <h4>中獎結果</h4>

                            <div v-if="getFormattedWinners().length === 0" class="no-winners-message">
                                <p>抽獎已完成，但暫無中獎資料顯示。</p>
                            </div>

                            <div v-for="(prizeData, index) in getFormattedWinners()" :key="index" class="prize-winners">
                                <div class="prize-header">
                                    <div class="prize-title">
                                        <span class="prize-icon">🏆</span>
                                        <h5 class="prize-name">{{ prizeData.name }}</h5>
                                    </div>
                                    <div class="prize-stats">
                                        <span class="stats-label">預設名額:</span>
                                        <span class="stats-number">{{ prizeData.quantity }}</span>
                                        <span class="stats-separator">|</span>
                                        <span class="stats-label">實際中獎:</span>
                                        <span class="stats-number winner-count">{{ prizeData.winners.length }}</span>
                                    </div>
                                </div>

                                <div v-if="prizeData.winners.length > 0">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>序號</th>
                                                <th v-for="column in getDisplayColumns()" :key="column.key">
                                                    {{ column.label }}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(winner, winnerIndex) in prizeData.winners" :key="winnerIndex">
                                                <td>{{ winnerIndex + 1 }}</td>
                                                <td v-for="column in getDisplayColumns()"
                                                    :key="`${winnerIndex}-${column.key}`">
                                                    <span v-if="column.type === 'boolean'">
                                                        <span
                                                            v-if="getParticipantData(winner)[column.key] === true || getParticipantData(winner)[column.key] === 'Y'"
                                                            class="check-icon">✓</span>
                                                        <span v-else class="cross-icon">✗</span>
                                                    </span>
                                                    <span v-else>{{ getParticipantData(winner)[column.key] || '-'
                                                    }}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div v-else>
                                    <p class="no-winners-for-prize">此獎項無中獎者</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Winners Tab -->
                <div v-if="activeTab === 'winners'">
                    <div class="winners-header">
                        <h3>中獎名單</h3>
                        <div class="winners-actions">
                            <button class="btn" @click="exportWinnersList"
                                :disabled="lotteryStore.loading || Object.keys(lotteryStore.winners).length === 0">
                                匯出中獎名單
                            </button>
                            <button class="btn btn-email" @click="showEmailModal = true"
                                :disabled="lotteryStore.loading || Object.keys(lotteryStore.winners).length === 0">
                                📧 寄送得獎通知
                            </button>
                        </div>
                    </div>

                    <div v-if="Object.keys(lotteryStore.winners).length === 0">
                        <p>尚未執行抽獎或沒有中獎資料</p>
                    </div>

                    <div v-else>
                        <div v-for="(prizeData, index) in getFormattedWinners()" :key="index" class="prize-winners">
                            <div class="prize-header">
                                <div class="prize-title">
                                    <span class="prize-icon">🏆</span>
                                    <h5 class="prize-name">{{ prizeData.name }}</h5>
                                </div>
                                <div class="prize-stats">
                                    <span class="stats-label">預設名額:</span>
                                    <span class="stats-number">{{ prizeData.quantity }}</span>
                                    <span class="stats-separator">|</span>
                                    <span class="stats-label">實際中獎:</span>
                                    <span class="stats-number winner-count">{{ prizeData.winners.length }}</span>
                                </div>
                            </div>

                            <div v-if="prizeData.winners.length > 0">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>序號</th>
                                            <th v-for="column in getDisplayColumns()" :key="column.key">
                                                {{ column.label }}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(winner, winnerIndex) in prizeData.winners" :key="winnerIndex">
                                            <td>{{ winnerIndex + 1 }}</td>
                                            <td v-for="column in getDisplayColumns()"
                                                :key="`${winnerIndex}-${column.key}`">
                                                <span v-if="column.type === 'boolean'">
                                                    <span
                                                        v-if="getParticipantData(winner)[column.key] === true || getParticipantData(winner)[column.key] === 'Y'"
                                                        class="check-icon">✓</span>
                                                    <span v-else class="cross-icon">✗</span>
                                                </span>
                                                <span v-else>{{ getParticipantData(winner)[column.key] || '-' }}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-else>
                                <p>此獎項無中獎者</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Preview Modal -->
            <div v-if="showPreviewModal" class="modal-overlay" @click="handlePreviewModalOverlayClick">
                <div class="modal-content preview-modal" @click.stop>
                    <div class="modal-header">
                        <h4>📧 郵件預覽</h4>
                        <button class="close-btn" @click="showPreviewModal = false">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="preview-container">
                            <div class="preview-frame" v-html="previewContent"></div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" @click="showPreviewModal = false">
                            關閉預覽
                        </button>
                    </div>
                </div>
            </div>

            <!-- Test Email Modal -->
            <div v-if="showTestEmailModal" class="modal-overlay" @click="handleTestModalOverlayClick">
                <div class="modal-content test-email-modal" @click.stop>
                    <div class="modal-header">
                        <h4>🧪 測試郵件寄送</h4>
                        <button class="close-btn" @click="showTestEmailModal = false">×</button>
                    </div>
                    <div class="modal-body">
                        <p>輸入測試收件人的郵箱地址，系統將使用虛擬中獎者資料發送測試郵件：</p>

                        <div class="form-group">
                            <label class="form-label">測試收件人郵箱 (一行一個)</label>
                            <textarea v-model="testEmailList" class="form-control" rows="5"
                                placeholder="請輸入測試郵箱地址，一行一個：&#10;test1@example.com&#10;test2@example.com&#10;admin@company.com"></textarea>
                            <small class="form-text">請輸入有效的郵箱地址，一行一個</small>
                        </div>

                        <div class="test-email-info">
                            <h5>📋 測試資料說明</h5>
                            <p>系統將使用以下虛擬資料發送測試郵件：</p>
                            <ul>
                                <li><strong>得獎人姓名：</strong>測試用戶</li>
                                <li><strong>學號：</strong>TEST001</li>
                                <li><strong>系所：</strong>測試系所</li>
                                <li><strong>年級：</strong>測試年級</li>
                                <li><strong>獎項：</strong>測試獎品</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" @click="showTestEmailModal = false">
                            取消
                        </button>
                        <button type="button" class="btn btn-primary" @click="sendTestEmail"
                            :disabled="lotteryStore.loading || !testEmailList.trim()">
                            {{ lotteryStore.loading ? '寄送中...' : '發送測試郵件' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Email Modal - 全屏显示 -->
    <div v-if="showEmailModal" class="modal-overlay" @click="handleModalOverlayClick">
        <div class="modal-content email-modal" @click.stop>
            <div class="modal-header">
                <h4>寄送得獎通知</h4>
                <button class="close-btn" @click="showEmailModal = false">×</button>
            </div>

            <div class="modal-body">
                <form @submit.prevent="sendWinnersEmail">
                    <!-- Email Configuration (移到最上面，不折叠) -->
                    <div class="email-config-section">
                        <h5>📧 郵件設定</h5>

                        <div class="form-group">
                            <label class="form-label">發送郵件帳號</label>
                            <input type="email" v-model="emailConfig.email" class="form-control" placeholder="請輸入您的郵件帳號"
                                required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">郵件密碼</label>
                            <input type="password" v-model="emailConfig.password" class="form-control"
                                placeholder="請輸入郵件密碼" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">寄件人名稱</label>
                            <input type="text" v-model="emailConfig.sender_name" class="form-control"
                                placeholder="請輸入寄件人名稱" required>
                        </div>
                        <div class="server-info">
                            <small class="text-muted">
                                <i class="info-icon">ℹ️</i>
                                系統將使用校內郵件伺服器 (dragon.nchu.edu.tw) 進行發送
                            </small>
                        </div>
                    </div>

                    <!-- Email Content -->
                    <div class="email-content-section">
                        <h5>✉️ 郵件內容</h5>

                        <!-- Email Subject -->
                        <div class="form-group">
                            <label class="form-label">主旨</label>
                            <input type="text" v-model="emailContent.subject" class="form-control" placeholder="恭喜您中獎了！"
                                required>
                        </div>

                        <!-- Email Editor Mode Toggle -->
                        <div class="editor-mode-toggle">
                            <div class="toggle-buttons">
                                <button type="button" class="toggle-btn"
                                    :class="{ active: emailEditorMode === 'visual' }"
                                    @click="emailEditorMode = 'visual'">
                                    📝 視覺編輯器
                                </button>
                                <button type="button" class="toggle-btn" :class="{ active: emailEditorMode === 'html' }"
                                    @click="emailEditorMode = 'html'">
                                    💻 HTML 編輯器
                                </button>
                            </div>
                            <button type="button" class="btn btn-sm btn-secondary" @click="previewEmail">
                                👁️ 預覽
                            </button>
                        </div>

                        <!-- Visual Editor Mode -->
                        <div v-if="emailEditorMode === 'visual'" class="visual-editor">
                            <!-- Template Variables -->
                            <div class="template-variables">
                                <div class="variables-header">
                                    <span class="variables-title">🏷️ 可用變數</span>
                                    <small class="variables-hint">
                                        點擊變數即可插入到
                                        <span class="current-field-indicator">{{ getCurrentFieldLabel()
                                            }}</span>
                                    </small>
                                </div>
                                <div class="variables-grid">
                                    <div v-for="variable in templateVariables" :key="variable.key" class="variable-card"
                                        @click="insertVariableToVisual(variable.key)" :title="variable.description">
                                        <div class="variable-icon">{{ variable.icon }}</div>
                                        <div class="variable-label">{{ variable.label }}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Visual Content Editor -->
                            <div class="visual-content-editor">
                                <div class="form-group">
                                    <label class="form-label">開頭問候語</label>
                                    <textarea v-model="visualContent.greeting" class="form-control visual-textarea"
                                        placeholder="親愛的 {{winner_name}}，" rows="2"
                                        @focus="currentFocusedField = 'greeting'"
                                        @blur="currentFocusedField = 'greeting'"></textarea>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">中獎通知內容</label>
                                    <textarea v-model="visualContent.announcement" class="form-control visual-textarea"
                                        placeholder="恭喜您在「{{event_name}}」抽獎活動中獲得獎項！" rows="3"
                                        @focus="currentFocusedField = 'announcement'"
                                        @blur="currentFocusedField = 'announcement'"></textarea>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">獎項說明</label>
                                    <textarea v-model="visualContent.prizeDescription"
                                        class="form-control visual-textarea" placeholder="您獲得的獎項是：{{prize_name}}"
                                        rows="2" @focus="currentFocusedField = 'prizeDescription'"
                                        @blur="currentFocusedField = 'prizeDescription'"></textarea>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">領獎說明</label>
                                    <textarea v-model="visualContent.instructions" class="form-control visual-textarea"
                                        placeholder="請依照相關規定領取您的獎品。" rows="3"
                                        @focus="currentFocusedField = 'instructions'"
                                        @blur="currentFocusedField = 'instructions'"></textarea>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">結尾祝福語</label>
                                    <textarea v-model="visualContent.closing" class="form-control visual-textarea"
                                        placeholder="祝您身體健康，學業進步！" rows="2" @focus="currentFocusedField = 'closing'"
                                        @blur="currentFocusedField = 'closing'"></textarea>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">署名</label>
                                    <input type="text" v-model="visualContent.signature" class="form-control"
                                        placeholder="{{sender_name}}" @focus="currentFocusedField = 'signature'"
                                        @blur="currentFocusedField = 'signature'">
                                </div>
                            </div>
                        </div>

                        <!-- HTML Editor Mode -->
                        <div v-if="emailEditorMode === 'html'" class="html-editor">
                            <!-- Template Variables for HTML -->
                            <div class="template-variables">
                                <div class="variables-header">
                                    <span class="variables-title">🏷️ 可用變數</span>
                                    <small class="variables-hint">點擊變數即可插入到HTML模板中</small>
                                </div>
                                <div class="variables-grid">
                                    <div v-for="variable in templateVariables" :key="variable.key" class="variable-card"
                                        @click="insertVariableToHtml(variable.key)" :title="variable.description">
                                        <div class="variable-icon">{{ variable.icon }}</div>
                                        <div class="variable-label">{{ variable.label }}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">HTML 郵件模板</label>
                                <textarea v-model="emailContent.html_template"
                                    class="form-control html-template-textarea" placeholder="請輸入HTML郵件模板..." rows="15"
                                    required></textarea>
                            </div>
                        </div>

                        <!-- Plain Text Fallback -->
                        <div class="form-group">
                            <label class="form-label">純文字內容 (自動生成)</label>
                            <textarea v-model="emailContent.body" class="form-control email-textarea"
                                placeholder="純文字版本將根據上方內容自動生成" rows="4" readonly></textarea>
                            <small class="text-muted">當收件人不支援HTML郵件時使用，會自動根據上方內容生成</small>
                        </div>
                    </div>



                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" @click="showEmailModal = false">
                            取消
                        </button>
                        <button type="button" class="btn btn-warning" @click="showTestEmailModal = true">
                            測試寄送
                        </button>
                        <button type="submit" class="btn btn-primary" :disabled="lotteryStore.loading">
                            {{ lotteryStore.loading ? '寄送中...' : '寄送郵件' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Preview Modal - 全屏显示 -->
    <div v-if="showPreviewModal" class="modal-overlay" @click="handlePreviewModalOverlayClick">
        <div class="modal-content preview-modal" @click.stop>
            <div class="modal-header">
                <h4>📧 郵件預覽</h4>
                <button class="close-btn" @click="showPreviewModal = false">×</button>
            </div>
            <div class="modal-body">
                <div class="preview-container">
                    <div class="preview-frame" v-html="previewContent"></div>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" @click="showPreviewModal = false">
                    關閉預覽
                </button>
            </div>
        </div>
    </div>

    <!-- Test Email Modal - 全屏显示 -->
    <div v-if="showTestEmailModal" class="modal-overlay" @click="handleTestModalOverlayClick">
        <div class="modal-content test-email-modal" @click.stop>
            <div class="modal-header">
                <h4>🧪 測試郵件寄送</h4>
                <button class="close-btn" @click="showTestEmailModal = false">×</button>
            </div>
            <div class="modal-body">
                <p>輸入測試收件人的郵箱地址，系統將使用虛擬中獎者資料發送測試郵件：</p>

                <div class="form-group">
                    <label class="form-label">測試收件人郵箱 (一行一個)</label>
                    <textarea v-model="testEmailList" class="form-control" rows="5"
                        placeholder="請輸入測試郵箱地址，一行一個：&#10;test1@example.com&#10;test2@example.com&#10;admin@company.com"></textarea>
                    <small class="form-text">請輸入有效的郵箱地址，一行一個</small>
                </div>

                <div class="test-email-info">
                    <h5>📋 測試資料說明</h5>
                    <p>系統將使用以下虛擬資料發送測試郵件：</p>
                    <ul>
                        <li><strong>得獎人姓名：</strong>測試用戶</li>
                        <li><strong>學號：</strong>TEST001</li>
                        <li><strong>系所：</strong>測試系所</li>
                        <li><strong>年級：</strong>測試年級</li>
                        <li><strong>獎項：</strong>測試獎品</li>
                    </ul>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" @click="showTestEmailModal = false">
                    取消
                </button>
                <button type="button" class="btn btn-primary" @click="sendTestEmail"
                    :disabled="lotteryStore.loading || !testEmailList.trim()">
                    {{ lotteryStore.loading ? '寄送中...' : '發送測試郵件' }}
                </button>
            </div>
        </div>
    </div>

    <!-- Lottery Animation Modal -->
    <div v-if="showLotteryModal" class="modal-overlay lottery-modal-overlay">
        <div class="lottery-modal-content" @click.stop>
            <!-- Preparing Stage -->
            <div v-if="lotteryAnimationStage === 'preparing'" class="lottery-stage preparing-stage">
                <div class="lottery-icon">🎲</div>
                <h2>準備抽獎中...</h2>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>

            <!-- Drawing Stage -->
            <div v-if="lotteryAnimationStage === 'drawing'" class="lottery-stage drawing-stage">
                <div class="lottery-header">
                    <div class="lottery-icon spinning">🎯</div>
                    <h2>正在抽取獎項</h2>
                    <h3 class="current-prize">{{ currentPrize }}</h3>
                </div>

                <div class="numbers-container">
                    <div class="numbers-display">
                        <div v-for="(number, index) in animatedNumbers" :key="index" class="animated-number">
                            {{ number }}
                        </div>
                    </div>
                </div>

                <div class="drawing-effect">
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                </div>
            </div>

            <!-- Completed Stage -->
            <div v-if="lotteryAnimationStage === 'completed'" class="lottery-stage completed-stage">
                <div class="lottery-icon celebration">🎉</div>
                <h2>抽獎完成！</h2>
                <div class="results-summary">
                    <div v-for="(result, index) in lotteryResults" :key="index" class="result-item">
                        <span class="prize-name">{{ result.name }}</span>
                        <span class="winner-count">{{ result.winners.length }} 位中獎</span>
                    </div>
                </div>
                <p class="auto-close-hint">3秒後自動關閉...</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useLotteryStore } from '../stores/lottery';

const lotteryStore = useLotteryStore();
const selectedEventId = ref(null);
const activeTab = ref('participants');
const prizes = ref([{ name: '', quantity: 1 }]);
const isDrawCompleted = ref(false);
const showCreateEventModal = ref(false);
const showEditEventModal = ref(false);
const newEvent = ref({
    name: '',
    academic_year_term: '',
    description: '',
    event_date: '',
    type: 'general'
});
const editEvent = ref({
    id: null,
    name: '',
    academic_year_term: '',
    description: '',
    event_date: '',
    type: 'general'
});
const fileInput = ref(null);
const descriptionTextarea = ref(null);

// Email related variables
const showEmailModal = ref(false);
const showPreviewModal = ref(false);
const showTestEmailModal = ref(false);
const emailConfig = ref({
    email: '',
    password: '',
    sender_name: '抽獎系統',
    smtp_server: 'dragon.nchu.edu.tw',
    smtp_port: 465,
    use_tls: false
});

const emailContent = ref({
    subject: '恭喜您中獎了！',
    body: '親愛的 [得獎人姓名]，\n\n恭喜您在 [活動名稱] 中獲得 [獎項名稱]！\n\n請於指定時間前往領獎。\n\n此致\n敬禮',
    html_template: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>中獎通知</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .prize-info { background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .winner-info { background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        .highlight { color: #d63384; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 恭喜中獎！🎉</h1>
        </div>
        <div class="content">
            <p>親愛的 <strong>{{winner_name}}</strong>，</p>
            <p>恭喜您在「<span class="highlight">{{event_name}}</span>」抽獎活動中獲得獎項！</p>
            <div class="prize-info">
                <h3>🏆 獲得獎項</h3>
                <p><strong>{{prize_name}}</strong></p>
            </div>
            <div class="winner-info">
                <h3>👤 中獎者資訊</h3>
                <ul>
                    <li><strong>姓名：</strong>{{winner_name}}</li>
                    <li><strong>學號：</strong>{{student_id}}</li>
                    <li><strong>系所：</strong>{{department}}</li>
                    <li><strong>年級：</strong>{{grade}}</li>
                </ul>
            </div>
            <div class="prize-info">
                <h3>📅 活動資訊</h3>
                <ul>
                    <li><strong>活動名稱：</strong>{{event_name}}</li>
                    <li><strong>活動日期：</strong>{{event_date}}</li>
                </ul>
            </div>
            <p>請依照相關規定領取您的獎品。</p>
            <p>祝您<br />身體健康，學業進步！</p>
        </div>
        <div class="footer">
            <p>{{sender_name}}</p>
        </div>
    </div>
</body>
</html>`
});
const templateVariables = ref([
    { key: 'winner_name', label: '得獎人姓名', icon: '👤', description: '插入得獎人的姓名' },
    { key: 'event_name', label: '活動名稱', icon: '🎯', description: '插入抽獎活動的名稱' },
    { key: 'prize_name', label: '獎項名稱', icon: '🏆', description: '插入得獎人獲得的獎項' },
    { key: 'student_id', label: '得獎人學號', icon: '🎓', description: '插入得獎人的學號' },
    { key: 'department', label: '得獎人系所', icon: '🏢', description: '插入得獎人的系所' },
    { key: 'grade', label: '得獎人年級', icon: '📚', description: '插入得獎人的年級' },
    { key: 'event_date', label: '活動日期', icon: '📅', description: '插入活動的日期' },
    { key: 'sender_name', label: '寄件人名稱', icon: '✉️', description: '插入寄件人的名稱' }
]);

// Preview related variables
const previewContent = ref('');

// Test email related variables
const testEmailList = ref('');

// Filter related variables
const selectedYear = ref('');
const availableYears = ref([]);
const filteredEvents = ref([]);

// Lottery animation modal variables
const showLotteryModal = ref(false);
const lotteryAnimationStage = ref('preparing'); // preparing, drawing, completed
const animatedNumbers = ref([]);
const currentPrize = ref('');
const lotteryResults = ref([]);

// Email editor mode
const emailEditorMode = ref('visual'); // 'visual' or 'html'

// Email config collapsed state
const emailConfigCollapsed = ref(true); // 默认折叠邮件设定

// Visual content structure
const visualContent = ref({
    greeting: '親愛的 {{winner_name}}，',
    announcement: '恭喜您在「{{event_name}}」抽獎活動中獲得獎項！',
    prizeDescription: '您獲得的獎項是：{{prize_name}}',
    instructions: '請依照相關規定領取您的獎品。',
    closing: '祝您身體健康，學業進步！',
    signature: '{{sender_name}}'
});

// Modal body scroll prevention
const preventBodyScroll = () => {
    document.body.classList.add('modal-open');
};

const restoreBodyScroll = () => {
    document.body.classList.remove('modal-open');
};

// Prevent modal state conflicts with debouncing
let modalCloseTimeout = null;

// Handle modal overlay click to prevent event conflicts
const handleModalOverlayClick = (event) => {
    // Only close if clicking directly on the overlay (not on child elements)
    if (event.target === event.currentTarget) {
        if (modalCloseTimeout) clearTimeout(modalCloseTimeout);
        modalCloseTimeout = setTimeout(() => {
            showEmailModal.value = false;
        }, 50);
    }
};

const handlePreviewModalOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
        if (modalCloseTimeout) clearTimeout(modalCloseTimeout);
        modalCloseTimeout = setTimeout(() => {
            showPreviewModal.value = false;
        }, 50);
    }
};

const handleTestModalOverlayClick = (event) => {
    // Only close if clicking directly on the overlay background
    if (event.target === event.currentTarget) {
        showTestEmailModal.value = false;
    }
};

// Reset to type selection when component mounts or route changes
const resetToTypeSelection = () => {
    lotteryStore.selectType(null);
    selectedEventId.value = null;
    activeTab.value = 'participants';
};

// Load lottery events on mount - reset to type selection
onMounted(() => {
    // Only reset if we don't have a selected type
    if (!lotteryStore.selectedType) {
        resetToTypeSelection();
    }
});

// Cleanup on unmount - restore body scroll
onUnmounted(() => {
    restoreBodyScroll();
});

// Watch for modal state changes to handle body scroll and load template variables
watch(showCreateEventModal, (isOpen) => {
    if (isOpen) {
        preventBodyScroll();
    } else {
        restoreBodyScroll();
    }
});

watch(showEditEventModal, (isOpen) => {
    if (isOpen) {
        preventBodyScroll();
    } else {
        restoreBodyScroll();
    }
});

watch(showEmailModal, async (isOpen) => {
    if (isOpen) {
        preventBodyScroll();
        await loadEmailTemplateVariables();
    } else {
        restoreBodyScroll();
    }
});

watch(showPreviewModal, (isOpen) => {
    if (isOpen) {
        preventBodyScroll();
    } else {
        restoreBodyScroll();
    }
});

watch(showTestEmailModal, (isOpen) => {
    if (isOpen) {
        preventBodyScroll();
    } else {
        restoreBodyScroll();
    }
});

// Watch for selected type change
watch(() => lotteryStore.selectedType, async (newType) => {
    if (newType) {
        await lotteryStore.fetchLotteryEvents(newType);
    } else {
        // If type is null, reset everything
        selectedEventId.value = null;
        activeTab.value = 'participants';
        selectedYear.value = '';
        filteredEvents.value = [];
        availableYears.value = [];
    }
});

// Watch for lottery events change
watch(() => lotteryStore.lotteryEvents, () => {
    initializeFilteredEvents();
}, { deep: true });

// Watch for selected event change
watch(selectedEventId, async (newValue) => {
    if (newValue) {
        await Promise.all([
            lotteryStore.selectEvent(newValue),
            lotteryStore.fetchParticipants(newValue),
            lotteryStore.fetchPrizeSettings(newValue),
            lotteryStore.fetchWinners(newValue)
        ]);

        // Update local prize settings based on fetched data
        if (lotteryStore.prizeSettings.length > 0) {
            prizes.value = [...lotteryStore.prizeSettings];
        } else {
            prizes.value = [{ name: '', quantity: 1 }];
        }

        // Check if draw is already completed
        isDrawCompleted.value = Object.keys(lotteryStore.winners).length > 0;
    }
});

// Translate column names to Chinese
const translateColumnName = (key) => {
    const translations = {
        id: '編號',
        department: '系所',
        studentId: '學號',
        name: '姓名',
        grade: '年級',
        requiredCount: '應填筆數',
        filledCount: '已填筆數',
        isCompleted: '是否填畢',
        isForeign: '外籍生',
        validSurveys: '有效問卷',
        // Add more translations as needed
    };

    return translations[key] || key;
};

// Select a type
const selectType = async (typeId) => {
    lotteryStore.selectType(typeId);
};

// Select an event
const selectEvent = async (eventId) => {
    selectedEventId.value = eventId;
    activeTab.value = 'participants';
};

// Get selected type name
const getSelectedTypeName = () => {
    const type = lotteryStore.lotteryTypes.find(t => t.id === lotteryStore.selectedType);
    return type ? type.name : '未選擇類型';
};

// Go back to type selection
const goBackToTypes = () => {
    resetToTypeSelection();
};

// Go back to event selection
const goBackToEvents = () => {
    selectedEventId.value = null;
    activeTab.value = 'participants';
};

// Get current event name
const getCurrentEventName = () => {
    const event = lotteryStore.lotteryEvents.find(e => e.id === selectedEventId.value);
    return event ? event.name : '未選擇活動';
};

// Add a new prize
const addPrize = () => {
    prizes.value.push({ name: '', quantity: 1 });
};

// Remove a prize
const removePrize = (index) => {
    prizes.value.splice(index, 1);
};

// Reset prizes
const resetPrizes = () => {
    prizes.value = [{ name: '', quantity: 1 }];
};

// Save prize settings
const savePrizes = async () => {
    await lotteryStore.savePrizeSettings(selectedEventId.value, prizes.value);
};

// Run lottery with animation
const runLottery = async () => {
    showLotteryModal.value = true;
    lotteryAnimationStage.value = 'preparing';
    lotteryResults.value = [];

    // Start animation sequence
    await startLotteryAnimation();

    // Perform actual lottery
    await lotteryStore.runLottery(selectedEventId.value);

    // Show results
    lotteryAnimationStage.value = 'completed';
    lotteryResults.value = getFormattedWinners();
    isDrawCompleted.value = true;

    // Auto close after showing results
    setTimeout(() => {
        showLotteryModal.value = false;
    }, 3000);
};

// Start lottery animation sequence
const startLotteryAnimation = async () => {
    // Preparing stage
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Drawing stage
    lotteryAnimationStage.value = 'drawing';

    // Animate through each prize
    for (let i = 0; i < lotteryStore.prizeSettings.length; i++) {
        const prize = lotteryStore.prizeSettings[i];
        currentPrize.value = prize.name;

        // Generate random numbers animation for this prize
        await animateNumbersForPrize(prize);

        // Pause between prizes
        if (i < lotteryStore.prizeSettings.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
};

// Animate numbers for a specific prize
const animateNumbersForPrize = async (prize) => {
    const participantIds = lotteryStore.participants.map(p => p.student_id || p.id);
    const animationDuration = 2000; // 2 seconds
    const frameRate = 50; // milliseconds per frame
    const totalFrames = animationDuration / frameRate;

    for (let frame = 0; frame < totalFrames; frame++) {
        // Generate random student IDs for animation
        animatedNumbers.value = [];
        for (let j = 0; j < Math.min(prize.quantity, 5); j++) {
            const randomId = participantIds[Math.floor(Math.random() * participantIds.length)];
            animatedNumbers.value.push(randomId);
        }

        await new Promise(resolve => setTimeout(resolve, frameRate));
    }
};

// Export winners list
const exportWinnersList = async () => {
    await lotteryStore.exportWinners(selectedEventId.value);
};

// Get prize quantity for a given prize name
const getPrizeQuantity = (prizeName) => {
    const prize = lotteryStore.prizeSettings.find(p => p.name === prizeName);
    return prize ? prize.quantity : 0;
};

// Get display columns based on event type
const getDisplayColumns = () => {
    if (!lotteryStore.selectedType) return [];

    if (lotteryStore.selectedType === 'general') {
        return [
            { key: 'student_id', label: '學號', type: 'text' },
            { key: 'name', label: '姓名', type: 'text' },
            { key: 'department', label: '系所', type: 'text' },
            { key: 'grade', label: '年級', type: 'text' }
        ];
    } else if (lotteryStore.selectedType === 'final_teaching') {
        return [
            { key: 'student_id', label: '學號', type: 'text' },
            { key: 'name', label: '姓名', type: 'text' },
            { key: 'department', label: '系所', type: 'text' },
            { key: 'grade', label: '年級', type: 'text' },
            { key: 'required_surveys', label: '應填問卷數', type: 'text' },
            { key: 'completed_surveys', label: '已填問卷數', type: 'text' },
            { key: 'surveys_completed', label: '是否填畢', type: 'boolean' },
            { key: 'valid_surveys', label: '有效問卷', type: 'boolean' }
        ];
    }

    return [];
};

// Get formatted winners
const getFormattedWinners = () => {
    if (!lotteryStore.winners || Object.keys(lotteryStore.winners).length === 0) {
        return [];
    }

    const winnersData = lotteryStore.winners;
    console.log('Raw winners data:', winnersData);

    // Handle new API response format: { "result": [{ "prize_name": "...", "quantity": ..., "winners": [...] }] }
    if (winnersData.result && Array.isArray(winnersData.result)) {
        const result = winnersData.result.map(prizeData => ({
            name: prizeData.prize_name || prizeData.name || '未知獎項',
            quantity: prizeData.quantity || 0,
            winners: prizeData.winners || []
        }));
        console.log('Formatted winners (new API format):', result);
        return result;
    }

    // Check if the data structure is the expected format (prize name as key with array of winners)
    const firstKey = Object.keys(winnersData)[0];
    if (Array.isArray(winnersData[firstKey])) {
        // Standard format: { "prizeName": [winners...] }
        const result = Object.entries(winnersData).map(([prizeName, winners]) => ({
            name: prizeName,
            quantity: getPrizeQuantity(prizeName),
            winners: winners || []
        }));
        console.log('Formatted winners (standard format):', result);
        return result;
    }

    // Handle different possible API response formats

    // Format 1: Direct array of prize objects
    if (Array.isArray(winnersData)) {
        return winnersData.map(prizeData => ({
            name: prizeData.name || prizeData.prize_name || '未知獎項',
            quantity: prizeData.quantity || 0,
            winners: prizeData.winners || []
        }));
    }

    // Format 2: Object with prize data
    if (winnersData.prizes && Array.isArray(winnersData.prizes)) {
        return winnersData.prizes.map(prizeData => ({
            name: prizeData.name || prizeData.prize_name || '未知獎項',
            quantity: prizeData.quantity || 0,
            winners: prizeData.winners || []
        }));
    }

    // Format 3: Flattened format with numbered keys
    const formattedWinners = [];
    let prizeIndex = 0;
    while (winnersData[`prize_name${prizeIndex}`] !== undefined || winnersData[`name${prizeIndex}`] !== undefined) {
        const prizeName = winnersData[`prize_name${prizeIndex}`] || winnersData[`name${prizeIndex}`] || `獎項${prizeIndex + 1}`;
        const quantity = winnersData[`quantity${prizeIndex}`] || 0;
        const winners = winnersData[`winners${prizeIndex}`] || [];

        formattedWinners.push({
            name: prizeName,
            quantity: quantity,
            winners: Array.isArray(winners) ? winners : []
        });

        prizeIndex++;
    }

    // Format 4: Single prize format
    if (formattedWinners.length === 0 && (winnersData.prize_name || winnersData.name)) {
        formattedWinners.push({
            name: winnersData.prize_name || winnersData.name,
            quantity: winnersData.quantity || 0,
            winners: Array.isArray(winnersData.winners) ? winnersData.winners : []
        });
    }

    // Format 5: If all else fails, try to extract from prize settings
    if (formattedWinners.length === 0 && lotteryStore.prizeSettings.length > 0) {
        return lotteryStore.prizeSettings.map(prize => ({
            name: prize.name,
            quantity: prize.quantity,
            winners: winnersData[prize.name] || []
        }));
    }

    return formattedWinners;
};

// Get participant data for a given winner
const getParticipantData = (winner) => {
    console.log('Getting participant data for winner:', winner);

    // New API format: winner object already contains all participant data
    if (winner.student_id && winner.name && winner.department) {
        console.log('Using winner data directly (new API format)');
        return winner;
    }

    // Fallback: try to find participant from participants list
    const participant = lotteryStore.participants.find(p => p.id === winner.participant_id);
    console.log('Found participant from participants list:', participant);
    return participant || {};
};

// Create a new event
const createEvent = async () => {
    try {
        // Set the event type to match the selected lottery type
        newEvent.value.type = lotteryStore.selectedType;

        await lotteryStore.createLotteryEvent(newEvent.value);
        showCreateEventModal.value = false;
        // Reset with the correct type based on selected lottery type
        const eventType = lotteryStore.selectedType || 'general';
        newEvent.value = {
            name: '',
            academic_year_term: '',
            description: '',
            event_date: '',
            type: eventType
        };

        // Refresh the events list
        await lotteryStore.fetchLotteryEvents(lotteryStore.selectedType);
    } catch (error) {
        console.error('Failed to create event:', error);
    }
};

// Update an existing event
const updateEvent = async () => {
    try {
        await lotteryStore.updateLotteryEvent(editEvent.value.id, {
            name: editEvent.value.name,
            academic_year_term: editEvent.value.academic_year_term,
            description: editEvent.value.description,
            event_date: editEvent.value.event_date,
            type: editEvent.value.type
        });

        showEditEventModal.value = false;
        alert('活動已成功更新！');

        // Refresh the events list
        await lotteryStore.fetchLotteryEvents(lotteryStore.selectedType);
    } catch (error) {
        console.error('Failed to update event:', error);
        alert('更新活動失敗：' + (lotteryStore.error || error.message));
    }
};

// Handle description input
const handleDescriptionInput = (event) => {
    console.log('Description input event:', event.target.value);
    newEvent.value.description = event.target.value;
};

// Handle description focus
const handleDescriptionFocus = () => {
    console.log('Description textarea focused');
    if (descriptionTextarea.value) {
        descriptionTextarea.value.focus();
    }
};

// Open create event modal with correct type
const openCreateEventModal = () => {
    // Set the activity type based on the selected lottery type
    const eventType = lotteryStore.selectedType || 'general';

    newEvent.value = {
        name: '',
        academic_year_term: '',
        description: '',
        event_date: '',
        type: eventType
    };

    showCreateEventModal.value = true;
};

// Handle background click for create modal
const handleCreateModalBackgroundClick = (event) => {
    // Only close if clicking directly on the overlay background
    if (event.target === event.currentTarget) {
        closeCreateEventModal();
    }
};

// Close the create event modal
const closeCreateEventModal = () => {
    showCreateEventModal.value = false;
    // Reset with the correct type based on selected lottery type
    const eventType = lotteryStore.selectedType || 'general';
    newEvent.value = {
        name: '',
        academic_year_term: '',
        description: '',
        event_date: '',
        type: eventType
    };
};

// Open edit event modal
const openEditEventModal = (event) => {
    // Format the date for datetime-local input
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Convert to local timezone and format as YYYY-MM-DDTHH:MM
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    editEvent.value = {
        id: event.id,
        name: event.name,
        academic_year_term: event.academic_year_term,
        description: event.description,
        event_date: formatDateForInput(event.event_date),
        type: event.type
    };
    showEditEventModal.value = true;
};

// Handle background click for edit modal
const handleEditModalBackgroundClick = (event) => {
    // Only close if clicking directly on the overlay background
    if (event.target === event.currentTarget) {
        closeEditEventModal();
    }
};

// Close the edit event modal
const closeEditEventModal = () => {
    showEditEventModal.value = false;
    editEvent.value = {
        id: null,
        name: '',
        academic_year_term: '',
        description: '',
        event_date: '',
        type: 'general'
    };
};

// Handle file upload
const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Parse the file (Excel or CSV)
        const studentsData = await lotteryStore.parseStudentFile(file, lotteryStore.selectedType);

        if (studentsData.length === 0) {
            alert('檔案中沒有找到有效的學生資料');
            return;
        }

        // Import the participants
        const result = await lotteryStore.importParticipants(selectedEventId.value, studentsData);

        // Clear the file input
        event.target.value = '';

        const fileType = file.name.split('.').pop().toUpperCase();

        // Show detailed results based on new API response format
        let message = `✅ ${fileType} 檔案上傳完成！\n\n`;
        message += `📊 處理結果：\n`;
        message += `• 檔案中總共 ${studentsData.length} 筆資料\n`;

        if (result && typeof result === 'object') {
            // New API response format
            if (result.total_uploaded !== undefined) {
                message += `• 上傳處理 ${result.total_uploaded} 筆資料\n`;
            }
            if (result.total_imported !== undefined) {
                message += `• 成功匯入 ${result.total_imported} 位參與者\n`;
            }
            if (result.total_skipped !== undefined) {
                message += `• 跳過 ${result.total_skipped} 筆資料\n`;
            }
            if (result.inserted_count !== undefined && result.inserted_count > 0) {
                message += `• 新增 ${result.inserted_count} 位新參與者\n`;
            }
            if (result.updated_count !== undefined && result.updated_count > 0) {
                message += `• 更新 ${result.updated_count} 位現有參與者\n`;
            }
            if (result.total_eligible !== undefined && result.total_eligible > 0) {
                message += `• 符合資格 ${result.total_eligible} 位參與者\n`;
            }

            // Show skipped details if any
            if (result.skipped && result.skipped.length > 0) {
                message += `\n⚠️ 跳過的資料詳情：\n`;
                result.skipped.slice(0, 3).forEach((skipped, index) => {
                    message += `${index + 1}. ${skipped.student_id}: ${skipped.reason}\n`;
                });
                if (result.skipped.length > 3) {
                    message += `... 還有 ${result.skipped.length - 3} 筆跳過的資料\n`;
                }
            }

            // Show imported summary
            if (result.imported && result.imported.length > 0) {
                message += `\n✅ 成功匯入範例：\n`;
                result.imported.slice(0, 2).forEach((imported, index) => {
                    message += `${index + 1}. ${imported.student_id} - ${imported.student_name}\n`;
                });
                if (result.imported.length > 2) {
                    message += `... 還有 ${result.imported.length - 2} 位參與者\n`;
                }
            }
        } else {
            message += `• 成功匯入參與者資料`;
        }

        alert(message);
    } catch (error) {
        console.error('Failed to upload file:', error);
        console.error('File details:', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        let errorMessage = '檔案上傳失敗：\n\n';

        // Enhanced error handling
        if (error.response?.data?.detail) {
            // API validation errors
            if (Array.isArray(error.response.data.detail)) {
                errorMessage += '❌ 資料驗證錯誤：\n';
                error.response.data.detail.forEach((detail, index) => {
                    errorMessage += `${index + 1}. ${detail.loc?.join(' -> ')}: ${detail.msg}\n`;
                });
            } else {
                errorMessage += `❌ ${error.response.data.detail}`;
            }
        } else if (error.response?.data?.message) {
            errorMessage += `❌ ${error.response.data.message}`;
        } else {
            errorMessage += `❌ ${error.message}`;
        }

        // Add troubleshooting tips
        errorMessage += '\n\n💡 解決建議：';
        errorMessage += '\n• 請檢查檔案格式是否正確';
        errorMessage += '\n• 確認欄位名稱符合要求';
        errorMessage += '\n• 查看範例檔案格式';

        if (file.name.includes('期末評量') || file.type.includes('excel')) {
            errorMessage += '\n• Excel 檔案請確保沒有合併儲存格';
            errorMessage += '\n• 建議另存為 CSV 格式重試';
        }

        alert(errorMessage);
    }
};

// Confirm delete all participants
const confirmDeleteAllParticipants = () => {
    if (confirm('確定要刪除所有參與者嗎？此操作無法復原。')) {
        deleteAllParticipants();
    }
};

// Delete all participants
const deleteAllParticipants = async () => {
    try {
        await lotteryStore.deleteAllParticipants(selectedEventId.value);
        alert('已成功刪除所有參與者');
    } catch (error) {
        console.error('Failed to delete all participants:', error);
    }
};



// Email related methods
const loadEmailTemplateVariables = async () => {
    try {
        const variables = await lotteryStore.fetchEmailTemplateVariables();
        if (variables && variables.length > 0) {
            templateVariables.value = variables;
        }
    } catch (error) {
        console.error('Failed to load template variables:', error);
    }
};

// Insert template variable into email content (plain text)
const insertVariable = (variableKey) => {
    const variable = `{{${variableKey}}}`;
    const textarea = document.querySelector('.email-textarea');

    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = emailContent.value.body;

        emailContent.value.body = text.substring(0, start) + variable + text.substring(end);

        // Move cursor after inserted variable
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    } else {
        // If no textarea focus, append to end
        emailContent.value.body += variable;
    }
};

// Insert variable into HTML template
const insertVariableToHtml = (variableKey) => {
    const variable = `{{${variableKey}}}`;

    // Try to insert at cursor position if HTML textarea is focused
    const textarea = document.querySelector('.html-template-textarea:focus');
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = emailContent.value.html_template;
        emailContent.value.html_template = text.substring(0, start) + variable + text.substring(end);

        // Set cursor position after inserted variable
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + variable.length;
            textarea.focus();
        }, 0);
    } else {
        // If no textarea focus, append to end
        emailContent.value.html_template += variable;
    }
};

// Track the currently focused field
const currentFocusedField = ref('announcement');

// Get current field label for display
const getCurrentFieldLabel = () => {
    const fieldLabels = {
        greeting: '開頭問候語',
        announcement: '中獎通知內容',
        prizeDescription: '獎項說明',
        instructions: '領獎說明',
        closing: '結尾祝福語',
        signature: '署名'
    };
    return fieldLabels[currentFocusedField.value] || '中獎通知內容';
};

// Insert variable into visual editor
const insertVariableToVisual = (variableKey) => {
    const variable = `{{${variableKey}}}`;

    // Try to insert at cursor position if any visual textarea is focused
    const focusedTextarea = document.querySelector('.visual-textarea:focus');
    if (focusedTextarea) {
        const start = focusedTextarea.selectionStart;
        const end = focusedTextarea.selectionEnd;

        // Use the tracked focused field
        const fieldName = currentFocusedField.value;

        if (fieldName && visualContent.value[fieldName] !== undefined) {
            const text = visualContent.value[fieldName];
            visualContent.value[fieldName] = text.substring(0, start) + variable + text.substring(end);

            // Set cursor position after inserted variable
            setTimeout(() => {
                focusedTextarea.selectionStart = focusedTextarea.selectionEnd = start + variable.length;
                focusedTextarea.focus();
            }, 0);
        }
    } else {
        // If no textarea is focused, insert into the tracked field
        const fieldName = currentFocusedField.value;
        if (visualContent.value[fieldName] !== undefined) {
            visualContent.value[fieldName] += variable;
        }
    }
};

// Generate HTML template from visual content
const generateHtmlFromVisual = () => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>中獎通知</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .prize-info { background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .winner-info { background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        .highlight { color: #d63384; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 恭喜中獎！🎉</h1>
        </div>
        
        <div class="content">
            <p>${visualContent.value.greeting}</p>
            
            <p>${visualContent.value.announcement}</p>
            
            <div class="prize-info">
                <h3>🏆 獲得獎項</h3>
                <p>${visualContent.value.prizeDescription}</p>
            </div>
            
            <div class="winner-info">
                <h3>👤 中獎者資訊</h3>
                <ul>
                    <li><strong>姓名：</strong>{{winner_name}}</li>
                    <li><strong>學號：</strong>{{student_id}}</li>
                    <li><strong>系所：</strong>{{department}}</li>
                    <li><strong>年級：</strong>{{grade}}</li>
                </ul>
            </div>
            
            <div class="prize-info">
                <h3>📅 活動資訊</h3>
                <ul>
                    <li><strong>活動名稱：</strong>{{event_name}}</li>
                    <li><strong>活動日期：</strong>{{event_date}}</li>
                </ul>
            </div>
            
            <p>${visualContent.value.instructions}</p>
            
            <p>${visualContent.value.closing}</p>
        </div>
        
        <div class="footer">
            <p>${visualContent.value.signature}</p>
        </div>
    </div>
</body>
</html>`;
};

// Generate plain text from visual content
const generatePlainTextFromVisual = () => {
    return `${visualContent.value.greeting}

${visualContent.value.announcement}

${visualContent.value.prizeDescription}

中獎者資訊：
姓名：{{winner_name}}
學號：{{student_id}}
系所：{{department}}
年級：{{grade}}

活動資訊：
活動名稱：{{event_name}}
活動日期：{{event_date}}

${visualContent.value.instructions}

${visualContent.value.closing}

${visualContent.value.signature}`;
};

// Preview email with sample data
const previewEmail = () => {
    // Sample data for preview
    const sampleData = {
        winner_name: '王小明',
        event_name: '期末問卷抽獎活動',
        prize_name: '頭獎 - iPad Pro',
        student_id: 'S1234567',
        department: '資訊工程學系',
        grade: '大三',
        event_date: '2024年1月15日',
        sender_name: emailConfig.value.sender_name || '抽獎系統'
    };

    // Get HTML template based on current mode
    let htmlTemplate;
    if (emailEditorMode.value === 'visual') {
        htmlTemplate = generateHtmlFromVisual();
    } else {
        htmlTemplate = emailContent.value.html_template;
    }

    // Replace variables in HTML template
    let previewHtml = htmlTemplate;
    Object.keys(sampleData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        previewHtml = previewHtml.replace(regex, sampleData[key]);
    });

    previewContent.value = previewHtml;
    showPreviewModal.value = true;
};

// Send winners notification email
const sendWinnersEmail = async () => {
    if (!selectedEventId.value) {
        alert('請先選擇活動');
        return;
    }

    if (!emailConfig.value.email || !emailConfig.value.password) {
        alert('請填入郵件帳號和密碼');
        return;
    }

    if (!emailContent.value.subject) {
        alert('請填入郵件主旨');
        return;
    }

    try {
        // Get the appropriate HTML template based on current mode
        let htmlTemplate;
        let plainTextTemplate;

        if (emailEditorMode.value === 'visual') {
            htmlTemplate = generateHtmlFromVisual();
            plainTextTemplate = generatePlainTextFromVisual();
        } else {
            htmlTemplate = emailContent.value.html_template;
            plainTextTemplate = emailContent.value.body;
        }

        if (!htmlTemplate) {
            alert('請填入郵件內容');
            return;
        }

        const emailData = {
            email_config: {
                username: emailConfig.value.email,
                password: emailConfig.value.password,
                smtp_server: emailConfig.value.smtp_server,
                smtp_port: emailConfig.value.smtp_port,
                use_tls: emailConfig.value.use_tls
            },
            sender_name: emailConfig.value.sender_name,
            subject: emailContent.value.subject,
            email_template: plainTextTemplate, // Plain text fallback
            html_template: htmlTemplate // HTML template
        };

        const result = await lotteryStore.sendWinnersNotification(selectedEventId.value, emailData);

        if (result && result.success) {
            alert('得獎通知已成功寄送！');
            showEmailModal.value = false;
        } else {
            alert('寄送失敗，請檢查設定或稍後再試。');
        }
    } catch (error) {
        alert('寄送失敗：' + (lotteryStore.error || error.message));
    }
};

// Send test email
const sendTestEmail = async () => {
    if (!selectedEventId.value) {
        alert('請先選擇活動');
        return;
    }

    if (!emailConfig.value.email || !emailConfig.value.password) {
        alert('請填入郵件帳號和密碼');
        return;
    }

    if (!emailContent.value.subject) {
        alert('請填入郵件主旨');
        return;
    }

    if (!testEmailList.value.trim()) {
        alert('請填入測試收件人郵箱');
        return;
    }

    try {
        // Parse email list
        const emailList = testEmailList.value.trim().split('\n')
            .map(email => email.trim())
            .filter(email => email && email.includes('@'));

        if (emailList.length === 0) {
            alert('請輸入至少一個有效的郵箱地址');
            return;
        }

        // Get the appropriate HTML template based on current mode
        let htmlTemplate;
        let plainTextTemplate;

        if (emailEditorMode.value === 'visual') {
            htmlTemplate = generateHtmlFromVisual();
            plainTextTemplate = generatePlainTextFromVisual();
        } else {
            htmlTemplate = emailContent.value.html_template;
            plainTextTemplate = emailContent.value.body;
        }

        if (!htmlTemplate) {
            alert('請填入郵件內容');
            return;
        }

        const emailData = {
            email_config: {
                username: emailConfig.value.email,
                password: emailConfig.value.password,
                smtp_server: emailConfig.value.smtp_server,
                smtp_port: emailConfig.value.smtp_port,
                use_tls: emailConfig.value.use_tls
            },
            sender_name: emailConfig.value.sender_name,
            subject: emailContent.value.subject,
            email_template: plainTextTemplate,
            html_template: htmlTemplate,
            test_recipients: emailList
        };

        const result = await lotteryStore.testWinnersNotification(selectedEventId.value, emailData);

        if (result && result.success) {
            alert(`測試郵件已成功寄送到 ${emailList.length} 個收件人！`);
            showTestEmailModal.value = false;
        } else {
            alert('測試郵件寄送失敗，請檢查設定或稍後再試。');
        }
    } catch (error) {
        alert('測試郵件寄送失敗：' + (lotteryStore.error || error.message));
    }
};

// Download sample CSV
const downloadSampleCSV = (type) => {
    let csvContent = '';
    let filename = '';

    if (type === 'general') {
        csvContent = 'student_id,name,department,grade\n' +
            'S1234567,王小明,資訊工程學系,大三\n' +
            'S1234568,李小華,電機工程學系,大二\n' +
            'S1234569,張小美,企業管理學系,大四\n';
        filename = 'sample_students_general.csv';
    } else if (type === 'final_teaching') {
        csvContent = 'student_id,name,department,grade,required_surveys,completed_surveys,surveys_completed,valid_surveys\n' +
            'S1234567,王小明,資訊工程學系,大三,5,5,Y,Y\n' +
            'S1234568,李小華,電機工程學系,大二,5,4,N,N\n' +
            'S1234569,張小美,企業管理學系,大四,5,5,Y,Y\n';
        filename = 'sample_students_final_teaching.csv';
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Confirm delete event
const confirmDeleteEvent = async (event) => {
    if (confirm(`確定要刪除活動「${event.name}」嗎？此操作不可復原。`)) {
        const result = await lotteryStore.deleteEvent(event.id);
        if (result) {
            alert('活動已成功刪除');
            // Refresh the events list
            await lotteryStore.fetchLotteryEvents(lotteryStore.selectedType);
        } else {
            alert('刪除失敗：' + (lotteryStore.error || '未知錯誤'));
        }
    }
};

// Format date for display
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Get status class for styling
const getStatusClass = (status) => {
    const baseClass = 'event-status';
    switch (status) {
        case 'pending':
            return `${baseClass} status-pending`;
        case 'drawn':
            return `${baseClass} status-drawn`;
        case 'completed':
            return `${baseClass} status-completed`;
        default:
            return `${baseClass} status-default`;
    }
};

// Get status icon
const getStatusIcon = (status) => {
    switch (status) {
        case 'pending':
            return '⏳';
        case 'drawn':
            return '🎯';
        case 'completed':
            return '✅';
        default:
            return '📋';
    }
};

// Get status text
const getStatusText = (status) => {
    switch (status) {
        case 'pending':
            return '待抽獎';
        case 'drawn':
            return '已抽獎';
        case 'completed':
            return '已完成';
        default:
            return status;
    }
};

// Update available years from events
const updateAvailableYears = () => {
    const years = [...new Set(lotteryStore.lotteryEvents.map(event =>
        event.academic_year_term.split('-')[0] // 取學年部分，例如 "112-1" -> "112"
    ))].sort((a, b) => b - a); // 倒序排列，最新的在前
    availableYears.value = years;
};

// Filter events by selected year
const filterEventsByYear = () => {
    if (!selectedYear.value) {
        filteredEvents.value = [...lotteryStore.lotteryEvents];
    } else {
        filteredEvents.value = lotteryStore.lotteryEvents.filter(event =>
            event.academic_year_term.startsWith(selectedYear.value)
        );
    }
};

// Initialize filtered events
const initializeFilteredEvents = () => {
    filteredEvents.value = [...lotteryStore.lotteryEvents];
    updateAvailableYears();
};



// Watch for visual content changes to auto-generate HTML and plain text
watch(visualContent, () => {
    if (emailEditorMode.value === 'visual') {
        emailContent.value.html_template = generateHtmlFromVisual();
        emailContent.value.body = generatePlainTextFromVisual();
    }
}, { deep: true });

// Watch for editor mode changes
watch(emailEditorMode, (newMode) => {
    if (newMode === 'visual') {
        // When switching to visual mode, generate HTML from visual content
        emailContent.value.html_template = generateHtmlFromVisual();
        emailContent.value.body = generatePlainTextFromVisual();
    }
});


</script>

<style scoped>
.lottery-view {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

.lottery-view h2 {
    margin-bottom: 2rem;
    color: #2c3e50;
    font-size: 2rem;
    font-weight: 800;
    text-align: center;
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-indicator {
    text-align: center;
    padding: 2rem;
}

.lottery-types {
    margin-bottom: 2rem;
}

.type-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
}

.type-item {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s;
    text-align: center;
}

.type-item:hover {
    background-color: #f8f9fa;
    border-color: #3498db;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
}

.type-item h4 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.type-item p {
    color: #7f8c8d;
    font-size: 0.9rem;
}

.lottery-events {
    margin-bottom: 2rem;
}

.card {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border: 1px solid #e9ecef;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 2rem;
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1.2rem 1.5rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border-left: 5px solid #28a745;
}

.section-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 0.3px;
}

.header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

@media (max-width: 768px) {
    .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .header-actions {
        justify-content: center;
    }
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background-color: #5a6268;
}

.btn-primary {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    font-size: 0.9rem;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    text-transform: none;
    letter-spacing: 0.3px;
}

.btn-primary:hover {
    background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
}

.btn-danger {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    font-size: 0.9rem;
    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
    text-transform: none;
    letter-spacing: 0.3px;
}

.btn-danger:hover {
    background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
}

.btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    border-radius: 6px;
}

.btn-secondary {
    background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    font-size: 0.9rem;
    box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
    text-transform: none;
    letter-spacing: 0.3px;
}

.btn-secondary:hover {
    background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(108, 117, 125, 0.4);
}

.selected-type-info {
    margin-bottom: 1.5rem;
    padding: 1.2rem 1.5rem;
    background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%);
    border-radius: 12px;
    border-left: 5px solid #3498db;
    box-shadow: 0 2px 12px rgba(52, 152, 219, 0.1);
    font-size: 1rem;
    font-weight: 600;
    color: #2c3e50;
}

/* 筛选区域样式 */
.filter-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid #e9ecef;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 0.8rem;
}

.filter-label {
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.9rem;
    white-space: nowrap;
}

.filter-select {
    padding: 0.5rem 1rem;
    border: 1px solid #ced4da;
    border-radius: 8px;
    background: white;
    color: #495057;
    font-size: 0.9rem;
    min-width: 150px;
    transition: all 0.3s ease;
}

.filter-select:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.events-count {
    display: flex;
    align-items: center;
}

.count-badge {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
    .filter-section {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .filter-group {
        justify-content: center;
    }

    .events-count {
        justify-content: center;
    }
}

/* 抽奖动画弹窗样式 */
.lottery-modal-overlay {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
    z-index: 2000;
}

.lottery-modal-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 3rem;
    max-width: 600px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    color: white;
    position: relative;
    overflow: hidden;
}

.lottery-modal-content::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: rotate 10s linear infinite;
}

.lottery-stage {
    position: relative;
    z-index: 1;
}

.lottery-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    display: inline-block;
}

.lottery-icon.spinning {
    animation: spin 1s linear infinite;
}

.lottery-icon.celebration {
    animation: bounce 0.8s ease-in-out infinite alternate;
}

.lottery-stage h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.lottery-stage h3 {
    font-size: 1.5rem;
    margin-bottom: 2rem;
    font-weight: 600;
    color: #ffd700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 准备阶段动画 */
.loading-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 2rem;
}

.loading-dots span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ffd700;
    animation: dot-pulse 1.4s ease-in-out infinite both;
}

.loading-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

/* 抽奖阶段动画 */
.lottery-header {
    margin-bottom: 2rem;
}

.current-prize {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.8rem 1.5rem;
    border-radius: 25px;
    border: 2px solid #ffd700;
    display: inline-block;
    margin-bottom: 1rem;
}

.numbers-container {
    margin: 2rem 0;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.numbers-display {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
}

.animated-number {
    background: rgba(255, 255, 255, 0.9);
    color: #333;
    padding: 0.8rem 1.2rem;
    border-radius: 12px;
    font-size: 1.2rem;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    animation: number-flash 0.5s ease-in-out;
    min-width: 80px;
}

.drawing-effect {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
}

.sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #ffd700;
    border-radius: 50%;
    animation: sparkle 2s ease-in-out infinite;
}

.sparkle:nth-child(1) {
    top: 20%;
    left: 20%;
    animation-delay: 0s;
}

.sparkle:nth-child(2) {
    top: 30%;
    right: 25%;
    animation-delay: 0.5s;
}

.sparkle:nth-child(3) {
    bottom: 30%;
    left: 30%;
    animation-delay: 1s;
}

.sparkle:nth-child(4) {
    bottom: 20%;
    right: 20%;
    animation-delay: 1.5s;
}

/* 完成阶段 */
.results-summary {
    margin: 2rem 0;
}

.result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    margin-bottom: 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.prize-name {
    font-weight: 600;
    font-size: 1.1rem;
}

.winner-count {
    background: #ffd700;
    color: #333;
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-weight: 700;
    font-size: 0.9rem;
}

.auto-close-hint {
    margin-top: 1.5rem;
    font-size: 0.9rem;
    opacity: 0.8;
    animation: fade-pulse 1s ease-in-out infinite alternate;
}

/* 动画关键帧 */
@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes bounce {
    from {
        transform: translateY(0);
    }

    to {
        transform: translateY(-10px);
    }
}

@keyframes dot-pulse {

    0%,
    80%,
    100% {
        transform: scale(0);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes number-flash {
    0% {
        transform: scale(0.8);
        opacity: 0.7;
    }

    50% {
        transform: scale(1.1);
        opacity: 1;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes sparkle {

    0%,
    100% {
        opacity: 0;
        transform: scale(0);
    }

    50% {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes fade-pulse {
    from {
        opacity: 0.6;
    }

    to {
        opacity: 1;
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .lottery-modal-content {
        padding: 2rem;
        margin: 1rem;
    }

    .lottery-icon {
        font-size: 3rem;
    }

    .lottery-stage h2 {
        font-size: 1.5rem;
    }

    .lottery-stage h3 {
        font-size: 1.2rem;
    }

    .animated-number {
        font-size: 1rem;
        padding: 0.6rem 1rem;
        min-width: 60px;
    }

    .numbers-display {
        gap: 0.5rem;
    }
}

.event-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
}

.event-item {
    border: 1px solid #e1e8ed;
    border-radius: 16px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 200px;
    position: relative;
}

.event-item:hover {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-color: #3498db;
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(52, 152, 219, 0.2);
}

.event-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    gap: 0.5rem;
}

.event-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.edit-btn,
.delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.25rem;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    opacity: 0.6;
}

.edit-btn:hover {
    background: rgba(52, 152, 219, 0.1);
    opacity: 1;
    transform: scale(1.1);
}

.delete-btn:hover {
    background: rgba(231, 76, 60, 0.1);
    opacity: 1;
    transform: scale(1.1);
}

.event-content {
    flex: 1;
    text-align: center;
    margin-bottom: 1rem;
}

.event-content h4 {
    margin: 0 0 0.8rem 0;
    color: #2c3e50;
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: 0.3px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.academic-year {
    margin: 0.5rem 0;
    color: #6c757d;
    font-weight: 600;
    font-size: 1rem;
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    padding: 0.4rem 1rem;
    border-radius: 20px;
    display: inline-block;
    border: 1px solid #bbdefb;
}

.event-description {
    color: #8e9ba8;
    font-size: 0.85rem;
    line-height: 1.4;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-top: 0.5rem;
}

/* 基础状态样式 */
.event-status {
    font-weight: 600;
    padding: 0.4rem 0.9rem;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    letter-spacing: 0.3px;
    border: 1px solid;
    transition: all 0.3s ease;
    text-transform: uppercase;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 待抽獎状态 - 橙色系 */
.status-pending {
    color: #e67e22;
    background: linear-gradient(135deg, #fef5e7 0%, #fff3cd 100%);
    border-color: #f39c12;
}

/* 已抽獎状态 - 蓝色系 */
.status-drawn {
    color: #2980b9;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border-color: #3498db;
}

/* 已完成状态 - 绿色系 */
.status-completed {
    color: #27ae60;
    background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
    border-color: #28a745;
}

/* 默认状态 - 灰色系 */
.status-default {
    color: #6c757d;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-color: #adb5bd;
}

/* 状态图标样式 */
.status-icon {
    font-size: 0.9rem;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

/* 悬停效果 */
.event-status:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.event-footer {
    text-align: center;
    border-top: 1px solid #f1f3f4;
    padding-top: 0.8rem;
}

.event-date {
    color: #6c757d;
    font-weight: 500;
    font-size: 0.8rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .event-list {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
    }

    .event-item {
        min-height: 180px;
        padding: 1.2rem;
    }

    .event-content h4 {
        font-size: 1.1rem;
    }
}

.breadcrumb {
    margin-bottom: 1.5rem;
    padding: 0.75rem 1rem;
    background-color: #f8f9fa;
    border-radius: 4px;
    font-size: 0.9rem;
}

.breadcrumb-link {
    cursor: pointer;
    color: #3498db;
    text-decoration: underline;
}

.breadcrumb-link:hover {
    color: #2980b9;
}

.breadcrumb-separator {
    margin: 0 0.5rem;
    color: #6c757d;
}

.lottery-tabs {
    display: flex;
    margin-bottom: 1rem;
    border-bottom: 1px solid #ddd;
}

.tab-item {
    padding: 1rem 1.5rem;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.3s;
}

.tab-item:hover {
    background-color: #f5f5f5;
}

.tab-item.active {
    border-bottom-color: #3498db;
    font-weight: bold;
}

.participants-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    border-left: 4px solid #3498db;
}

.participants-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.25rem;
}

.participants-header p {
    margin: 0;
    color: #7f8c8d;
    font-weight: 500;
    background: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.participants-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.participants-count {
    color: #7f8c8d;
    font-weight: 500;
    background: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.check-icon {
    color: #27ae60;
    font-weight: bold;
    font-size: 1.3rem;
    text-shadow: 0 1px 2px rgba(39, 174, 96, 0.3);
}

.cross-icon {
    color: #e74c3c;
    font-weight: bold;
    font-size: 1.3rem;
    text-shadow: 0 1px 2px rgba(231, 76, 60, 0.3);
}

.table-responsive {
    overflow-x: auto;
    margin-top: 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    background: white;
}

.table-responsive table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
    font-size: 0.95rem;
}

.table-responsive th {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    padding: 1rem 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
    border: none;
    position: sticky;
    top: 0;
    z-index: 10;
}

.table-responsive th:first-child {
    border-top-left-radius: 8px;
}

.table-responsive th:last-child {
    border-top-right-radius: 8px;
}

.table-responsive td {
    padding: 0.875rem 0.75rem;
    border-bottom: 1px solid #f1f3f4;
    vertical-align: middle;
    transition: background-color 0.2s ease;
}

.table-responsive tr:hover td {
    background-color: #f8f9fa;
}

.table-responsive tr:nth-child(even) td {
    background-color: #fafbfc;
}

.table-responsive tr:nth-child(even):hover td {
    background-color: #f0f2f5;
}

.table-responsive td:first-child {
    font-weight: 600;
    color: #2c3e50;
    text-align: center;
    background-color: #f8f9fa;
    border-right: 2px solid #e9ecef;
}

.table-responsive tr:nth-child(even) td:first-child {
    background-color: #f0f2f5;
}

.table-responsive tr:hover td:first-child {
    background-color: #e9ecef;
}

.winners-summary {
    margin-top: 2rem;
}

.winners-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.draw-btn {
    margin: 2rem 0;
    padding: 1.25rem 2.5rem;
    font-size: 1.3rem;
    font-weight: 600;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 200px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    overflow: hidden;
}

.draw-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s ease;
}

.draw-btn:hover::before {
    left: 100%;
}

.draw-btn-active {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    animation: pulse-active 2s infinite;
}

.draw-btn-active:hover {
    background: linear-gradient(135deg, #2980b9 0%, #1f4e79 100%);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

.draw-btn-completed {
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    color: white;
    border-radius: 15px;
    cursor: not-allowed;
    opacity: 0.9;
    position: relative;
}

.draw-btn-completed::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120%;
    height: 120%;
    background: repeating-linear-gradient(45deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.1) 10px,
            rgba(255, 255, 255, 0.1) 20px);
    pointer-events: none;
}

.draw-btn-completed:hover {
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    transform: none;
    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
}

.btn-icon {
    margin-right: 0.75rem;
    font-size: 1.5rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

@keyframes pulse-active {
    0% {
        box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
    }

    50% {
        box-shadow: 0 4px 25px rgba(52, 152, 219, 0.4);
    }

    100% {
        box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
    }
}

.draw-instructions,
.no-prizes-warning {
    margin-bottom: 2rem;
}

.prize-item {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
    margin-bottom: 1rem;
    border: 1px solid #eee;
    padding: 1rem;
    border-radius: 4px;
}

.prize-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
}

.save-actions {
    display: flex;
    gap: 1rem;
}

.no-winners-message {
    margin-bottom: 2rem;
    text-align: center;
    color: #7f8c8d;
    font-style: italic;
}

.no-winners-for-prize {
    margin: 1.5rem 2rem;
    padding: 2rem;
    text-align: center;
    color: #6c757d;
    font-style: italic;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    font-size: 1.1rem;
}

.prize-winners {
    margin-bottom: 2.5rem;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    background: white;
}

.prize-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 2px solid #dee2e6;
    position: relative;
}

.prize-header::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.prize-title {
    display: flex;
    align-items: center;
}

.prize-icon {
    margin-right: 0.75rem;
    font-size: 1.8rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.prize-name {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    color: #2c3e50;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    letter-spacing: 0.5px;
}

.prize-stats {
    display: flex;
    align-items: center;
    background: white;
    padding: 0.75rem 1.25rem;
    border-radius: 25px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #dee2e6;
}

.stats-label {
    margin-right: 0.5rem;
    font-weight: 500;
    color: #6c757d;
    font-size: 0.9rem;
}

.stats-number {
    font-weight: 700;
    color: #495057;
    font-size: 1rem;
}

.stats-separator {
    margin: 0 0.75rem;
    color: #adb5bd;
    font-weight: bold;
}

.winner-count {
    color: #27ae60;
    font-weight: 700;
    font-size: 1.1rem;
}

.prize-winners .table-responsive {
    margin-top: 0;
    border-radius: 0;
    box-shadow: none;
}

.prize-winners table {
    margin: 0;
}

.prize-winners .table-responsive th:first-child {
    border-top-left-radius: 0;
}

.prize-winners .table-responsive th:last-child {
    border-top-right-radius: 0;
}

.empty-participants {
    text-align: center;
    padding: 3rem 2rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 8px;
    border: 2px dashed #dee2e6;
    margin: 2rem 0;
}

.empty-participants p {
    margin-bottom: 1rem;
    color: #6c757d;
}

.upload-instructions {
    margin-top: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 16px;
    border: 1px solid #dee2e6;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-left: 5px solid #17a2b8;
}

.upload-instructions h4 {
    margin-bottom: 1.5rem;
    color: #2c3e50;
    font-size: 1.3rem;
    font-weight: 700;
    text-align: center;
    letter-spacing: 0.5px;
}

.format-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
}

@media (max-width: 768px) {
    .format-info {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
}

.format-section {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e9ecef;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.format-section:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.format-section h5 {
    margin-bottom: 1rem;
    color: #2c3e50;
    font-size: 1.1rem;
    font-weight: 600;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e9ecef;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.format-section ul {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem 0;
}

.format-section li {
    margin-bottom: 0.5rem;
    color: #495057;
    padding: 0.3rem 0;
    border-bottom: 1px solid #f8f9fa;
    font-size: 0.9rem;
}

.format-section li strong {
    color: #2c3e50;
    font-weight: 600;
    min-width: 120px;
    display: inline-block;
}

.download-sample {
    text-align: center;
}

.btn-outline-primary {
    background: transparent;
    color: #007bff;
    border: 2px solid #007bff;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-outline-primary:hover {
    background: #007bff;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.format-notes {
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    padding: 1.5rem;
    border-radius: 12px;
    border-left: 4px solid #2196f3;
}

.format-notes p {
    margin: 0 0 1rem 0;
    color: #1976d2;
    font-weight: 600;
    font-size: 1rem;
}

.format-notes ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.format-notes li {
    margin-bottom: 0.5rem;
    color: #37474f;
    font-size: 0.9rem;
    padding-left: 1.5rem;
    position: relative;
}

.format-notes li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #4caf50;
    font-weight: bold;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    z-index: 1000;
    overflow-y: auto;
    padding: 20px 0;
    -webkit-overflow-scrolling: touch;
    will-change: transform;
    backface-visibility: hidden;
}

/* Higher z-index for nested modals */
.modal-overlay .modal-overlay {
    z-index: 1001;
}

.preview-modal {
    z-index: 1001;
}

.test-email-modal {
    z-index: 1001;
    position: relative;
    padding: 0;
    margin: 20px auto;
}

.test-email-modal .modal-body {
    padding: 2rem;
}

.test-email-modal .modal-actions {
    padding: 1.5rem 2rem 2rem 2rem;
    margin-top: 0;
}

/* Collapsible email config section */
.collapsible-section {
    margin-top: 1.5rem;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
}

.collapsible-section .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    cursor: pointer;
    transition: background-color 0.3s ease;
    border-bottom: 1px solid #dee2e6;
}

.collapsible-section .section-header:hover {
    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
}

.collapsible-section .section-header h5 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #495057;
}

.collapse-indicator {
    font-size: 1.2rem;
    font-weight: bold;
    color: #6c757d;
    transition: transform 0.3s ease;
}

.collapse-indicator.collapsed {
    transform: rotate(0deg);
}

.collapse-indicator:not(.collapsed) {
    transform: rotate(0deg);
}

.collapsible-content {
    padding: 1.5rem;
    background-color: #fff;
}

/* 为邮件内容添加更多强调 */
.email-content-section {
    background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
    border: 2px solid #e3f2fd;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 12px rgba(33, 150, 243, 0.1);
}

.email-content-section h5 {
    color: #1976d2;
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    text-align: center;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e3f2fd;
}

.modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    margin: auto;
    position: relative;
    transform: translateZ(0);
    -webkit-overflow-scrolling: touch;
    backface-visibility: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
    margin: 0;
    color: #2c3e50;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-close:hover {
    color: #495057;
}

.modal-body {
    padding: 1.5rem;
    padding-bottom: 0.5rem;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding: 1rem 0;
}

.form-group {
    margin-bottom: 1rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #2c3e50;
}

.form-control {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.3s;
}

.form-control:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.modal-content .form-control {
    pointer-events: auto !important;
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
}

.modal-content textarea {
    pointer-events: auto !important;
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    resize: vertical;
}

.create-event-modal .form-control {
    pointer-events: auto !important;
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    cursor: text !important;
}

.create-event-modal textarea {
    pointer-events: auto !important;
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    resize: vertical;
    cursor: text !important;
    background-color: white !important;
    border: 1px solid #ddd !important;
    position: relative !important;
    z-index: 1010 !important;
}

.test-email-modal .form-control {
    pointer-events: auto !important;
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    cursor: text !important;
    background-color: white !important;
    border: 1px solid #ddd !important;
    position: relative !important;
    z-index: 1010 !important;
}

.test-email-modal textarea {
    pointer-events: auto !important;
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    resize: vertical;
    cursor: text !important;
    background-color: white !important;
    border: 1px solid #ddd !important;
    position: relative !important;
    z-index: 1010 !important;
}

.create-event-modal {
    z-index: 1005 !important;
}

.create-event-modal .modal-body {
    z-index: 1006 !important;
}

.create-event-modal .form-group {
    z-index: 1007 !important;
}

.edit-event-modal {
    z-index: 1005 !important;
    max-width: 500px;
    width: 90%;
}

.edit-event-modal .modal-body {
    z-index: 1006 !important;
}

.edit-event-modal .form-control {
    pointer-events: auto !important;
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    cursor: text !important;
}

.edit-event-modal textarea {
    pointer-events: auto !important;
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    resize: vertical;
    cursor: text !important;
    background-color: white !important;
    border: 1px solid #ddd !important;
    position: relative !important;
    z-index: 1010 !important;
}

.edit-event-modal .form-group {
    z-index: 1007 !important;
}

/* Email related styles */
.winners-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.btn-email {
    background: linear-gradient(135deg, #8e44ad 0%, #732d91 100%);
    color: white;
}

.btn-email:hover {
    background: linear-gradient(135deg, #732d91 0%, #5d1a72 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(142, 68, 173, 0.3);
}

.email-modal {
    max-width: 700px;
    width: 95%;
    margin-top: 20px;
    margin-bottom: 20px;
}

.test-email-modal {
    max-width: 600px;
    width: 95%;
}

.test-email-info {
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    padding: 1.5rem;
    border-radius: 12px;
    border-left: 4px solid #2196f3;
    margin-top: 1rem;
}

.test-email-info h5 {
    color: #1976d2;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.test-email-info p {
    color: #37474f;
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
}

.test-email-info ul {
    color: #546e7a;
    font-size: 0.85rem;
    margin: 0;
    padding-left: 1.5rem;
}

.test-email-info li {
    margin-bottom: 0.25rem;
}

.btn-warning {
    background-color: #f39c12;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.btn-warning:hover {
    background-color: #e67e22;
}

/* 空状态样式 */
.empty-state {
    text-align: center;
    padding: 3rem 2rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 16px;
    border: 2px dashed #dee2e6;
    margin: 2rem 0;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 2s infinite;
}

.empty-state h3 {
    color: #6c757d;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
}

.empty-state p {
    color: #8e9ba8;
    font-size: 1rem;
    margin-bottom: 2rem;
    line-height: 1.5;
}

.empty-state .btn {
    transform: scale(1.1);
    animation: pulse 2s infinite;
}

@keyframes bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-10px);
    }

    60% {
        transform: translateY(-5px);
    }
}

@keyframes pulse {
    0% {
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    }

    50% {
        box-shadow: 0 4px 20px rgba(52, 152, 219, 0.6);
    }

    100% {
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    }
}

.email-config-section,
.email-content-section {
    margin-bottom: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 16px;
    border-left: 5px solid #8e44ad;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.email-config-section h5,
.email-content-section h5 {
    margin: 0 0 1.5rem 0;
    color: #2c3e50;
    font-size: 1.2rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.server-info {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
    border-radius: 8px;
    border-left: 3px solid #28a745;
}

.server-info .text-muted {
    color: #5a6268 !important;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.info-icon {
    font-size: 1rem;
}

.email-content-editor {
    position: relative;
}

.template-variables {
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 12px;
    border: 1px solid #e3e6ea;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.variables-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e9ecef;
}

.variables-title {
    font-weight: 700;
    color: #2c3e50;
    font-size: 1rem;
}

.variables-hint {
    color: #6c757d;
    font-style: italic;
    font-size: 0.8rem;
}

.variables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
}

.variable-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    color: white;
    text-align: center;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
    position: relative;
    overflow: hidden;
}

.variable-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s ease;
}

.variable-card:hover::before {
    left: 100%;
}

.variable-card:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.variable-card:active {
    transform: translateY(-1px) scale(0.98);
}

.variable-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.variable-label {
    font-size: 0.8rem;
    font-weight: 500;
    opacity: 0.9;
    letter-spacing: 0.3px;
}

.email-textarea {
    min-height: 150px;
    resize: vertical;
    font-family: monospace;
    line-height: 1.5;
}

.html-template-textarea {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    resize: vertical;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    min-height: 300px;
    line-height: 1.4;
}

.template-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.template-header .form-label {
    margin-bottom: 0;
}

.preview-modal {
    max-width: 90vw;
    max-height: 90vh;
    width: 800px;
}

.preview-container {
    max-height: 70vh;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background-color: #fff;
}

.preview-frame {
    padding: 20px;
    font-family: Arial, sans-serif;
    line-height: 1.6;
}

.preview-frame * {
    max-width: 100%;
}

/* Email Editor Styles */
.editor-mode-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
}

.toggle-buttons {
    display: flex;
    gap: 0.5rem;
}

.toggle-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #dee2e6;
    background-color: #fff;
    color: #6c757d;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    font-weight: 500;
}

.toggle-btn:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
}

.toggle-btn.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.25);
}

.visual-editor {
    margin-top: 1rem;
}

.visual-content-editor {
    background-color: #fff;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1rem;
}

.visual-content-editor .form-group {
    margin-bottom: 1.5rem;
}

.visual-content-editor .form-group:last-child {
    margin-bottom: 0;
}

.visual-textarea {
    resize: vertical;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    border: 1px solid #ced4da;
    border-radius: 4px;
    padding: 0.75rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.visual-textarea:focus {
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.html-editor {
    margin-top: 1rem;
}

.form-label {
    font-weight: 600;
    color: #495057;
    margin-bottom: 0.5rem;
    display: block;
}

.current-field-indicator {
    background-color: #007bff;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.8rem;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.close-btn:hover {
    color: #495057;
    background-color: #f8f9fa;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.btn-secondary:hover {
    background-color: #5a6268;
}

/* Prevent body scroll when modal is open */
body.modal-open {
    overflow: hidden !important;
}

/* Ensure modal overlay covers entire viewport */
.modal-overlay {
    pointer-events: auto;
}

.modal-overlay * {
    pointer-events: auto;
}

/* Ensure modal content is properly contained */
.modal-content {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 40px);
    overflow: hidden;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

/* Ensure email modal has proper sizing for long content */
.email-modal {
    max-height: calc(100vh - 40px);
}

.email-modal .modal-body {
    overflow-y: auto;
}

/* Prevent scrolling issues in long lists */
.prize-winners {
    margin-bottom: 2rem;
}

.prize-winners table {
    table-layout: fixed;
    word-wrap: break-word;
}

@media (max-width: 768px) {
    .email-modal {
        max-width: 95%;
        margin: 1rem;
        max-height: calc(100vh - 40px);
    }

    .modal-body {
        max-height: calc(100vh - 120px);
    }

    .winners-actions {
        flex-direction: column;
        gap: 0.5rem;
    }

    .variables-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }

    .variable-card {
        padding: 0.75rem;
    }

    .variable-icon {
        font-size: 1.2rem;
    }

    .variable-label {
        font-size: 0.75rem;
    }

    .variables-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .email-config-section,
    .email-content-section {
        padding: 1.5rem;
    }
}
</style>