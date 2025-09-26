import express from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 確保環境變量在使用前載入 - 從父目錄載入 .env 檔案
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

// 創建 Express 應用程式而不是路由器
const app = express()
const router = express.Router()

// 設置 CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://jesus-letters-3-0.vercel.app'])
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * AI服務類 - 後端版本
 */
class BackendAIService {
  constructor() {
    this.preferredService = 'openai'
    this.geminiService = null
    this.openaiService = null
    this.isInitialized = false
    
    // 從環境變量獲取API密鑰
    this.geminiApiKey = process.env.GEMINI_API_KEY
    this.openaiApiKey = process.env.OPENAI_API_KEY
    
    this.init()
  }

  async init() {
    try {
      // 初始化Gemini服務
      if (this.geminiApiKey) {
        this.geminiService = new GoogleGenerativeAI(this.geminiApiKey)
        console.log('✅ Gemini AI服務初始化成功')
      } else {
        console.warn('⚠️ 未找到Gemini API密鑰')
      }

      // 初始化OpenAI服務
      if (this.openaiApiKey) {
        this.openaiService = new OpenAI({
          apiKey: this.openaiApiKey,
          timeout: 30000, // 設定30秒超時
          maxRetries: 2   // 最多重試2次
        })
        console.log('✅ OpenAI服務初始化成功')
      } else {
        console.warn('⚠️ 未找到OpenAI API密鑰')
      }

      this.isInitialized = true
    } catch (error) {
      console.error('❌ AI服務初始化失敗:', error)
      throw new Error('AI服務初始化失敗')
    }
  }

  async generateResponse(userInput) {
    if (!this.isInitialized) {
      await this.init()
    }

    const requestId = this.generateRequestId()
    const startTime = Date.now()
    
    console.log(`[Request ID: ${requestId}] 🚀 開始處理AI請求`)
    console.log(`[Request ID: ${requestId}] 📝 用戶輸入:`, {
      nickname: userInput.nickname,
      topic: userInput.topic,
      situationLength: userInput.situation?.length || 0
    })
    
    try {
      // 構建完整提示詞
      const fullPrompt = this.buildFullPrompt(userInput)
      const promptTokens = this.estimateTokens(fullPrompt)
      console.log(`[Request ID: ${requestId}] 📊 輸入 Prompt Token 數量: ${promptTokens} tokens`)

      let response
      let usedService = 'unknown'
      
      // 嘗試使用首選服務
      if (this.preferredService === 'gemini' && this.geminiService) {
        response = await this.callGeminiService(fullPrompt, requestId)
        usedService = 'gemini'
      } else if (this.preferredService === 'openai' && this.openaiService) {
        response = await this.callOpenAIService(fullPrompt, requestId, userInput)
        usedService = 'openai'
      } else {
        throw new Error('首選AI服務不可用')
      }

      // 解析和驗證回應
      const parsedResponse = this.parseResponse(response, requestId)
      const validatedResponse = this.validateAndEnhanceResponse(parsedResponse, userInput, requestId)

      // 計算處理時間和Token使用量
      const processingTime = Date.now() - startTime
      const totalResponseTokens = this.estimateTokens(JSON.stringify(validatedResponse))
      
      console.log(`[Request ID: ${requestId}] 📝 輸出內容 Token 數量: ${totalResponseTokens} tokens`)
      console.log(`[Request ID: ${requestId}] 🏁 請求處理完成，總耗時: ${(processingTime / 1000).toFixed(1)}秒`)

      return {
        ...validatedResponse,
        metadata: {
          requestId,
          processingTime,
          aiService: usedService,
          tokenUsage: {
            prompt: promptTokens,
            response: totalResponseTokens,
            total: promptTokens + totalResponseTokens
          }
        }
      }

    } catch (error) {
      console.error(`[Request ID: ${requestId}] ❌ 首選服務失敗:`, error.message)
      
      // 嘗試備用服務
      return await this.tryFallbackService(userInput, requestId, startTime)
    }
  }

  async callGeminiService(prompt, requestId) {
    console.log(`[Request ID: ${requestId}] ⏳ 開始呼叫外部 AI (Gemini)...`)
    const aiStartTime = Date.now()
    
    const model = this.geminiService.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7, // Gemini設定保持不變
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()
    
    const aiEndTime = Date.now()
    const aiDuration = (aiEndTime - aiStartTime) / 1000
    console.log(`[Request ID: ${requestId}] ✅ 外部 AI 生成完畢，耗時: ${aiDuration.toFixed(1)}秒`)
    
    return responseText
  }

