# 手動部署步驟

## 1. 執行建構

```bash
npm run build
```

## 2. 連接到遠端服務器創建目錄

```bash
ssh hostadm@140.120.40.192
sudo mkdir -p /var/www/html/lottery_frontend_app
sudo chown hostadm:hostadm /var/www/html/lottery_frontend_app
exit
```

## 3. 上傳文件 (修正後的命令)

```bash
# 上傳整個 dist 目錄
scp -r dist hostadm@140.120.40.192:/var/www/html/lottery_frontend_app/

# 或者上傳 dist 目錄內的所有文件
scp -r dist/* hostadm@140.120.40.192:/var/www/html/lottery_frontend_app/dist/
```

## 4. 設定權限

```bash
ssh hostadm@140.120.40.192
sudo chown -R www-data:www-data /var/www/html/lottery_frontend_app/dist
sudo chmod -R 755 /var/www/html/lottery_frontend_app/dist
exit
```

## 問題分析

您之前的命令有以下問題：

1. `~/var/www/html/lottery_frontend_app/dist` - 錯誤：~ 表示 home 目錄
2. 應該是絕對路徑：`/var/www/html/lottery_frontend_app/dist`
3. 目標目錄可能不存在，需要先創建

## 正確的一行命令

```bash
# 如果目錄已存在
scp -r dist hostadm@140.120.40.192:/var/www/html/lottery_frontend_app/
```
