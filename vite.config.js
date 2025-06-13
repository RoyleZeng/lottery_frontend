import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://140.120.40.192',
                changeOrigin: true,
                // The backend doesn't expect /api prefix, so we need to remove it
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
}) 