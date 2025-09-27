import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'

// 導入路由
import aiRoutes from '../server/routes/ai.js'
import healthRoutes from '../server/routes/health.js'

// 導入中間件
import { globalErrorHandler, notFoundHandler } from '../server/middleware/errorHandler.js'
import { requestLogger } from '../server/middleware/logger.js'
import { setupSecurity, generalLimiter } from '../server/middleware/security.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 載入環境變數
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()

// 設置安全中間件
setupSecurity(app)

// 請求日誌
app.use(requestLogger)

// 靜態文件服務（生產環境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
}

// API 路由
app.use('/api/health', healthRoutes)
app.use('/api/ai', aiRoutes)

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '🙏 耶穌的信 3.0 API 服務',
    version: '3.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      ai: '/api/ai/generate'
    },
    example: {
      ai_endpoint: '/api/ai/generate',
      method: 'POST',
      body: {
        question: '我該如何面對困難？',
        context: '最近工作壓力很大'
      }
    }
  })
})

// 處理所有其他路由（SPA 支持）
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'API 端點不存在',
      message: '請檢查 API 路徑是否正確'
    })
  }
  
  // 對於非 API 路由，返回 index.html（SPA 支持）
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  } else {
    res.status(404).json({ message: '開發模式：請使用前端開發服務器' })
  }
})

// 錯誤處理中間件
app.use(notFoundHandler)
app.use(globalErrorHandler)

// 導出 app 供 Vercel 使用
export default app