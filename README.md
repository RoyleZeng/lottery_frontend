# 抽獎系統前端

這是一個基於 Vue 3 的抽獎系統前端應用，支援學生問卷調查和期末教學評量的抽獎功能。

## 功能特色

- 🎯 **多種抽獎類型**：支援學生問卷調查和期末教學評量
- 👥 **參與者管理**：Excel 匯入、查看、刪除參與者
- 🏆 **獎項設定**：靈活的獎項配置和數量設定
- 🎲 **抽獎執行**：公平的隨機抽獎機制
- 📧 **郵件通知**：自動發送中獎通知郵件
- 📊 **結果匯出**：Excel 格式的中獎名單匯出
- 🎨 **響應式設計**：支援桌面和移動設備

## 技術棧

- **前端框架**：Vue 3 + Composition API
- **狀態管理**：Pinia
- **路由**：Vue Router
- **HTTP 客戶端**：Axios
- **Excel 處理**：SheetJS
- **構建工具**：Vite
- **樣式**：CSS3 + Flexbox/Grid

## 快速開始

### 開發環境

1. 安裝依賴：

```bash
npm install
```

2. 啟動開發服務器：

```bash
npm run dev
```

3. 訪問應用：http://localhost:5173

### 生產環境

1. 打包應用：

```bash
npm run build
```

2. 部署到服務器：

```bash
./deploy.sh
```

## API 配置

- **開發環境**：通過 Vite 代理 `/api` 轉發到 `http://localhost:8000`
- **生產環境**：直接連接到 `http://140.120.40.192/api`

## 部署說明

詳細的部署說明請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署

1. 確保後端 API 服務運行在 `http://140.120.40.192:8000`
2. 執行打包：`npm run build`
3. 執行部署：`./deploy.sh`
4. 訪問應用：`http://140.120.40.192/lottery/`

## 項目結構

```
lottery_frontend/
├── public/                 # 靜態資源
├── src/
│   ├── assets/            # 資源文件
│   ├── components/        # 組件
│   ├── router/           # 路由配置
│   ├── services/         # API 服務
│   ├── stores/           # Pinia 狀態管理
│   ├── views/            # 頁面組件
│   ├── App.vue           # 根組件
│   └── main.js           # 入口文件
├── dist/                 # 打包輸出
├── deploy.sh            # 部署腳本
├── DEPLOYMENT.md        # 部署說明
└── README.md           # 項目說明
```

## 主要功能

### 1. 用戶認證

- 登錄/登出功能
- JWT Token 管理
- 路由守衛

### 2. 抽獎管理

- 選擇抽獎類型（學生問卷調查/期末教學評量）
- 查看可用的抽獎活動
- 參與者列表管理

### 3. 參與者管理

- Excel 文件匯入
- 參與者資料顯示
- 批量刪除功能

### 4. 獎項設定

- 動態添加/刪除獎項
- 設定獎項名稱和數量
- 獎項配置保存

### 5. 抽獎執行

- 一鍵執行抽獎
- 即時顯示中獎結果
- 防重複抽獎機制

### 6. 結果管理

- 中獎名單查看
- Excel 格式匯出
- 郵件通知發送

### 7. 郵件系統

- 視覺化郵件編輯器
- HTML 模板支援
- 變數插入功能
- 即時預覽

## 開發指南

### 環境要求

- Node.js 16+
- npm 或 yarn

### 開發命令

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 打包
npm run build

# 預覽打包結果
npm run preview
```

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 授權

MIT License