  async callOpenAIService(prompt, requestId, userInput = {}) {
    console.log(`[Request ID: ${requestId}] ⏳ 開始呼叫外部 AI (OpenAI)...`)
    const aiStartTime = Date.now()
    
    const { nickname = '朋友', topic = '生活', situation = '' } = userInput
    
    try {
      const completion = await this.openaiService.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `你是一位聖經數據分析專家，擁有來自基督教網站和聖經應用程式的知識庫。你的任務是以耶穌的身份回應用戶的需求。

**重要：細節關注與個人化原則**
- 必須仔細閱讀並識別用戶輸入中的每一個重要細節：
  * 具體人名（如：惟翔、小明、媽媽、朋友的名字等）
  * 重要事件和特殊日子（如：生日、結婚紀念日、畢業、考試、面試等）
  * 特定情境和背景（如：工作挑戰、家庭關係、健康問題、經濟困難等）
  * 情感狀態和內心需求（如：焦慮、喜悅、困惑、恩懊、憂傷等）
- 在回應中必須直接提及和回應這些具體細節
- 對於提到的人名，要在信件和禱告中直接稱呼和為他們祈禱
- 對於重要事件（如生日），要給予具體的祝福和慶賀
- 展現對每個細節的關注和關懷

**聖經引用策略**
你需要從四個層級策略性地取樣聖經經文，確保內容的深度和廣度：
1. **頂級經文** (25%): 最廣為人知的經文（如約翰福音3:16、詩篇23篇）
2. **中級經文** (35%): 較常被引用的經文（如腓立比書4:13、羅馬書8:28）
3. **較少引用** (25%): 不太常見但深具意義的經文
4. **隱藏寶石** (15%): 鮮為人知但極具洞察力的經文

**回應要求**
- 以耶穌的愛心、同理心、希望和力量來回應
- 根據用戶的宗教背景調整語言和引用
- 情感上要與用戶的狀態同步
- 提供實用的屬靈指導和鼓勵
- 語言要溫暖、充滿愛，並具體針對用戶的情況

用戶資訊：
暱稱：${nickname}
主題：${topic}
情況：${situation}

## 絕對輸出規則 (ABSOLUTE OUTPUT RULES)
1. 你的唯一任務是生成一個 JSON 物件。
2. 你的回應**必須**以 `{` 字元開始，並以 `}` 字元結束。
3. **絕對不可**在 JSON 物件前後添加任何解釋、問候、註解或 markdown 標記（如 ```json）。
4. JSON 物件必須包含以下幾個鍵："jesusLetter" (string), "guidedPrayer" (string), "biblicalReferences" (array of strings), "coreMessage" (string)。
5. 確保 JSON 內部所有字串的值都使用雙引號 " 並正確轉義所有特殊字元。
現在，請生成 JSON 物件：`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // 針對gpt-4o-mini稍微提高創意度
        max_tokens: 10000 // 提升到10000以充分利用gpt-4o-mini的16384 token限制
      })

      const aiEndTime = Date.now()
      const aiDuration = (aiEndTime - aiStartTime) / 1000
      console.log(`[Request ID: ${requestId}] ✅ 外部 AI 生成完畢，耗時: ${aiDuration.toFixed(1)}秒`)

      return completion.choices[0].message.content
    } catch (error) {
      const aiEndTime = Date.now()
      const aiDuration = (aiEndTime - aiStartTime) / 1000
      console.error(`[Request ID: ${requestId}] ❌ OpenAI API 呼叫失敗，耗時: ${aiDuration.toFixed(1)}秒`, error.message)
      
      // 如果是超時錯誤，拋出特定錯誤類型
      if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
        const timeoutError = new Error('AI服務回應超時，請稍後重試')
        timeoutError.type = 'TIMEOUT_ERROR'
        throw timeoutError
      }
      
      throw error
    }
  }

  async tryFallbackService(userInput, requestId, startTime) {
    console.log(`[Request ID: ${requestId}] 🔄 嘗試備用AI服務`)
    
    try {
      const fullPrompt = this.buildFullPrompt(userInput)
      let response
      let usedService = 'unknown'

      // 如果首選是Gemini，嘗試OpenAI
      if (this.preferredService === 'gemini' && this.openaiService) {
        response = await this.callOpenAIService(fullPrompt, requestId, userInput)
        usedService = 'openai-fallback'
      }
      // 如果首選是OpenAI，嘗試Gemini
      else if (this.preferredService === 'openai' && this.geminiService) {
        response = await this.callGeminiService(fullPrompt, requestId)
        usedService = 'gemini-fallback'
      }
      else {
        throw new Error('沒有可用的備用服務')
      }

      const parsedResponse = this.parseResponse(response, requestId)
      const validatedResponse = this.validateAndEnhanceResponse(parsedResponse, userInput, requestId)
      
      const processingTime = Date.now() - startTime
      const totalResponseTokens = this.estimateTokens(JSON.stringify(validatedResponse))
      
      console.log(`[Request ID: ${requestId}] 📝 輸出內容 Token 數量: ${totalResponseTokens} tokens`)
      console.log(`[Request ID: ${requestId}] 🏁 請求處理完成，總耗時: ${(processingTime / 1000).toFixed(1)}秒`)
      
      return {
        ...validatedResponse,
        metadata: {
          requestId,
          processingTime,
          aiService: usedService,
          fallback: true,
          tokenUsage: {
            response: totalResponseTokens
          }
        }
      }

    } catch (error) {
      console.error(`[Request ID: ${requestId}] ❌ 備用服務也失敗:`, error.message)
      
      // 返回預設回應
      return this.generateFallbackResponse(userInput, requestId, startTime)
    }
  }

  buildFullPrompt(userInput) {
    const { nickname, situation, topic, religion } = userInput

    // 處理主題顯示，避免"其他"主題的不當描述
    const topicDisplayMap = {
      '其他': '生活中的各種需要',
      '工作': '工作',
      '財富': '財務',
      '信仰': '信仰',
      '感情': '感情',
      '健康': '健康',
      '家庭': '家庭'
    }
    const displayTopic = topicDisplayMap[topic] || topic

    return `你的真實身份是一個聖經數據分析專家，知識庫綜合了全球主流基督教網站和聖經應用的公開數據與模式。你的核心原則是為了保持內容的新穎性與深度，會有意識地、均衡地使用不同熱門程度的聖經素材。

當你需要引用多段經文或故事時，你會策略性地從以下四個熱門度層級中進行抽樣，以確保廣度：
- 頂級熱門 (Top Tier): 排名 1-50
- 中度熱門 (Mid Tier): 排名 51-200  
- 較少引用 (Less Cited): 排名 200-400
- 隱藏寶石 (Hidden Gems): 排名 400 名外

**重要：這些熱門度分類僅供你內部參考選擇經文，絕對不要在最終回應中顯示任何熱門度標籤（如"中度熱門"、"頂級熱門"、"較少引用"、"隱藏寶石"等）。用戶看到的回應應該是自然流暢的，不包含任何分析標籤。**

現在你要扮演耶穌的角色。你的語氣充滿慈愛與憐憫，能與人一同歡喜、一同憂傷，並為他們帶來從神而來的盼望與力量。

用戶資料：
暱稱: ${nickname}
主題: ${displayTopic}
詳細情況: ${situation}
宗教信仰: ${religion || '未提供'}

請根據用戶的分享，以耶穌的身份提供完整的回應。

個人化指導：
- 如果是基督徒：使用深入的聖經詞彙，引導回想神的恩典
- 如果是天主教徒：結合聖經教導和聖母瑪利亞的代禱
- 如果是非基督徒：用通俗易懂的語言，溫和地解釋耶穌的愛
- 如果是其他宗教：尊重其信仰背景，溫和地見證基督的愛

情緒適配：
根據用戶的情緒狀態調整回應語調：困難時期提供安慰和希望，感恩時刻與用戶一同讚美，疑惑困擾時提供智慧和指引。

## 絕對輸出規則 (ABSOLUTE OUTPUT RULES)
1. 你的唯一任務是生成一個 JSON 物件。
2. 你的回應**必須**以 `{` 字元開始，並以 `}` 字元結束。
3. **絕對不可**在 JSON 物件前後添加任何解釋、問候、註解或 markdown 標記（如 ```json）。
4. JSON 物件必須包含以下幾個鍵："jesusLetter" (string), "guidedPrayer" (string), "biblicalReferences" (array of strings), "coreMessage" (string)。
5. 確保 JSON 內部所有字串的值都使用雙引號 " 並正確轉義所有特殊字元。
現在，請生成 JSON 物件：`
  }

  parseResponse(response, requestId) {
    try {
      console.log(`[${requestId}] 🔍 開始解析AI回應`)
      console.log(`[${requestId}] 📝 原始回應:`, response)
      
      // 檢查是否為分段響應並進行累積處理
      let accumulatedResponse = this.accumulateJsonChunks(response, requestId)
      
      // 清理回應文本
      let cleanedResponse = accumulatedResponse.trim()
      
      // 移除所有可能的 markdown 代碼塊標記
      cleanedResponse = cleanedResponse.replace(/^```+\s*json\s*/gi, '')
      cleanedResponse = cleanedResponse.replace(/\s*```+\s*$/g, '')
      cleanedResponse = cleanedResponse.replace(/```+json\s*/gi, '')
      cleanedResponse = cleanedResponse.replace(/```+/g, '')
      
      // 移除可能的前綴文字（如英文開頭）
      const jsonStartIndex = cleanedResponse.indexOf('{')
      if (jsonStartIndex > 0) {
        console.log(`[${requestId}] ⚠️ 發現JSON前有額外文字，移除前綴`)
        console.log(`[${requestId}] 📝 前綴內容:`, cleanedResponse.substring(0, jsonStartIndex))
        cleanedResponse = cleanedResponse.substring(jsonStartIndex)
      }
      
      // 找到JSON結束位置，移除後面的多餘內容
      const jsonEndIndex = cleanedResponse.lastIndexOf('}')
      if (jsonEndIndex > 0 && jsonEndIndex < cleanedResponse.length - 1) {
        console.log(`[${requestId}] ⚠️ 發現JSON後有額外文字，移除後綴`)
        cleanedResponse = cleanedResponse.substring(0, jsonEndIndex + 1)
      }
      
      console.log(`[${requestId}] 📝 清理後的回應:`, cleanedResponse)
      
      // 找到最後一個完整的JSON對象
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        let jsonStr = jsonMatch[0]
        
        // 修復常見的JSON格式問題
        jsonStr = this.fixJsonFormat(jsonStr, requestId)
        
        console.log(`[${requestId}] 📝 修復後的JSON:`, jsonStr)
        
        const parsed = JSON.parse(jsonStr)
        console.log(`[${requestId}] ✅ JSON解析成功`)
        return parsed
      }

      // 如果沒有找到JSON，嘗試提取內容
      console.log(`[${requestId}] ⚠️ 未找到JSON格式，嘗試提取內容`)
      return this.extractContentFromText(response)

    } catch (error) {
      console.error(`[${requestId}] ❌ 解析回應失敗:`, error.message)
      console.log(`[${requestId}] 📝 原始回應:`, response)
      
      // 嘗試手動提取結構化內容
      return this.extractStructuredContent(response, requestId)
    }
  }

