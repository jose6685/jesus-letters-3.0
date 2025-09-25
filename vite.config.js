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
        drop_console: true,
        drop_debugger: true,
        // 移除未使用的代碼
        dead_code: true,
        // 優化條件表達式
        conditionals: true,
        // 優化布爾值
        booleans: true
      },
      mangle: {
        // 保留類名（用於調試）
        keep_classnames: false,
        keep_fnames: false
      }
    },
    // 構建目標
    target: 'es2015',
    // 資源內聯閾值 (4KB)
    assetsInlineLimit: 4096,
    // 啟用CSS代碼分割
    cssCodeSplit: true,
    // 生成source map (開發時)
    sourcemap: process.env.NODE_ENV === 'development'
  },
  server: {
    port: 3001,
    host: true,
    // 開發服務器優化
    hmr: {
      overlay: true
    }
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
  },
  // 預覽服務器配置
  preview: {
    port: 3000,
    host: true
  }
})