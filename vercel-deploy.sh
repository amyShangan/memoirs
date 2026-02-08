# Vercel 部署脚本

echo "=== 老年人语音回忆录 - Vercel 部署 ==="
echo ""

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "正在安装 Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "请按以下步骤部署："
echo ""
echo "1. 前端部署到 Vercel："
echo "   - 访问 https://vercel.com"
echo "   - 使用 GitHub 登录"
echo "   - 点击 'Add New Project'"
echo "   - 选择 memoirs 项目"
echo "   - 点击 'Deploy'"
echo ""
echo "2. 后端部署（选择以下方式之一）："
echo ""
echo "   方式A - 使用 Railway（推荐）："
echo "   - 访问 https://railway.app"
echo "   - 使用 GitHub 登录"
echo "   - 点击 'New Project'"
echo "   - 选择 'Deploy from GitHub repo'"
echo "   - 选择 memoirs 项目"
echo "   - Railway 会自动安装依赖并启动"
echo ""
echo "   方式B - 使用 Render："
echo "   - 访问 https://render.com"
echo "   - 创建 Web Service"
echo "   - 连接 GitHub 仓库"
echo "   - Build Command: npm install"
echo "   - Start Command: node server.js"
echo ""
echo "3. 配置环境变量："
echo "   - 在 Vercel 和后端平台设置："
echo "   - API_KEY=gCLxpGzB8gTMv7WL7DUqLohD"
echo "   - SECRET_KEY=OIvnHq2TfiTAIRxpi8DcWrTXTpvkqzL9"
echo ""

# 本地预览
echo "4. 本地预览 Vercel 部署："
echo "   vercel"
echo ""

echo "=== 部署完成 ==="