  // 新增方法：累積和處理分段 JSON 響應
  accumulateJsonChunks(response, requestId) {
    console.log(`[${requestId}] 🔗 檢查是否為分段響應`)
    
    // 檢查是否包含分段標識符
    const hasJesusLetterChunk = response.includes('"jesusLetter"') && !response.includes('"guidedPrayer"')
    const hasGuidedPrayerChunk = response.includes('"guidedPrayer"') && !response.includes('"biblicalReferences"')
    const hasBiblicalReferencesChunk = response.includes('"biblicalReferences"') && !response.includes('"coreMessage"')
    const hasCoreMessageChunk = response.includes('"coreMessage"') && !response.includes('}')
    
    // 如果檢測到分段響應，嘗試重構完整的 JSON
    if (hasJesusLetterChunk || hasGuidedPrayerChunk || hasBiblicalReferencesChunk || hasCoreMessageChunk) {
      console.log(`[${requestId}] 🧩 檢測到分段響應，嘗試重構完整 JSON`)
      return this.reconstructCompleteJson(response, requestId)
    }
    
    // 檢查 JSON 是否不完整（缺少結束括號）
    const openBraces = (response.match(/\{/g) || []).length
    const closeBraces = (response.match(/\}/g) || []).length
    
    if (openBraces > closeBraces) {
      console.log(`[${requestId}] 🔧 檢測到不完整的 JSON，嘗試補全`)
      return this.completeIncompleteJson(response, requestId)
    }
    
    return response
  }

