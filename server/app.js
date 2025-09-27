import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'

// 路由導入
import aiRoutes from './routes/ai.js'
import healthRoutes from './routes/health.js'

// 中間件導入
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/logger.js'
import { setupSecurity, generalLimiter } from './middleware/security.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 配置環境變量 - 從父目錄載入 .env 檔案
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()
const PORT = process.env.PORT || 3001  // 使用環境變數或預設 3001 端口

// 設置安全中間件（包含CORS配置）
setupSecurity(app)

// 自定義中間件
app.use(requestLogger)

// 靜態文件服務（如果需要）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')))
}

// 路由設置
app.use('/api/health', healthRoutes)
app.use('/api/ai', aiRoutes)

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '耶穌的信 3.0 API',
    version: '3.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      ai: '/api/ai/generate'
    }
  })
})

// 基本中間件已在 setupSecurity 中配置

// 404處理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '端點不存在',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  })
})

// 錯誤處理中間件（必須放在最後）
app.use(notFoundHandler)
app.use(globalErrorHandler)

// 優雅關閉處理
process.on('SIGTERM', () => {
  console.log('🛑 收到SIGTERM信號，正在優雅關閉服務器...')
  server.close(() => {
    console.log('✅ 服務器已關閉')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🛑 收到SIGINT信號，正在優雅關閉服務器...')
  server.close(() => {
    console.log('✅ 服務器已關閉')
    process.exit(0)
  })
})

// 未捕獲的異常處理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕獲的異常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未處理的Promise拒絕:', reason)
  console.error('Promise:', promise)
  process.exit(1)
})

// 啟動服務器（僅在非 Vercel 環境中）
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 耶穌的信 3.0 API服務器運行在端口 ${PORT}`)
    console.log(`📍 環境: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🌐 本地訪問: http://localhost:${PORT}`)
    console.log(`📊 健康檢查: http://localhost:${PORT}/api/health`)
    console.log(`🤖 AI服務: http://localhost:${PORT}/api/ai/generate`)
  })
}

export default app