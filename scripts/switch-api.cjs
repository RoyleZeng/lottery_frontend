#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

const configs = {
    local: {
        description: '本地开发 (localhost:8000)',
        content: '# 本地开发配置\nVITE_APP_TITLE=抽獎系統 - 本地開發\n'
    },
    production: {
        description: '线上API (140.120.40.192)',
        content: '# 测试线上API配置\nVITE_APP_TITLE=抽獎系統 - 測試線上API\nVITE_FORCE_API_URL=http://140.120.40.192\n'
    },
    custom: {
        description: '自定义API地址',
        content: '# 自定义API配置\nVITE_APP_TITLE=抽獎系統 - 自定義API\n# VITE_FORCE_API_URL=http://your-custom-api.com\n'
    }
};

function showUsage() {
    console.log('🔧 API配置切换工具\n');
    console.log('使用方法: node scripts/switch-api.js [配置名称]\n');
    console.log('可用配置:');
    Object.keys(configs).forEach(key => {
        console.log(`  ${key.padEnd(12)} - ${configs[key].description}`);
    });
    console.log('\n示例:');
    console.log('  node scripts/switch-api.js local      # 切换到本地开发');
    console.log('  node scripts/switch-api.js production # 切换到线上API');
    console.log('  node scripts/switch-api.js custom     # 生成自定义配置模板');
}

function switchConfig(configName) {
    const config = configs[configName];
    if (!config) {
        console.error(`❌ 未知配置: ${configName}`);
        showUsage();
        process.exit(1);
    }

    try {
        fs.writeFileSync(envPath, config.content);
        console.log(`✅ 已切换到: ${config.description}`);
        console.log(`📝 配置文件: ${envPath}`);
        console.log('\n⚠️  请重启开发服务器使配置生效:');
        console.log('   npm run dev');
    } catch (error) {
        console.error('❌ 写入配置文件失败:', error.message);
        process.exit(1);
    }
}

// 主程序
const configName = process.argv[2];

if (!configName) {
    showUsage();
    process.exit(0);
}

switchConfig(configName); 