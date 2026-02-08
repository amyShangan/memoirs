# 老年人语音回忆录 - Supabase 集成指南

## 📋 目录

- [简介](#简介)
- [Supabase 优势](#supabase-优势)
- [快速开始](#快速开始)
- [本地开发](#本地开发)
- [部署到 Vercel](#部署到-vercel)
- [部署到 Railway](#部署到-railway)
- [常见问题](#常见问题)

## 📖 简介

本项目已集成 Supabase 作为后端数据库和文件存储服务，替代原有的 SQLite 数据库，提供更强大、可扩展的云端解决方案。

## 🚀 Supabase 优势

| 功能 | SQLite | Supabase |
|------|--------|----------|
| 数据库类型 | 本地文件 | PostgreSQL 云数据库 |
| 文件存储 | 不支持 | 支持（音频文件） |
| 实时订阅 | 不支持 | 支持 |
| 扩展性 | 差 | 好 |
| Vercel 兼容 | ❌ 不兼容 | ✅ 完全兼容 |

## 🏃 快速开始

### 步骤 1：创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 点击 "Start your project"
3. 使用 GitHub 登录
4. 创建新项目：
   - **Name**: `memoirs`
   - **Password**: 设置一个强密码
   - **Region**: 选择亚洲区域（Tokyo 或 Singapore）

### 步骤 2：获取配置信息

项目创建后，在设置中找到：

- **URL**: `https://xxxxx.supabase.co`
- **anon public key**: 在 API 设置中

### 步骤 3：创建数据库表

在 Supabase 控制台的 **SQL Editor** 中执行 `supabase-schema.sql` 文件内容。

### 步骤 4：配置环境变量

```bash
# 复制模板
cp .env.supabase .env

# 编辑配置
nano .env
```

添加以下内容：
```env
SUPABASE_URL=https://你的项目ID.supabase.co
SUPABASE_ANON_KEY=你的anon-key

# 百度语音API配置
API_KEY=gCLxpGzB8gTMv7WL7DUqLohD
SECRET_KEY=OIvnHq2TfiTAIRxpi8DcWrTXTpvkqzL9
```

## 💻 本地开发

### 方式 1：使用 SQLite（回退）

```bash
# 不配置 Supabase 环境变量即可使用本地 SQLite
npm start
```

访问：http://localhost:3001

### 方式 2：使用 Supabase

```bash
# 设置环境变量并启动
export SUPABASE_URL=https://你的项目.supabase.co
export SUPABASE_ANON_KEY=你的anon-key
npm start
```

访问：http://localhost:3001

## ☁️ 部署到 Vercel

### 1. 推送代码到 GitHub

```bash
cd memoirs
git add .
git commit -m "添加Supabase支持"
git remote add origin https://github.com/你的用户名/memoirs.git
git push -u origin main
```

### 2. 部署前端到 Vercel

1. 访问 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库
3. 配置：
   - Framework Preset: Other
   - Build Command: 留空
   - Output Directory: `.`
4. 点击 Deploy

### 3. 配置环境变量

在 Vercel 项目设置中添加：
```
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_ANON_KEY=你的anon-key
```

## 🚂 部署到 Railway

### 1. 创建 Railway 项目

1. 访问 [Railway](https://railway.app)
2. 使用 GitHub 登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择 memoirs 项目

### 2. 配置环境变量

在 Railway 项目设置中添加：
```
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_ANON_KEY=你的anon-key
API_KEY=gCLxpGzB8gTMv7WL7DUqLohD
SECRET_KEY=OIvnHq2TfiTAIRxpi8DcWrTXTpvkqzL9
PORT=3001
```

### 3. 启动服务

Railway 会自动检测并启动 `server-supabase.js`

## 📱 最终访问地址

| 环境 | 地址 |
|------|------|
| 本地 | http://localhost:3001 |
| Vercel | https://memoirs.vercel.app |
| Railway | https://memoirs.railway.app |

## ❓ 常见问题

### Q1: Supabase 和本地 SQLite 如何切换？

**A**: 
- 配置 `SUPABASE_URL` 环境变量 → 使用 Supabase
- 不配置或留空 → 使用本地 SQLite

### Q2: 音频文件存储在哪里？

**A**: 
- Supabase 模式：存储在 Supabase Storage（`audio-recordings` 桶）
- SQLite 模式：存储在数据库中（BLOB 字段）

### Q3: Vercel 可以直接部署后端吗？

**A**: 不可以。Vercel 主要用于静态前端，后端需要部署到 Railway/Render/Heroku。

### Q4: 如何迁移现有数据？

**A**: 导出 SQLite 数据，然后导入到 Supabase：

```sql
-- 在 Supabase SQL Editor 中
INSERT INTO voices (audio_name, audio_size, recognition_result, created_at)
SELECT audio_name, audio_size, recognition_result, created_at
FROM -- 导入你的SQLite数据
```

### Q5: Supabase 免费额度够用吗？

**A**: 
- ✅ 免费版包含 500MB 数据库
- ✅ 1GB 文件存储
- ✅ 足够个人使用

## 📞 获取帮助

- [Supabase 文档](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [项目 Issues](https://github.com/你的用户名/memoirs/issues)

## 📝 更新日志

### v1.1.0 (2026-02-08)
- ✨ 添加 Supabase 支持
- ✨ 支持云端数据库
- ✨ 支持音频文件云端存储
- 🔄 自动检测 Supabase 配置
- 🔄 保留 SQLite 回退支持
