import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import express from 'express';

// CORS 配置
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3001',
      'https://jesus-letters-3-0-dxwc1yoi4-jose6685-6249s-projects.vercel.app',
      'https://jesus-letters-3-0-6p3m69woq-jose6685-6249s-projects.vercel.app',
      'https://jesus-letters-3-0.vercel.app'
    ];
    
    // 允許沒有 origin 的請求（如移動應用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('不被 CORS 政策允許'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// 通用速率限制
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分鐘
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每個IP 100個請求
  message: {
    error: '請求過於頻繁，請稍後再試',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI API 專用速率限制（更嚴格）
const aiLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1分鐘
  max: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 10, // 限制每個IP 10個AI請求
  message: {
    error: 'AI請求過於頻繁，請稍後再試',
    retryAfter: Math.ceil((parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 60000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helmet 安全配置
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://api.openai.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
};

// 安全中間件設置函數
export const setupSecurity = (app) => {
  // 基本安全頭部
  if (process.env.HELMET_ENABLED !== 'false') {
    app.use(helmet(helmetConfig));
  }

  // CORS
  app.use(cors(corsOptions));

  // 速率限制
  if (process.env.RATE_LIMITING_ENABLED !== 'false') {
    app.use(generalLimiter);
    app.use('/api/ai', aiLimiter);
  }

  // 請求體大小限制
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
};

export {
  corsOptions,
  generalLimiter,
  aiLimiter
};