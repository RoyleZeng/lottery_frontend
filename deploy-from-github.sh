#!/bin/bash

# 從 GitHub 部署抽獎系統前端的腳本
# 使用方法：./deploy-from-github.sh

set -e

echo "🚀 開始從 GitHub 部署抽獎系統前端..."

# 設定變數
REPO_URL="https://github.com/RoyleZeng/lottery_frontend.git"
TEMP_DIR="/tmp/lottery_frontend_deploy"
TARGET_DIR="/var/www/html/lottery"
BACKUP_DIR="/var/www/html/lottery_backup_$(date +%Y%m%d_%H%M%S)"

# 檢查是否為 root 用戶或有 sudo 權限
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    echo "❌ 此腳本需要 root 權限或 sudo 權限"
    echo "請使用: sudo ./deploy-from-github.sh"
    exit 1
fi

# 清理臨時目錄
if [ -d "$TEMP_DIR" ]; then
    echo "🧹 清理舊的臨時目錄..."
    rm -rf "$TEMP_DIR"
fi

# 克隆倉庫
echo "📥 從 GitHub 克隆倉庫..."
git clone "$REPO_URL" "$TEMP_DIR"

# 檢查 dist 目錄是否存在
if [ ! -d "$TEMP_DIR/dist" ]; then
    echo "❌ 錯誤：dist 目錄不存在！"
    echo "請確保倉庫中包含已編譯的 dist 目錄"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 備份現有部署（如果存在）
if [ -d "$TARGET_DIR" ]; then
    echo "💾 備份現有部署到 $BACKUP_DIR..."
    if [ "$EUID" -eq 0 ]; then
        cp -r "$TARGET_DIR" "$BACKUP_DIR"
    else
        sudo cp -r "$TARGET_DIR" "$BACKUP_DIR"
    fi
fi

# 創建目標目錄
echo "📁 創建目標目錄..."
if [ "$EUID" -eq 0 ]; then
    mkdir -p "$TARGET_DIR"
else
    sudo mkdir -p "$TARGET_DIR"
fi

# 複製 dist 目錄內容到目標位置
echo "📋 複製文件到 $TARGET_DIR..."
if [ "$EUID" -eq 0 ]; then
    cp -r "$TEMP_DIR/dist/"* "$TARGET_DIR/"
    chown -R www-data:www-data "$TARGET_DIR"
    chmod -R 755 "$TARGET_DIR"
else
    sudo cp -r "$TEMP_DIR/dist/"* "$TARGET_DIR/"
    sudo chown -R www-data:www-data "$TARGET_DIR"
    sudo chmod -R 755 "$TARGET_DIR"
fi

# 清理臨時目錄
echo "🧹 清理臨時文件..."
rm -rf "$TEMP_DIR"

echo "✅ 部署完成！"
echo ""
echo "📍 部署位置: $TARGET_DIR"
echo "🌐 訪問地址: http://$(hostname -I | awk '{print $1}')/lottery/"
echo "💾 備份位置: $BACKUP_DIR"
echo ""
echo "🔧 如需回滾，請執行："
echo "   sudo rm -rf $TARGET_DIR"
echo "   sudo mv $BACKUP_DIR $TARGET_DIR" 