#!/bin/bash

# 部署腳本 - 將前端應用部署到遠程主機
# 使用方法: ./deploy.sh

echo "🚀 開始部署前端應用..."

# 設定變數
REMOTE_HOST="140.120.40.192"
REMOTE_USER="hostadm"
REMOTE_PATH="/var/www/html/lottery"  # 可以根據實際需求調整路徑
LOCAL_DIST_PATH="./dist"

# 檢查dist目錄是否存在
if [ ! -d "$LOCAL_DIST_PATH" ]; then
    echo "❌ 錯誤: dist 目錄不存在，請先執行 npm run build"
    exit 1
fi

echo "📦 準備上傳文件到 $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

# 創建遠程目錄（如果不存在）
echo "📁 創建遠程目錄..."
ssh $REMOTE_USER@$REMOTE_HOST "sudo mkdir -p $REMOTE_PATH && sudo chown $REMOTE_USER:$REMOTE_USER $REMOTE_PATH"

# 上傳文件
echo "📤 上傳文件..."
rsync -avz --delete $LOCAL_DIST_PATH/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# 設定正確的權限
echo "🔐 設定文件權限..."
ssh $REMOTE_USER@$REMOTE_HOST "sudo chown -R www-data:www-data $REMOTE_PATH && sudo chmod -R 755 $REMOTE_PATH"

echo "✅ 部署完成！"
echo "🌐 您的應用現在可以通過以下地址訪問："
echo "   http://$REMOTE_HOST/lottery/"
echo ""
echo "💡 如果需要配置 Nginx，請參考以下配置："
echo "   location /lottery/ {"
echo "       alias $REMOTE_PATH/;"
echo "       try_files \$uri \$uri/ /lottery/index.html;"
echo "   }" 