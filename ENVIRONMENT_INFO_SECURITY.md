# 环境信息安全性说明

## 🔒 安全设计

环境信息组件采用多重安全检查，确保敏感的开发信息不会在生产环境中泄露。

## 🛡️ 多重检查机制

### 1. 父组件级别检查 (HomeView.vue)

```javascript
const isDevelopment = computed(() => {
  // 严格检查：必须是开发模式且在localhost
  return (
    import.meta.env.DEV &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0")
  );
});
```

### 2. 组件级别检查 (EnvironmentInfo.vue)

```javascript
const shouldShowEnvironmentInfo = computed(() => {
  return (
    import.meta.env.DEV &&
    import.meta.env.MODE === "development" &&
    (hostname.value === "localhost" ||
      hostname.value === "127.0.0.1" ||
      hostname.value === "0.0.0.0")
  );
});
```

### 3. 模板级别检查

```vue
<!-- 双重检查：只在开发环境显示 -->
<div v-if="shouldShowEnvironmentInfo" class="environment-info">
```

## 📋 显示条件矩阵

| 环境      | DEV      | MODE        | hostname    | 显示环境信息 |
| --------- | -------- | ----------- | ----------- | ------------ |
| 本地开发  | ✅ true  | development | localhost   | ✅ **显示**  |
| 本地开发  | ✅ true  | development | 127.0.0.1   | ✅ **显示**  |
| 生产构建  | ❌ false | production  | localhost   | ❌ 隐藏      |
| 线上部署  | ❌ false | production  | example.com | ❌ 隐藏      |
| 开发+远程 | ✅ true  | development | example.com | ❌ 隐藏      |

## 🔍 安全验证

### 开发环境测试

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
# ✅ 应该显示环境信息面板
```

### 生产环境测试

```bash
# 构建生产版本
npm run build

# 启动预览服务器
npm run preview

# 访问 http://localhost:4173
# ❌ 不应该显示环境信息面板
```

### 远程部署测试

```bash
# 部署到线上服务器
# 访问 https://your-domain.com
# ❌ 不应该显示环境信息面板
```

## 🚨 安全保证

1. **开发信息隔离**: 环境信息只在本地开发时显示
2. **生产环境清洁**: 生产构建不包含敏感开发信息
3. **域名限制**: 即使在开发模式，也只在 localhost 显示
4. **多重验证**: 三层检查确保万无一失

## 📝 最佳实践

### ✅ 安全的做法

- 使用多重条件检查
- 限制显示域名范围
- 区分开发和生产模式
- 在生产构建中完全移除调试信息

### ❌ 避免的做法

- 仅依赖单一环境变量
- 在生产环境显示敏感信息
- 硬编码调试信息
- 忽略域名检查

## 🔧 自定义配置

如果需要在其他域名显示环境信息（如内网测试），可以修改检查条件：

```javascript
const shouldShowEnvironmentInfo = computed(() => {
  const allowedHosts = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "192.168.1.100", // 添加内网IP
  ];

  return (
    import.meta.env.DEV &&
    import.meta.env.MODE === "development" &&
    allowedHosts.includes(hostname.value)
  );
});
```

## 📞 安全审计

定期检查以下项目：

1. 生产环境是否显示环境信息
2. 控制台是否输出敏感信息
3. 网络请求是否暴露开发配置
4. 源码是否包含调试代码

确保生产环境的安全性和专业性。
