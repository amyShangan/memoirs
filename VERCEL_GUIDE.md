# Vercel 部署指南

## 📋 目录

- [快速部署](#快速部署)
- [手动部署](#手动部署)
- [环境变量配置](#环境变量配置)
- [访问你的应用](#访问你的应用)
- [常见问题](#常见问题)

## 🚀 快速部署

### 方式一：通过 Vercel CLI 部署

```bash
# 1. 安装 Vercel CLI
sudo npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 进入项目目录
cd /Users/apple/Documents/trae_projects/memoirs

# 4. 部署到 Vercel（预览）
vercel

# 5. 部署到生产环境
vercel --prod
```

### 方式二：通过 GitHub 部署（推荐）

1. **推送代码到 GitHub**
```bash
cd /Users/apple/Documents/trae_projects/memoirs
git add .
git commit -m "添加Vercel API路由支持"
git remote add origin https://github.com/你的用户名/memoirs.git
git push -u origin main
```

2. **在 Vercel 网站部署**
   - 访问 https://vercel.com
   - 点击 "Add New Project"
   - 选择 "memoirs" 仓库
   - 点击 "Deploy"

## 🔧 手动部署

### 步骤 1：安装 Vercel CLI

```bash
sudo npm install -g vercel
```

### 步骤 2：登录 Vercel

```bash
vercel login
```

按照提示完成 GitHub 账号授权。

### 步骤 3：配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `API_KEY` | `gCLxpGzB8gTMv7WL7DUqLohD` |
| `SECRET_KEY` | `OIvnHq2TfiTAIRxpi8DcWrTXTpvkqzL9` |
| `SUPABASE_URL` | 你的 Supabase URL（可选） |
| `SUPABASE_ANON_KEY` | 你的 Supabase Anon Key（可选） |

### 步骤 4：部署

```bash
# 预览部署
vercel

# 生产部署
vercel --prod
```

## 📝 环境变量配置

### 必需变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `API_KEY` | 百度语音API Key | gCLxpGzB8gTMv7WL7DUqLohD |
| `SECRET_KEY` | 百度语音API Secret | OIvnHq2TfiTAIRxpi8DcWrTXTpvkqzL9 |

### 可选变量

| 变量 | 说明 |
|------|------|
| `SUPABASE_URL` | Supabase 项目 URL（用于存储数据） |
| `SUPABASE_ANON_KEY` | Supabase Anon Key |

## 🌐 访问你的应用

部署成功后，你会获得一个访问地址，例如：
- `https://memoirs.vercel.app`
- `https://memoirs-xxx.vercel.app`

## ❓ 常见问题

### Q1: Vercel 部署需要付费吗？

**A**: 
- ✅ 个人版免费（足够使用）
- ✅ 包含 100GB 带宽
- ✅ 无限请求次数

### Q2: Vercel 支持数据库吗？

**A**: 
- Vercel 本身不提供数据库
- 建议搭配 Supabase（免费 PostgreSQL）
- 或者使用 Railway/Render 部署后端

### Q3: 音频文件会丢失吗？

**A**: 
- 默认情况下，Vercel 无状态，录音文件不会保存
- 建议配置 Supabase 用于数据持久化
- 或者使用 Railway/Render 部署完整后端

### Q4: 如何更新部署？

**A**: 
```bash
# 推送代码到 GitHub
git add .
git commit -m "更新内容"
git push

# Vercel 会自动重新部署
```

### Q5: 本地预览 Vercel 部署？

**A**: 
```bash
vercel dev
```

## 🔄 完整架构

```
┌─────────────────────────────────────────────────┐
│                  Vercel                          │
│  ┌─────────────┐    ┌─────────────────────┐   │
│  │   前端页面   │    │     API Routes      │   │
│  │  index.html  │    │  /api/recognize    │   │
│  │  script.js   │    │  /api/voices       │   │
│  │  style.css   │    │  /api/token        │   │
│  └─────────────┘    └─────────────────────┘   │
│         ↓                    ↓                  │
│  ┌──────────────────────────────────────────┐  │
│  │            Supabase（可选）               │  │
│  │  PostgreSQL + Storage（存储录音）         │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 📞 获取帮助

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Discord](https://discord.gg/vercel)
