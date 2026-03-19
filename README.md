# BGFree - 免费在线图片去背景工具

BGFree 是一个免费在线去背景工具，支持**快速免费（本地处理）**和**专业品质（云端高清）**两种模式。

## 功能特点

- **⚡ 快速免费模式**：使用浏览器本地 AI 处理，图片不离开你的设备，完全免费无限制
- **✨ 专业品质模式**：调用 remove.bg API，边缘更精准，适合高质量需求
- **无需注册**：打开即用，不需要登录
- **隐私保护**：免费模式图片不上传，云端模式临时传输不存储
- **背景色替换**：支持预设颜色和自定义颜色
- **响应式设计**：支持 PC、平板、手机

## 技术栈

- **框架**：Next.js 16 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS 4
- **本地 AI**：@imgly/background-removal (BRIA RMBG-1.4 模型)
- **云端 API**：remove.bg API (通过 Next.js API Routes 代理)

## 开发

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev

# 构建生产版本
pnpm build

# 启动生产版本
pnpm start
```

## 环境变量

创建 `.env.local` 文件：

```bash
REMOVEBG_API_KEY=your_api_key_here
```

## 部署

本项目可部署到 Cloudflare Pages（推荐）或 Vercel。

### Cloudflare Pages 部署

1. 连接 GitHub 仓库
2. 构建命令：`pnpm build`
3. 输出目录：`.next`
4. 配置环境变量 `REMOVEBG_API_KEY`

### 本地 Workers 部署 API 路由

如果使用 Cloudflare Pages，API Routes 需要 Cloudflare Workers 支持。

## 许可证

MIT

## 致谢

- [BRIA AI RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4) - 本地去背景模型
- [remove.bg](https://www.remove.bg/) - 云端去背景 API
