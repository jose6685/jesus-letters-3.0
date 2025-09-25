/**
 * 錯誤處理中間件
 */

import fs from 'fs'
import path from 'path'

// 生成請求ID
function generateRequestId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// 錯誤日誌記錄
function logError(error, req, additionalInfo = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: req.id || generateRequestId(),
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN_ERROR',
      status: error.status || error.statusCode || 500
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      headers: filterSensitiveHeaders(req.headers)
    },
    ...additionalInfo
  }

  // 寫入錯誤日誌文件
  const logDir = path.join(process.cwd(), 'logs')
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`)
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')

  // 控制台輸出
  console.error(`❌ [${logEntry.requestId}] 錯誤發生:`, {
    message: error.message,
    code: error.code,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  })
}

// 過濾敏感請求頭
function filterSensitiveHeaders(headers) {
  const filtered = { ...headers }
  const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'x-auth-token']
  
  sensitiveKeys.forEach(key => {
    if (filtered[key]) {
      filtered[key] = '[FILTERED]'
    }
  })
  
  return filtered
}

/**
 * 404 錯誤處理器
 */
export function notFoundHandler(req, res, next) {
  const error = new Error(`找不到路徑: ${req.originalUrl}`)
  error.status = 404
  error.code = 'NOT_FOUND'
  
  logError(error, req, { type: 'NOT_FOUND' })
  
  res.status(404).json({
    error: '找不到請求的資源',
    message: `路徑 ${req.originalUrl} 不存在`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    requestId: req.id || generateRequestId()
  })
}

/**
 * 全局錯誤處理器
 */
export function globalErrorHandler(err, req, res, next) {
  // 設置默認錯誤狀態碼
  const statusCode = err.status || err.statusCode || 500
  const errorCode = err.code || 'INTERNAL_ERROR'
  const requestId = req.id || generateRequestId()
  
  // 記錄錯誤日誌
  logError(err, req, { 
    type: 'GLOBAL_ERROR',
    statusCode,
    errorCode
  })

  // 根據錯誤類型處理
  let errorResponse = {
    error: '服務器內部錯誤',
    message: err.message || '發生未知錯誤',
    code: errorCode,
    timestamp: new Date().toISOString(),
    requestId
  }

  // 根據不同錯誤類型自定義回應
  switch (errorCode) {
    case 'VALIDATION_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '輸入驗證失敗',
        details: err.details || [],
        suggestion: '請檢查輸入格式是否正確'
      }
      break

    case 'AI_SERVICE_ERROR':
      errorResponse = {
        ...errorResponse,
        error: 'AI服務暫時不可用',
        message: '請稍後再試，或聯繫技術支持',
        suggestion: '檢查網絡連接或稍後重試'
      }
      break

    case 'RATE_LIMIT_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '請求過於頻繁',
        retryAfter: err.retryAfter || 60,
        suggestion: '請等待一段時間後再試'
      }
      break

    case 'AUTHENTICATION_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '身份驗證失敗',
        suggestion: '請檢查認證信息'
      }
      break

    case 'AUTHORIZATION_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '權限不足',
        suggestion: '您沒有執行此操作的權限'
      }
      break

    case 'TIMEOUT_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '請求超時',
        suggestion: '請求處理時間過長，請稍後重試'
      }
      break

    case 'NETWORK_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '網絡連接錯誤',
        suggestion: '請檢查網絡連接'
      }
      break

    case 'DATABASE_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '數據庫錯誤',
        suggestion: '數據存取發生問題，請稍後重試'
      }
      break

    default:
      // 生產環境不暴露詳細錯誤信息
      if (process.env.NODE_ENV === 'production') {
        errorResponse.message = '服務器發生錯誤，請稍後重試'
        delete errorResponse.stack
      }
      break
  }

  // 開發環境添加堆棧跟蹤
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack
    errorResponse.debug = {
      originalError: err.name,
      file: err.fileName,
      line: err.lineNumber
    }
  }

  // 發送錯誤回應
  res.status(statusCode).json(errorResponse)
}

/**
 * 異步錯誤包裝器
 */
export function asyncErrorHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 自定義錯誤類
 */
export class CustomError extends Error {
  constructor(message, statusCode = 500, code = 'CUSTOM_ERROR', details = null) {
    super(message)
    this.name = 'CustomError'
    this.statusCode = statusCode
    this.status = statusCode
    this.code = code
    this.details = details
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * AI服務錯誤
 */
export class AIServiceError extends CustomError {
  constructor(message, details = null) {
    super(message, 503, 'AI_SERVICE_ERROR', details)
    this.name = 'AIServiceError'
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends CustomError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}