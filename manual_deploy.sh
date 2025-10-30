#!/bin/bash

echo "🚀 手動部署前端應用..."

# 設定變數
REMOTE_HOST="140.120.40.192"
REMOTE_USER="hostadm"
REMOTE_PATH="/var/www/html/lottery_frontend_app"

echo "📦 執行 npm run build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ npm run build 失敗"
    exit 1
fi

echo "📁 創建遠端目錄..."
ssh $REMOTE_USER@$REMOTE_HOST "sudo mkdir -p $REMOTE_PATH && sudo chown $REMOTE_USER:$REMOTE_USER $REMOTE_PATH"

echo "📤 上傳文件..."
scp -r dist $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

echo "🔐 設定權限..."
ssh $REMOTE_USER@$REMOTE_HOST "sudo chown -R www-data:www-data $REMOTE_PATH/dist && sudo chmod -R 755 $REMOTE_PATH/dist"

echo "✅ 部署完成！"
