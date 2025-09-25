import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    // 代碼分割優化
    rollupOptions: {
      output: {
        // 手動分割代碼塊
        manualChunks: {
          // Vue核心庫
          'vue-vendor': ['vue'],
          // AI服務相關
          'ai-services': [
            './src/services/SimplifiedAIService.js'
          ],
          // Capacitor相關
          'capacitor-vendor': ['@capacitor/core', '@capacitor/app'],
          // 工具庫
          'utils': [
            './src/services/StorageService.js',
            './src/services/PWAService.js',
            './src/services/CapacitorService.js'
          ]
        },
        // 文件命名策略
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 壓縮選項
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除console.log (生產環境)
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        // 移除未使用的代碼
        pure_funcs: ['console.log']
      },
      mangle: {
        // 保留類名
        keep_classnames: true,
        // 保留函數名
        keep_fnames: true
      },
      format: {
        // 移除註釋
        comments: false
      }
    },
    // 生成source map用於調試
    sourcemap: process.env.NODE_ENV !== 'production',
    // 設置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 資源內聯限制
    assetsInlineLimit: 4096,
    // 構建目標
    target: 'es2015',
    // 啟用CSS代碼分割
    cssCodeSplit: true
  },
  // 開發服務器配置
  server: {
    port: 3001,
    host: true,
    cors: true,
    // 開發服務器優化
    hmr: {
      overlay: true
    }
  },
  // 預覽服務器配置
  preview: {
    port: 3000,
    host: true
  },
  // 優化依賴預構建
  optimizeDeps: {
    include: [
      'vue',
      '@capacitor/core',
      '@capacitor/app'
    ],
    exclude: [
      // 排除大型庫的預構建
    ]
  },
  // CSS優化
  css: {
    // CSS模塊化
    modules: {
      localsConvention: 'camelCase'
    },
    // PostCSS配置
    postcss: {
      plugins: [
        // 自動添加瀏覽器前綴
        autoprefixer({
          overrideBrowserslist: [
            '> 1%',
            'last 2 versions',
            'not dead',
            'not ie 11'
          ]
        })
      ]
    }
  }
})