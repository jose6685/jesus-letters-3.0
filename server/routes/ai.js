import express from 'express'
import cors from 'cors'
import { aiService } from '../services/aiService.js' // 假設你的 AI 服務在這裡

const router = express.Router()

// CORS 設置
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
}
router.use(cors(corsOptions))

// 中間件
router.use(express.json({ limit: '10mb' }))
router.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 根路由 - API 資訊
router.get('/', (req, res) => {
  return res.status(200).json({
    message: '耶穌的信 3.0 AI API 服務',
    version: '3.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      generate: '/generate',
      status: '/status',
      test: '/test'
    }
  })
})

// POST /generate - AI 回應
router.post('/generate', async (req, res) => {
  try {
    const { userInput } = req.body
    if (!userInput) {
      return res.status(400).json({ error: '缺少 userInput' })
    }

    const aiResponse = await aiService.generateResponse(userInput)
    return res.status(200).json({ userInput, aiResponse, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('❌ AI 服務錯誤:', error)
    return res.status(500).json({ error: 'AI 服務錯誤', details: error.message })
  }
})

// GET /status - AI 狀態
router.get('/status', (req, res) => {
  return res.status(200).json({
    gemini: true,
    openai: true,
    initialized: true,
    preferredService: 'openai'
  })
})

// GET /test - 測試用
router.get('/test', (req, res) => {
  return res.status(200).json({ message: 'AI 測試成功' })
})

export default router