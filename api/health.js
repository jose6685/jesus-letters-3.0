module.exports = function handler(req, res) {
  // 設置 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只允許 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: '方法不允許',
      message: '健康檢查端點只支持 GET 請求'
    })
  }

  // 返回健康狀態
  res.status(200).json({
    status: 'healthy',
    message: '🙏 耶穌的信 3.0 API 服務正常運行',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'production'
  })
}