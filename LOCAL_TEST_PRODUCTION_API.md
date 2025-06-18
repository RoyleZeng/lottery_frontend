# 本地测试线上 API 指南

## 🎯 使用场景

当您需要在本地开发环境中测试线上 API 时，可以使用以下方法：

- 测试线上数据的兼容性
- 调试生产环境的 API 响应
- 验证前端与线上后端的集成

## 🚀 快速开始

### 1. 切换到线上 API

```bash
npm run api:production
```

### 2. 重启开发服务器

```bash
npm run dev
```

### 3. 验证配置

访问 `http://localhost:5173`，在首页可以看到环境信息显示：

- ⚠️ 强制 API: 使用线上 API 进行测试
- API 基础 URL: http://140.120.40.192 (强制使用线上 API)

## 📋 所有可用命令

| 命令                     | 说明           | API 地址                  |
| ------------------------ | -------------- | ------------------------- |
| `npm run api:local`      | 本地开发       | localhost:8000 (通过代理) |
| `npm run api:production` | 线上 API       | http://140.120.40.192     |
| `npm run api:custom`     | 自定义配置模板 | 需要手动编辑              |
| `npm run api:help`       | 显示帮助信息   | -                         |

## 🔧 手动配置方法

如果您需要测试其他 API 地址，可以手动创建 `.env` 文件：

```bash
# .env
VITE_APP_TITLE=抽獎系統 - 自定義測試
VITE_FORCE_API_URL=http://your-custom-api.com
```

## 🔍 环境检测优先级

系统按以下优先级选择 API 配置：

1. **VITE_FORCE_API_URL** (最高优先级)

   - 如果设置了此变量，使用 `${VITE_FORCE_API_URL}/api`
   - 忽略所有其他环境判断
   - 例如：`http://140.120.40.192/api`

2. **开发环境 + localhost**

   - `import.meta.env.DEV === true` 或 `hostname === 'localhost'`
   - 使用代理配置：`/api` → `http://localhost:8000` (代理移除 `/api` 前缀)

3. **生产环境**
   - 使用 `${VITE_API_BASE_URL}/api` 或默认的 `http://140.120.40.192/api`

## 🔗 API 路径说明

### 重要：API 前缀差异

- **本地 API**: `http://localhost:8000/auth/login` (无 `/api` 前缀)
- **线上 API**: `http://140.120.40.192/api/auth/login` (有 `/api` 前缀)

### 前端统一调用方式

前端代码统一使用 `/api/` 前缀调用：

```javascript
// 前端代码中统一这样调用
api.post("/api/auth/login", { email, password });
```

### 自动路径处理

- **本地环境**: Vite 代理自动移除 `/api` 前缀

  - 调用: `/api/auth/login`
  - 实际: `http://localhost:8000/auth/login`

- **线上环境**: 保留 `/api` 前缀
  - 调用: `/api/auth/login`
  - 实际: `http://140.120.40.192/api/auth/login`

## ⚠️ 注意事项

### CORS 问题

线上 API 可能有 CORS 限制，如果遇到跨域问题：

1. **联系后端开发者**添加您的本地地址到 CORS 白名单
2. **使用浏览器插件**临时禁用 CORS 检查（仅开发时）
3. **配置代理**通过后端服务器代理请求

### 认证问题

- 确保线上 API 的认证机制与本地一致
- 检查 JWT token 的有效性和格式
- 验证 API 端点路径是否正确

### 网络问题

- 确保能够访问线上 API 地址
- 检查防火墙和网络代理设置
- 验证 API 服务器是否正常运行

## 🔄 切换流程示例

```bash
# 1. 查看当前可用配置
npm run api:help

# 2. 切换到线上API测试
npm run api:production

# 3. 重启开发服务器
npm run dev

# 4. 在浏览器中验证配置
# 访问 http://localhost:5173
# 查看首页的环境信息面板

# 5. 进行测试...

# 6. 测试完成后切换回本地开发
npm run api:local

# 7. 重启开发服务器
npm run dev
```

## 🐛 故障排除

### 配置未生效

- 确保重启了开发服务器
- 检查 `.env` 文件内容是否正确
- 清除浏览器缓存

### API 调用失败

- 检查网络连接
- 验证 API 地址是否正确
- 查看浏览器开发者工具的网络面板
- 检查控制台错误信息

### 环境信息不显示

- 环境信息面板仅在开发环境显示
- 确保 `import.meta.env.DEV === true`

## 📞 获取帮助

如果遇到问题，可以：

1. 查看浏览器控制台的 API 配置信息
2. 检查 `.env` 文件内容
3. 运行 `npm run api:help` 查看可用选项
4. 查看 `API_CONFIG.md` 了解详细配置说明
