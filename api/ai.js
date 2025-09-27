import { GoogleGenerativeAI } from '@google/generative-ai'

// 初始化 Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || 'demo-key')

export default async function handler(req, res) {
  // 設置 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 處理 GET 請求 - 返回 API 信息
  if (req.method === 'GET') {
    return res.status(200).json({
      message: '🤖 耶穌的信 3.0 AI 服務',
      version: '3.0.0',
      endpoints: {
        generate: 'POST /api/ai',
        status: 'GET /api/ai'
      },
      example: {
        method: 'POST',
        body: {
          question: '我該如何面對困難？',
          context: '最近工作壓力很大'
        }
      }
    })
  }

  // 只允許 POST 請求進行 AI 生成
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: '方法不允許',
      message: 'AI 生成端點只支持 POST 請求'
    })
  }

  try {
    const { question, context } = req.body

    // 驗證輸入
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: '無效的請求',
        message: '請提供有效的問題內容'
      })
    }

    // 檢查 API 密鑰
    if (!process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY === 'demo-key') {
      return res.status(503).json({
        error: '服務暫時不可用',
        message: 'AI 服務配置不完整，請稍後再試'
      })
    }

    // 構建提示詞
    const prompt = `
作為一位充滿愛心和智慧的屬靈導師，請以耶穌基督的愛和聖經的教導來回應以下問題。

問題：${question}
${context ? `背景：${context}` : ''}

請提供：
1. 溫暖的理解和同理心
2. 相關的聖經經文和教導
3. 實用的屬靈建議
4. 鼓勵和希望的話語

請用繁體中文回應，語調要溫和、充滿愛心，就像耶穌親自在回應一樣。
`

    // 調用 Google AI
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // 返回結果
    res.status(200).json({
      success: true,
      message: text,
      timestamp: new Date().toISOString(),
      question: question,
      context: context || null
    })

  } catch (error) {
    console.error('AI 服務錯誤:', error)
    
    res.status(500).json({
      error: '內部服務器錯誤',
      message: 'AI 服務暫時不可用，請稍後再試',
      timestamp: new Date().toISOString()
    })
  }
}