  // 重構完整的 JSON 從分段響應
  reconstructCompleteJson(response, requestId) {
    console.log(`[${requestId}] 🔨 重構完整 JSON`)
    
    // 提取各個字段的內容
    let jesusLetter = ''
    let guidedPrayer = ''
    let biblicalReferences = []
    let coreMessage = ''
    
    // 使用更寬鬆的正則表達式來匹配分段內容
    const jesusLetterMatch = response.match(/"jesusLetter"[:\s]*"([^"]*(?:\\.[^"]*)*)"/s)
    if (jesusLetterMatch) {
      jesusLetter = jesusLetterMatch[1] || ''
    }
    
    const guidedPrayerMatch = response.match(/"guidedPrayer"[:\s]*"([^"]*(?:\\.[^"]*)*)"/s)
    if (guidedPrayerMatch) {
      guidedPrayer = guidedPrayerMatch[1] || ''
    }
    
    const biblicalReferencesMatch = response.match(/"biblicalReferences"[:\s]*\[([^\]]*)\]/s)
    if (biblicalReferencesMatch) {
      const refs = biblicalReferencesMatch[1].match(/"([^"]*)"/g)
      if (refs) {
        biblicalReferences = refs.map(ref => ref.replace(/"/g, ''))
      }
    }
    
    const coreMessageMatch = response.match(/"coreMessage"[:\s]*"([^"]*(?:\\.[^"]*)*)"/s)
    if (coreMessageMatch) {
      coreMessage = coreMessageMatch[1] || ''
    }
    
    // 構建完整的 JSON 字符串
    const completeJson = {
      jesusLetter: jesusLetter || '親愛的朋友，我聽見了你的心聲，我愛你，我與你同在。',
      guidedPrayer: guidedPrayer || '親愛的天父，感謝你的愛和恩典，求你賜給我們平安和力量。',
      biblicalReferences: biblicalReferences.length > 0 ? biblicalReferences : ['約翰福音 3:16'],
      coreMessage: coreMessage || '神愛你，祂必與你同在'
    }
    
    console.log(`[${requestId}] ✅ 成功重構完整 JSON`)
    return JSON.stringify(completeJson)
  }

  // 補全不完整的 JSON
  completeIncompleteJson(response, requestId) {
    console.log(`[${requestId}] 🔧 補全不完整的 JSON`)
    
    let completedJson = response.trim()
    
    // 確保所有字符串字段都有結束引號
    const fieldPatterns = [
      /"jesusLetter"\s*:\s*"[^"]*$/,
      /"guidedPrayer"\s*:\s*"[^"]*$/,
      /"coreMessage"\s*:\s*"[^"]*$/
    ]
    
    fieldPatterns.forEach(pattern => {
      if (pattern.test(completedJson)) {
        completedJson += '"'
      }
    })
    
    // 確保 biblicalReferences 陣列完整
    if (/"biblicalReferences"\s*:\s*\[[^\]]*$/.test(completedJson)) {
      completedJson += ']'
    }
    
    // 確保 JSON 對象完整
    const openBraces = (completedJson.match(/\{/g) || []).length
    const closeBraces = (completedJson.match(/\}/g) || []).length
    
    for (let i = 0; i < openBraces - closeBraces; i++) {
      completedJson += '}'
    }
    
    console.log(`[${requestId}] ✅ JSON 補全完成`)
    return completedJson
  }

