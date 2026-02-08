#!/bin/bash

echo "=== 老年人语音回忆录部署脚本 ==="
echo ""

PROJECT_DIR="/Users/apple/Documents/trae_projects/memoirs"
LOG_DIR="$PROJECT_DIR/logs"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 进入项目目录
cd "$PROJECT_DIR"

# 安装依赖
echo "正在安装依赖..."
npm install

# 使用 PM2 启动
echo "正在启动服务..."
if pm2 list | grep -q "memoirs"; then
    pm2 restart memoirs
else
    pm2 start server.js --name "memoirs"
    pm2 save
fi

echo ""
echo "=== 部署完成 ==="
echo "服务状态:"
pm2 status memoirs
echo ""
echo "访问地址: http://localhost:3001"
echo "查看日志: pm2 logs memoirs"
