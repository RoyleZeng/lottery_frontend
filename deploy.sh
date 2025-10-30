#!/bin/bash

# 部署腳本 - 建構前端應用並部署到遠程主機
# 使用方法: ./deploy.sh

echo "🚀 開始部署前端應用..."

# 設定變數
REMOTE_HOST="oaalottery"
REMOTE_USER="hostadm"
REMOTE_PATH="/var/www/html/lottery_frontend_app"
LOCAL_DIST_PATH="./dist"

echo "📦 執行 npm run build..."
# 清理舊的 dist 目錄
if [ -d "$LOCAL_DIST_PATH" ]; then
    echo "🗑️ 清理舊的 dist 目錄..."
    rm -rf $LOCAL_DIST_PATH
fi

# 執行建構
npm run build

# 檢查建構是否成功
if [ $? -ne 0 ]; then
    echo "❌ 錯誤: npm run build 失敗"
    exit 1
fi

# 檢查dist目錄是否存在
if [ ! -d "$LOCAL_DIST_PATH" ]; then
    echo "❌ 錯誤: dist 目錄不存在，建構可能失敗"
    exit 1
fi

echo "📁 準備部署到 $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

# 創建遠程目錄（如果不存在）
echo "📁 確保遠程目錄存在..."
ssh $REMOTE_USER@$REMOTE_HOST "sudo mkdir -p $REMOTE_PATH && sudo chown $REMOTE_USER:$REMOTE_USER $REMOTE_PATH"

if [ $? -ne 0 ]; then
    echo "❌ 錯誤: 無法連接到遠程主機或創建目錄"
    exit 1
fi

# 備份現有文件（如果存在）
echo "💾 備份現有文件..."
BACKUP_DIR="$REMOTE_PATH/backup_$(date +%Y%m%d_%H%M%S)"
ssh $REMOTE_USER@$REMOTE_HOST "if [ -d '$REMOTE_PATH/dist' ]; then sudo mkdir -p $BACKUP_DIR && sudo mv $REMOTE_PATH/dist $BACKUP_DIR/; fi"

# 上傳文件
echo "📤 上傳文件..."
scp -r $LOCAL_DIST_PATH $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

if [ $? -ne 0 ]; then
    echo "❌ 錯誤: 文件上傳失敗"
    exit 1
fi

# 設定正確的權限
echo "🔐 設定文件權限..."
ssh $REMOTE_USER@$REMOTE_HOST "sudo chown -R www-data:www-data $REMOTE_PATH/dist && sudo chmod -R 755 $REMOTE_PATH/dist"

echo "✅ 部署完成！"
echo "🌐 您的應用現在部署在："
echo "   $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/dist"
echo ""
echo "💡 如果需要配置 Nginx，請參考以下配置："
echo "   location /lottery_frontend_app/ {"
echo "       alias $REMOTE_PATH/dist/;"
echo "       try_files \$uri \$uri/ /lottery_frontend_app/index.html;"
echo "   }" 