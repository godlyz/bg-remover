# BGFree - 免费在线图片去背景工具

<div align="center">

**BGFree** 是一个免费在线去背景工具，支持**快速免费（本地处理）**和**专业品质（云端高清）**两种模式。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

[在线演示](https://bgfree.pages.dev) · [功能需求](./docs/projects/bg-remover/requirement-mvp.md) · [部署指南](./DEPLOYMENT.md)

</div>

## ✨ 特性

- **⚡ 快速免费模式** — 使用浏览器本地 AI 处理，图片不离开你的设备，完全免费无限制
- **✨ 专业品质模式** — 调用 remove.bg API，边缘更精准，适合高质量需求
- **无需注册** — 打开即用，不需要登录
- **隐私保护** — 免费模式图片不上传，云端模式临时传输不存储
- **背景色替换** — 支持预设颜色和自定义颜色
- **响应式设计** — 支持 PC、平板、手机
- **智能降级** — 云端模式失败自动切换到本地模式

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 到 `.env.local` 并填写 API Key：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```bash
REMOVEBG_API_KEY=your_api_key_here
```

> 获取 API Key：https://www.remove.bg/api

### 本地开发

```bash
pnpm dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 📁 项目结构

```
bg-remover/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes
│   │   │   └── remove-bg/   # remove.bg 代理路由
│   │   ├── layout.tsx       # 根布局
│   │   ├── page.tsx         # 首页
│   │   └── globals.css     # 全局样式
│   ├── components/         # React 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── types/             # TypeScript 类型
│   └── utils/             # 工具函数
├── public/                # 静态资源
├── docs/                  # 项目文档
└── README.md
```

## 🛠️ 技术栈

| 层 | 技术选型 |
|----|---------|
| **框架** | Next.js 16 (App Router) |
| **语言** | TypeScript |
| **样式** | Tailwind CSS 4 |
| **本地 AI** | @imgly/background-removal (BRIA RMBG-1.4) |
| **云端 API** | remove.bg API |
| **运行时** | ONNX Runtime Web |

## 📖 功能说明

### 引擎模式

| 模式 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| **快速免费** | 浏览器本地 AI 处理 | 完全免费、图片不上传、响应快 | 首次需下载模型（~40MB） |
| **专业品质** | remove.bg 云端 API | 边缘精准、效果稳定 | 消耗 API 额度、图片临时上传 |

### 自动降级

云端模式处理失败时，会自动切换到本地模式并提示用户。

### 文件限制

| 模式 | 最大文件大小 | 最大分辨率 |
|------|------------|----------|
| 快速免费 | 10MB | 4096×4096 px |
| 专业品质 | 12MB | 25000×25000 px |

## 🚀 部署

### Cloudflare Pages（推荐）

详细步骤请查看 [部署指南](./DEPLOYMENT.md)。

简要步骤：

1. 连接 GitHub 仓库到 Cloudflare Pages
2. 配置构建：`pnpm build`，输出目录：`.next`
3. 添加环境变量：`REMOVEBG_API_KEY`
4. 自动部署

### Vercel

1. 导入 GitHub 仓库
2. 配置环境变量
3. 自动部署

## 📝 待办事项

- [ ] 批量处理功能
- [ ] 证件照模板（一寸/二寸）
- [ ] 滑块对比模式
- [ ] 输出格式选择（WebP）
- [ ] 复制到剪贴板
- [ ] SEO 深度优化
- [ ] 多语言支持

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [BRIA AI RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4) - 本地去背景模型
- [remove.bg](https://www.remove.bg/) - 云端去背景 API
- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

## 📧 联系

- GitHub Issues: [提交问题](https://github.com/godlyz/bg-remover/issues)
- 邮箱: kn197884@gmail.com

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/godlyz">柯宁</a>
</div>
