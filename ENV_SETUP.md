# 环境变量配置

## remove.bg API Key

### 获取 API Key

1. 访问 [remove.bg](https://www.remove.bg/api)
2. 注册账号（免费注册）
3. 在 Dashboard 中获取 API Key

### 本地开发配置

创建 `.env.local` 文件：

```bash
REMOVEBG_API_KEY=your_api_key_here
```

### 部署配置

#### Cloudflare Pages

1. 进入项目 Settings → Environment variables
2. 添加环境变量：
   - Name: `REMOVEBG_API_KEY`
   - Value: 你的 API Key
3. 重新部署项目

#### Vercel

1. 进入项目 Settings → Environment Variables
2. 添加：
   - Name: `REMOVEBG_API_KEY`
   - Value: 你的 API Key
3. 重新部署

### 额度说明

- **免费版**：50 次/月（预览分辨率）
- **按量付费**：$0.05-0.20/张（根据尺寸）
- **订阅制**：$9/月起

详细定价：https://www.remove.bg/api#pricing
