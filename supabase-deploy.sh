#!/bin/bash

echo "=== 老年人语音回忆录 - Supabase 部署脚本 ==="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"
echo ""

# 检查依赖
echo "检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

echo "✅ 依赖检查完成"
echo ""

# 环境变量检查
echo "=== 环境变量配置 ==="
echo ""

if [ -z "$SUPABASE_URL" ]; then
    echo "⚠️  SUPABASE_URL 未设置"
    echo "请设置环境变量："
    echo "  export SUPABASE_URL='你的Supabase URL'"
    echo ""
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  SUPABASE_ANON_KEY 未设置"
    echo "请设置环境变量："
    echo "  export SUPABASE_ANON_KEY='你的Supabase Anon Key'"
    echo ""
fi

# 创建 .env.supabase 文件（如果不存在）
if [ ! -f ".env.supabase" ]; then
    echo "创建环境变量模板..."
    cat > .env.supabase << 'EOF'
# Supabase 环境变量配置
# 访问 https://supabase.com 获取这些值

# 从 Supabase 项目设置中获取
SUPABASE_URL=https://你的项目ID.supabase.co
SUPABASE_ANON_KEY=你的anon-key

# 百度语音API配置（保持不变）
API_KEY=gCLxpGzB8gTMv7WL7DUqLohD
SECRET_KEY=OIvnHq2TfiTAIRxpi8DcWrTXTpvkqzL9
EOF
    echo "✅ 已创建 .env.supabase 模板"
    echo ""
fi

echo "=== 部署选项 ==="
echo ""
echo "1. 本地测试（使用 Supabase）"
echo "   SUPABASE_URL=你的URL SUPABASE_ANON_KEY=你的Key npm start"
echo ""
echo "2. 部署到 Vercel（前端）"
echo "   vercel --prod"
echo ""
echo "3. 部署到 Railway/Render（后端 + Supabase）"
echo "   - 在平台设置中配置环境变量"
echo ""
echo "=== Supabase 设置步骤 ==="
echo ""
echo "1. 访问 https://supabase.com"
echo "2. 创建新项目 'memoirs'"
echo "3. 在 SQL Editor 中执行 supabase-schema.sql"
echo "4. 复制项目 URL 和 Anon Key"
echo "5. 配置环境变量"
echo ""

echo "=== 部署完成 ==="
