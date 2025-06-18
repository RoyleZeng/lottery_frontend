# API 配置说明

## 环境自动判断机制

系统会自动判断当前运行环境并选择合适的 API 配置：

### 判断逻辑

```javascript
// 1. 检查是否为开发模式
const isDevelopment = import.meta.env.DEV;

// 2. 检查是否运行在本地主机
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "0.0.0.0";

// 3. 根据环境选择API配置
if (isDevelopment || isLocalhost) {
  // 开发环境：使用代理
  baseURL = "/api";
} else {
  // 生产环境：使用直接URL
  baseURL = VITE_API_BASE_URL || "http://140.120.40.192";
}
```

### 环境检测结果

- **开发环境**: `npm run dev` 时，`import.meta.env.DEV = true`
- **生产环境**: `npm run build` 后，`import.meta.env.DEV = false`
- **本地主机**: hostname 为 `localhost`、`127.0.0.1` 或 `0.0.0.0`
- **远程主机**: 其他域名或 IP 地址

## 本地开发环境

### 后端服务器

- **地址**: `http://localhost:8000`
- **登录端点**: `http://localhost:8000/auth/login`
- **Swagger 文档**: `http://localhost:8000/spec/swagger.json`

### 前端配置

- **开发服务器**: `http://localhost:5173`
- **API 代理**: `/api/*` → `http://localhost:8000/*`

### 工作原理

#### 本地开发环境

1. 前端应用运行在 `http://localhost:5173`
2. 系统检测到 `hostname === 'localhost'` 和 `import.meta.env.DEV === true`
3. 自动使用代理配置：`baseURL = '/api'`
4. 所有以 `/api/` 开头的请求会被 Vite 代理到 `http://localhost:8000`
5. **代理会自动移除 `/api` 前缀**，所以：
   - 前端调用: `/api/auth/login`
   - 实际请求: `http://localhost:8000/auth/login` (无 `/api` 前缀)

#### 线上环境

1. 前端应用部署在线上服务器
2. 系统检测到非 localhost 域名
3. 自动使用直接 API 调用：`baseURL = 'http://140.120.40.192/api'`
4. **保留 `/api` 前缀**，所以：
   - 前端调用: `/api/auth/login`
   - 实际请求: `http://140.120.40.192/api/auth/login` (保留 `/api` 前缀)

### 测试步骤

1. 确保后端服务器在 `http://localhost:8000` 运行
2. 启动前端开发服务器: `npm run dev`
3. 访问 `http://localhost:5173` 进行测试

### API 端点映射

#### 本地开发环境 (通过代理)

| 前端调用                                | 实际请求                                                 |
| --------------------------------------- | -------------------------------------------------------- |
| `/api/auth/login`                       | `http://localhost:8000/auth/login`                       |
| `/api/lottery/events`                   | `http://localhost:8000/lottery/events`                   |
| `/api/lottery/events/{id}`              | `http://localhost:8000/lottery/events/{id}`              |
| `/api/lottery/events/{id}/participants` | `http://localhost:8000/lottery/events/{id}/participants` |

#### 线上环境 (直接调用)

| 前端调用                                | 实际请求                                                     |
| --------------------------------------- | ------------------------------------------------------------ |
| `/api/auth/login`                       | `http://140.120.40.192/api/auth/login`                       |
| `/api/lottery/events`                   | `http://140.120.40.192/api/lottery/events`                   |
| `/api/lottery/events/{id}`              | `http://140.120.40.192/api/lottery/events/{id}`              |
| `/api/lottery/events/{id}/participants` | `http://140.120.40.192/api/lottery/events/{id}/participants` |

## 本地测试线上 API

如果您想在本地环境测试线上的 API，有以下几种方法：

### 方法一：使用快捷命令（推荐）

```bash
# 切换到线上API
npm run api:production

# 切换回本地开发
npm run api:local

# 查看所有可用配置
npm run api:help
```

### 方法二：手动创建.env 文件

创建 `.env` 文件并添加强制 API 配置：

```bash
# .env 文件
VITE_APP_TITLE=抽獎系統 - 測試線上API
VITE_FORCE_API_URL=http://140.120.40.192
```

### 方法三：临时环境变量

```bash
# 临时设置环境变量启动
VITE_FORCE_API_URL=http://140.120.40.192 npm run dev
```

## 生产环境

### 环境变量配置

创建 `.env` 文件来配置生产环境的 API 地址：

```bash
# .env 文件
VITE_API_BASE_URL=http://140.120.40.192
```

### 部署配置

1. **构建应用**: `npm run build`
2. **环境检测**: 系统检测到非 localhost 域名，自动使用生产 API
3. **API 调用**: 直接调用 `http://140.120.40.192/auth/login`

### 调试信息

#### 控制台输出

系统会在浏览器控制台输出当前环境信息：

```
🔧 API Configuration:
  - Environment: Development/Production
  - Hostname: localhost/your-domain.com
  - API Base URL: /api 或 http://140.120.40.192
```

#### 环境信息面板

在开发环境中，首页会显示详细的环境信息面板，显示条件：

- ✅ `import.meta.env.DEV === true` (Vite 开发模式)
- ✅ `import.meta.env.MODE === 'development'` (开发模式)
- ✅ `hostname` 为 `localhost`、`127.0.0.1` 或 `0.0.0.0`

**只有同时满足以上三个条件，环境信息面板才会显示。**

### 注意事项

- 开发环境使用代理，生产环境直接调用 API
- 确保后端服务器支持 CORS 或在同一域名下部署
- 认证使用 Bearer Token，存储在 localStorage 中
- 环境信息面板仅在开发环境的 localhost 显示，生产环境完全隐藏
- 部署到线上时，环境信息不会泄露给用户
