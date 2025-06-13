# 前端應用部署說明

## 自動部署（推薦）

1. 確保已經打包應用：

```bash
npm run build
```

2. 執行部署腳本：

```bash
./deploy.sh
```

## 手動部署

如果自動部署腳本無法使用，可以手動執行以下步驟：

### 1. 打包應用

```bash
npm run build
```

### 2. 上傳文件到服務器

```bash
# 使用 scp 上傳整個 dist 目錄
scp -r dist/* hostadm@140.120.40.192:/var/www/html/lottery/

# 或使用 rsync（推薦）
rsync -avz --delete dist/ hostadm@140.120.40.192:/var/www/html/lottery/
```

### 3. 在服務器上設定權限

```bash
# SSH 連接到服務器
ssh hostadm@140.120.40.192

# 設定目錄權限
sudo chown -R www-data:www-data /var/www/html/lottery
sudo chmod -R 755 /var/www/html/lottery
```

## Nginx 配置

如果使用 Nginx 作為 Web 服務器，請添加以下配置：

```nginx
server {
    listen 80;
    server_name 140.120.40.192;

    # 前端應用
    location /lottery/ {
        alias /var/www/html/lottery/;
        try_files $uri $uri/ /lottery/index.html;

        # 處理 CORS（如果需要）
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
    }

    # API 代理（如果需要）
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 訪問應用

部署完成後，可以通過以下地址訪問應用：

- http://140.120.40.192/lottery/

## 故障排除

### 1. 如果頁面顯示 404

- 檢查文件是否正確上傳到 `/var/www/html/lottery/`
- 確認 Nginx 配置中的 `try_files` 設定正確

### 2. 如果 API 調用失敗

- 檢查 API 服務是否正常運行在 `http://140.120.40.192:8000`
- 確認防火牆設定允許相關端口

### 3. 如果靜態資源載入失敗

- 檢查文件權限是否正確設定
- 確認 assets 目錄中的文件是否完整

## 開發環境 vs 生產環境

- **開發環境**: 使用 Vite 代理，API 請求通過 `/api` 轉發到 `http://localhost:8000`
- **生產環境**: API 請求通過 `http://140.120.40.192/api` 訪問後端服務
