import { GoogleGenerativeAI } from '@google/generative-ai';

// Create instance only if key present
const genAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;

export default async function handler(req, res) {
  // Basic CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      message: '🤖 AI endpoint',
      version: '3.0.0',
      endpoints: { generate: 'POST /api/ai' }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST for generation' });
  }

  const { question, context } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing question field (string)' });
  }

  if (!genAI) {
    return res.status(503).json({ error: 'Service Unavailable', message: 'AI key not configured' });
  }

  try {
    // Keep the AI calling logic minimal and serverless-friendly.
    // If you have robust logic, paste it here — but do not import ../server/* paths.
    const prompt = `
請以耶穌的角度、繁體中文回答問題：
問題：${question}
背景：${context || ''}
請以 JSON 格式回傳（或可回傳文字），但此處示範為簡單文字回應。
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({
      success: true,
      message: text,
      question,
      context: context || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'AI generation failed' });
  }
}