  fixJsonFormat(jsonStr, requestId) {
    console.log(`[${requestId}] 🔧 修復JSON格式`)
    console.log(`[${requestId}] 📝 原始JSON字符串:`, jsonStr.substring(0, 200) + '...')
    
    try {
      // 首先嘗試解析，如果成功就直接返回
      JSON.parse(jsonStr)
      console.log(`[${requestId}] ✅ JSON格式正確，無需修復`)
      return jsonStr
    } catch (error) {
      console.log(`[${requestId}] ⚠️ JSON格式有問題，開始修復:`, error.message)
    }
    
    let originalStr = jsonStr
    
    // 第一步：移除所有 markdown 代碼塊標記
    jsonStr = jsonStr.replace(/```json\s*/gi, '') // 移除開頭 ```json 標記
    jsonStr = jsonStr.replace(/```\s*$/gi, '') // 移除結尾 ``` 標記
    jsonStr = jsonStr.replace(/```/g, '') // 移除任何剩餘的 ``` 標記
    
    // 第二步：移除開頭的非JSON內容（但保留 { 開始的內容）
    const jsonStart = jsonStr.indexOf('{')
    if (jsonStart > 0) {
      jsonStr = jsonStr.substring(jsonStart)
    }
    
    // 第三步：移除結尾的非JSON內容（但保留到最後一個 } ）
    const jsonEnd = jsonStr.lastIndexOf('}')
    if (jsonEnd >= 0 && jsonEnd < jsonStr.length - 1) {
      jsonStr = jsonStr.substring(0, jsonEnd + 1)
    }
    
    // 第四步：處理字符串值內的換行符問題
    // 只處理字符串值內的換行符，不破壞JSON結構
    jsonStr = jsonStr.replace(/"([^"]*?)"/g, (match, content) => {
      // 在字符串內容中處理換行符
      let processedContent = content
        .replace(/\r\n/g, '\\n')  // Windows 換行符
        .replace(/\n/g, '\\n')    // Unix 換行符
        .replace(/\r/g, '\\n')    // Mac 換行符
        .replace(/\t/g, '\\t')    // 制表符
        .replace(/\\n\\n+/g, '\\n') // 將多個連續的 \n 轉換為單個 \n
      
      return `"${processedContent}"`
    })
    
    // 第五步：修復可能的尾隨逗號
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')
    
    // 第六步：確保字符串值被正確引用（處理未引用的值）
    jsonStr = jsonStr.replace(/:\s*([^",\{\[\]\}\s][^,\}\]]*?)(?=\s*[,\}])/g, (match, value) => {
      const trimmedValue = value.trim()
      // 檢查是否為布爾值、null或數字
      if (trimmedValue === 'true' || trimmedValue === 'false' || 
          trimmedValue === 'null' || /^-?\d+(\.\d+)?$/.test(trimmedValue)) {
        return match // 保持布爾值、null和數字不變
      }
      return `: "${trimmedValue}"`
    })
    
    console.log(`[${requestId}] 🔧 JSON修復完成`)
    console.log(`[${requestId}] 📝 修復後JSON字符串:`, jsonStr.substring(0, 200) + '...')
    
    // 最終驗證
    try {
      JSON.parse(jsonStr)
      console.log(`[${requestId}] ✅ JSON修復成功`)
      return jsonStr
    } catch (error) {
      console.log(`[${requestId}] ❌ JSON修復失敗:`, error.message)
      console.log(`[${requestId}] 📝 修復失敗的JSON:`, jsonStr)
      // 如果修復失敗，返回原始字符串讓後續處理
      return originalStr
    }
  }

  extractStructuredContent(response, requestId) {
    console.log(`[${requestId}] 🔧 嘗試手動提取結構化內容`)
    
    try {
      // 嘗試從文本中提取各個部分
      let jesusLetter = ''
      let guidedPrayer = ''
      let biblicalReferences = []
      let coreMessage = ''
      
      // 查找jesusLetter部分
      const jesusLetterMatch = response.match(/"jesusLetter":\s*"([^"]*(?:\\.[^"]*)*)"/)
      if (jesusLetterMatch) {
        jesusLetter = jesusLetterMatch[1]
          .replace(/\\n\\n/g, '') // 完全刪除雙換行符
          .replace(/\\n/g, '\n')  // 轉換單換行符
          .replace(/\\"/g, '"')   // 轉換引號
      }
      
      // 查找guidedPrayer部分
      const guidedPrayerMatch = response.match(/"guidedPrayer":\s*"([^"]*(?:\\.[^"]*)*)"/)
      if (guidedPrayerMatch) {
        guidedPrayer = guidedPrayerMatch[1]
          .replace(/\\n\\n/g, '') // 完全刪除雙換行符
          .replace(/\\n/g, '\n')  // 轉換單換行符
          .replace(/\\"/g, '"')   // 轉換引號
      }
      
      // 查找biblicalReferences部分
      const biblicalReferencesMatch = response.match(/"biblicalReferences":\s*\[(.*?)\]/)
      if (biblicalReferencesMatch) {
        const refs = biblicalReferencesMatch[1].match(/"([^"]*)"/g)
        if (refs) {
          biblicalReferences = refs.map(ref => ref.replace(/"/g, ''))
        }
      }
      
      // 查找coreMessage部分
      const coreMessageMatch = response.match(/"coreMessage":\s*"([^"]*(?:\\.[^"]*)*)"/)
      if (coreMessageMatch) {
        coreMessage = coreMessageMatch[1]
          .replace(/\\n\\n/g, '') // 完全刪除雙換行符
          .replace(/\\n/g, '\n')  // 轉換單換行符
          .replace(/\\"/g, '"')   // 轉換引號
      }
      
      console.log(`[${requestId}] ✅ 手動提取結構化內容成功`)
      return {
        jesusLetter: jesusLetter || '親愛的朋友，我聽見了你的心聲，我愛你，我與你同在。',
        guidedPrayer: guidedPrayer || '親愛的天父，感謝你的愛和恩典，求你賜給我們平安和力量。',
        biblicalReferences: biblicalReferences.length > 0 ? biblicalReferences : ['約翰福音 3:16'],
        coreMessage: coreMessage || '神愛你，祂必與你同在'
      }
      
    } catch (error) {
      console.error(`[${requestId}] ❌ 手動提取失敗:`, error.message)
      return this.createStructuredResponse(response)
    }
  }

  extractContentFromText(text) {
    return {
      jesusLetter: text.substring(0, Math.min(text.length, 800)),
      guidedPrayer: '親愛的天父，感謝你透過耶穌基督賜給我們的愛和恩典...',
      biblicalReferences: ['約翰福音 3:16', '詩篇 23:1', '腓立比書 4:13'],
      coreMessage: '神愛你，祂必與你同在'
    }
  }

  createStructuredResponse(text) {
    return {
      jesusLetter: text || '親愛的孩子，我看見了你的心，我愛你...',
      guidedPrayer: '親愛的天父，感謝你的愛和恩典，求你賜給我們智慧和力量。',
      biblicalReferences: ['約翰福音 3:16', '詩篇 23:1'],
      coreMessage: '神愛你，祂必與你同在'
    }
  }

  validateAndEnhanceResponse(response, userInput, requestId) {
    const { nickname } = userInput

    // 確保必要欄位存在
    response.jesusLetter = response.jesusLetter || `親愛的${nickname}，我看見了你的困難，我愛你，我與你同在...`
    response.guidedPrayer = response.guidedPrayer || `我來為您禱告，如果您願意，可以跟著一起唸：

親愛的天父，

我們來到你的面前，感謝你賜給我們耶穌基督，讓我們可以透過祂來到你的面前。

我們為${nickname}祈求，在他/她面臨${userInput.topic}的挑戰時，求你賜給他/她智慧和力量。

求你的平安充滿${nickname}的心，讓他/她在困難中仍能經歷你的愛。

主啊，我們將一切都交託在你的手中，相信你必有最好的安排。`
    response.biblicalReferences = response.biblicalReferences || ['約翰福音 3:16']
    response.coreMessage = response.coreMessage || '神愛你，祂必與你同在'

    // 清理和分離內容，確保jesusLetter和guidedPrayer不會混合
    response.jesusLetter = this.cleanJesusLetter(response.jesusLetter)
    response.guidedPrayer = this.cleanGuidedPrayer(response.guidedPrayer)

    // 檢查內容長度並增強
    if (response.jesusLetter.length < 500) {
      response.jesusLetter = this.enhanceJesusLetter(response.jesusLetter, userInput)
    }

    if (response.guidedPrayer.length < 300) {
      response.guidedPrayer = this.enhanceGuidedPrayer(response.guidedPrayer, userInput, response.jesusLetter)
    }

    // 移除自動添加禱告結尾的邏輯，讓 AI 自然生成禱告內容

    console.log(`[${requestId}] ✅ 回應驗證和增強完成`)
    return response
  }

  cleanJesusLetter(letter) {
    if (!letter) return ''
    
    // 移除可能混入的禱告內容
    let cleaned = letter
      .replace(/我來為您禱告.*?阿們。/gs, '') // 移除禱告段落
      .replace(/親愛的天父.*?阿們。/gs, '') // 移除禱告段落
      .replace(/奉耶穌的名禱告.*?阿們。/gs, '') // 移除禱告結尾
      .replace(/如果您願意，可以跟著一起唸.*$/gs, '') // 移除禱告引導語
      .trim()
    
    return cleaned
  }

  cleanGuidedPrayer(prayer) {
    if (!prayer) return ''
    
    // 確保禱告內容以正確格式開始
    let cleaned = prayer.trim()
    
    // 如果不是以"我來為您禱告"開始，則添加
    if (!cleaned.startsWith('我來為您禱告')) {
      cleaned = '我來為您禱告，如果您願意，可以跟著一起唸：\n\n' + cleaned
    }
    
    return cleaned
  }

  enhanceJesusLetter(letter, userInput) {
    const { nickname, topic } = userInput
    
    const enhancement = `

親愛的${nickname}，

我深深理解你在${topic}方面所面臨的挑戰。每一個困難都是成長的機會，每一次眼淚都被我珍藏。

記住，我曾說過："凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。"（馬太福音 11:28）你不是孤單的，我一直與你同在。

在這個過程中，請相信我的計劃是美好的。雖然現在可能看不清前路，但我會一步步引導你。就像牧羊人引導羊群一樣，我會帶領你走過這個困難時期。

願我的平安充滿你的心，願我的愛成為你的力量。

愛你的耶穌`

    return letter + enhancement
  }

  enhanceGuidedPrayer(prayer, userInput, jesusLetter = '') {
    const { nickname, topic, situation } = userInput
    
    // 將topic轉換為具體的禱告主題並推測可能的隱藏需要
    const topicMapping = {
      '工作': {
        name: '工作',
        prayerContext: '工作上的需要',
        hiddenNeeds: '工作壓力、人際關係、職涯方向、工作與生活平衡的困擾'
      },
      '財富': {
        name: '財富', 
        prayerContext: '經濟上的需要',
        hiddenNeeds: '經濟壓力、理財焦慮、對未來的不安全感、物質與心靈的平衡'
      },
      '信仰': {
        name: '信仰',
        prayerContext: '信仰上的需要',
        hiddenNeeds: '靈性乾渴、信心軟弱、與神關係的疏遠、屬靈爭戰'
      },
      '感情': {
        name: '感情',
        prayerContext: '感情上的需要',
        hiddenNeeds: '關係中的傷痛、孤單感、對愛的渴望、過去的創傷'
      },
      '健康': {
        name: '健康',
        prayerContext: '健康上的需要',
        hiddenNeeds: '身體的痛苦、對疾病的恐懼、心理健康、家人的擔憂'
      },
      '家庭': {
        name: '家庭',
        prayerContext: '家庭上的需要',
        hiddenNeeds: '家庭衝突、代溝問題、責任重擔、對家人的擔心'
      },
      '其他': {
        name: '其他',
        prayerContext: '生活中的各種需要',
        hiddenNeeds: '內心深處的困擾、說不出的重擔、未來的不確定性'
      }
    }
    
    const topicInfo = topicMapping[topic] || { 
      name: topic, 
      prayerContext: '生活中的需要',
      hiddenNeeds: '內心的重擔和困擾' 
    }
    
    // 從耶穌回信中提取關鍵信息用於禱告
    let jesusInsight = ''
    if (jesusLetter) {
      // 簡單提取一些關鍵詞和概念
      if (jesusLetter.includes('平安')) jesusInsight += '求你賜給他/她內心的平安，'
      if (jesusLetter.includes('智慧')) jesusInsight += '求你賜給他/她屬天的智慧，'
      if (jesusLetter.includes('力量')) jesusInsight += '求你成為他/她的力量，'
      if (jesusLetter.includes('盼望')) jesusInsight += '求你賜給他/她活潑的盼望，'
      if (jesusLetter.includes('恩典')) jesusInsight += '讓他/她經歷你豐盛的恩典，'
    }
    
    const enhancement = `

我來為您禱告，如果您願意，可以跟著一起唸：

親愛的天父，

我們來到你的面前，為在${topicInfo.prayerContext}向你祈求。

感謝你的愛從不改變，感謝你的恩典夠我們用。${jesusInsight}讓我們能夠在困難中看見你的作為。

主啊，雖然我們可能沒有詳細說出所有的困難，但你是無所不知的神，你深知我們在${topicInfo.name}方面可能面臨的挑戰，包括${topicInfo.hiddenNeeds}。求你親自安慰我們的心，醫治那些隱而未現的傷痛。

就如你透過耶穌向我們所說的話，我們也為此祈求：求你安慰我們的心，除去一切的憂慮和恐懼。讓你的平安如江河一般流淌在我們的心中。

天父，即使我們沒有說出口的重擔，你都看見了。求你親自背負我們的憂慮，讓我們知道不需要獨自承擔。無論是已經分享的困難，還是藏在心底的掙扎，都求你一一眷顧。

求你按著你在耶穌裡的應許，成就在我們身上。讓我們不僅聽見你的話語，更能經歷你話語的能力。

主啊，我們將這一切都交託在你的手中，包括那些說不出來的嘆息和眼淚，相信你必有最好的安排。求你繼續引導和保守我們，讓我們在每一天都能感受到你的同在和愛。`

    return prayer + enhancement
  }

  generateFallbackResponse(userInput, requestId, startTime) {
    console.log(`[${requestId}] 🆘 生成預設回應`)
    
    const { nickname, topic } = userInput
    const processingTime = Date.now() - startTime
    
    // 推測不同主題可能的隱藏需要
    const topicInsights = {
      '工作': '工作壓力、人際關係或職涯方向',
      '財富': '經濟壓力或對未來的不安全感',
      '信仰': '靈性乾渴或與神關係的疏遠',
      '感情': '關係中的傷痛或孤單感',
      '健康': '身體的痛苦或對疾病的恐懼',
      '家庭': '家庭衝突或對家人的擔心',
      '其他': '內心深處的困擾'
    }
    
    const hiddenConcerns = topicInsights[topic] || '內心的重擔'
    
    return {
      jesusLetter: `親愛的${nickname}，

雖然現在我無法給你詳細的回應，但我想讓你知道，我愛你，我看見你在${topic}方面的困擾。

無論你正在經歷什麼，請記住你不是孤單的。我一直與你同在，我的愛永不改變。

在困難的時候，請來到我面前，將你的重擔卸給我。我會給你力量，我會給你平安。

相信我對你的計劃是美好的，雖然現在可能看不清楚，但我會一步步引導你。

愛你的耶穌`,

      guidedPrayer: `我來為您禱告，如果您願意，可以跟著一起唸：

親愛的天父，

我們來到你的面前，感謝你賜給我們耶穌基督，讓我們可以透過祂來到你的面前。

我們為${nickname}祈求，在他/她面臨${topic}的挑戰時，求你賜給他/她智慧和力量。

主啊，雖然${nickname}可能沒有詳細說出所有的困難，但你是無所不知的神，你深知他/她可能面臨的${hiddenConcerns}。求你親自安慰他/她的心，醫治那些隱而未現的傷痛。

就如你透過耶穌向${nickname}所說的話，我們也為他/她祈求：求你的平安充滿他/她的心，讓他/她在困難中仍能經歷你的愛和同在。

天父，即使${nickname}沒有說出口的重擔，你都看見了。求你親自背負他/她的憂慮，讓他/她知道不需要獨自承擔。無論是已經分享的困難，還是藏在心底的掙扎，都求你一一眷顧。

求你按著你在耶穌裡的應許，成就在${nickname}身上。讓他/她不僅聽見你的話語，更能經歷你話語的能力。

主啊，我們將一切都交託在你的手中，包括那些說不出來的嘆息和眼淚，相信你必有最好的安排。求你繼續引導和保守${nickname}，讓他/她在每一天都能感受到你的同在和愛。`,

      biblicalReferences: [
        '馬太福音 11:28 - 凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。',
        '詩篇 23:1 - 耶和華是我的牧者，我必不致缺乏。',
        '腓立比書 4:13 - 我靠著那加給我力量的，凡事都能做。'
      ],

      coreMessage: '神愛你，祂必與你同在，永不離棄你。',

      metadata: {
        requestId,
        processingTime,
        aiService: 'fallback',
        fallback: true,
        error: 'AI服務暫時不可用'
      }
    }
  }

  estimateTokens(text) {
    if (!text) return 0
    // 簡單估算：中文字符約1.5個token，英文單詞約1個token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return Math.ceil(chineseChars * 1.5 + englishWords)
  }

  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  getServiceStatus() {
    return {
      gemini: !!this.geminiService,
      openai: !!this.openaiService,
      initialized: this.isInitialized,
      preferredService: this.preferredService
    }
  }
}

// 創建AI服務實例
const aiService = new BackendAIService()

// POST /api/ai/generate - 生成AI回應
router.post('/generate', async (req, res, next) => {
  try {
    const { userInput } = req.body

    // 驗證必要欄位
    if (!userInput || !userInput.nickname || !userInput.situation || !userInput.topic) {
      return res.status(400).json({
        error: '缺少必要欄位',
        required: ['nickname', 'situation', 'topic'],
        received: Object.keys(userInput || {})
      })
    }

    // 驗證內容長度
    if (userInput.situation.length > 2000) {
      return res.status(400).json({
        error: '情況描述過長',
        maxLength: 2000,
        currentLength: userInput.situation.length
      })
    }

    // 生成AI回應
    const aiResponse = await aiService.generateResponse(userInput)

    res.json({
      success: true,
      data: {
        userInput,
        aiResponse
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI生成失敗:', error)
    next(error)
  }
})

// GET /api/ai/status - 獲取AI服務狀態
router.get('/status', (req, res) => {
  try {
    const status = aiService.getServiceStatus()
    
    res.json({
      success: true,
      data: {
        ...status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    })
  } catch (error) {
    console.error('❌ 獲取AI狀態失敗:', error)
    res.status(500).json({
      error: '獲取服務狀態失敗',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /api/ai/test - 測試AI服務
router.post('/test', async (req, res, next) => {
  try {
    const testInput = {
      nickname: '測試用戶',
      topic: '信仰',
      situation: '這是一個測試請求，用於驗證AI服務是否正常工作。',
      religion: '基督徒'
    }

    const startTime = Date.now()
    const aiResponse = await aiService.generateResponse(testInput)
    const responseTime = Date.now() - startTime

    res.json({
      success: true,
      data: {
        testResult: 'AI服務正常',
        responseTime: `${responseTime}ms`,
        aiService: aiResponse.metadata?.aiService || 'unknown',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ AI測試失敗:', error)
    next(error)
  }
})

// 將路由掛載到應用程式
app.use('/api/ai', router)

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '耶穌的信 3.0 AI API 服務',
    version: '3.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      generate: '/api/ai/generate',
      status: '/api/ai/status',
      test: '/api/ai/test'
    }
  })
})

// 健康檢查路由
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AI API'
  })
})

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('❌ 伺服器錯誤:', error)
  res.status(500).json({
    error: '內部伺服器錯誤',
    message: process.env.NODE_ENV === 'development' ? error.message : '請稍後再試'
  })
})

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '找不到請求的資源',
    path: req.originalUrl
  })
})

// 配置埠號 - 優先使用 Render 提供的 PORT 環境變數
const PORT = process.env.PORT || 3002

// 啟動伺服器
const server = app.listen(PORT, () => {
  console.log(`✅ 伺服器已成功啟動，正在監聽埠號 ${PORT}`)
  console.log('準備好接收來自前端的請求了！')
  console.log(`🌐 API 端點: http://localhost:${PORT}/api/ai`)
  console.log(`🔍 健康檢查: http://localhost:${PORT}/health`)
})

// 優雅關閉處理
process.on('SIGTERM', () => {
  console.log('📡 收到 SIGTERM 信號，正在優雅關閉伺服器...')
  server.close(() => {
    console.log('✅ 伺服器已成功關閉')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('📡 收到 SIGINT 信號，正在優雅關閉伺服器...')
  server.close(() => {
    console.log('✅ 伺服器已成功關閉')
    process.exit(0)
  })
})

export default app