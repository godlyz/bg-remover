# Cloudflare Pages 部署指南

## 自动部署（推荐）

1. 连接 GitHub 仓库：https://github.com/godlyz/bg-remover
2. 配置构建设置：
   - **构建命令**：`pnpm build`
   - **输出目录**：`.next`
   - **Node.js 版本**：18（或更高）
3. 配置环境变量：
   - `REMOVEBG_API_KEY`：你的 remove.bg API Key
4. 保存并自动部署

## 手动部署

```bash
pnpm build
npx wrangler pages deploy .next
```

## 自定义域名

1. 在 Cloudflare Pages 项目设置中添加自定义域名
2. 配置 DNS 记录指向 Cloudflare
3. 等待 SSL 证书自动签发

## 注意事项

- API Routes (`/api/remove-bg`) 需要 Cloudflare Pages 支持 Serverless Functions
- 如果 API Routes 不可用，需要单独部署到 Cloudflare Workers
- 免费版 API Routes 有执行时间限制（CPU time），移除背景功能通常不会超过

## 监控和日志

- Cloudflare Pages 提供构建日志和实时日志
- 可在 Analytics 中查看访问统计
