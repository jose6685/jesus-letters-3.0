/**
 * 簡化版 AI 服務
 * 專注於核心功能，提供穩定的 AI 回應生成
 */
class SimplifiedAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY
    this.baseURL = 'https://api.openai.com/v1/chat/completions'
    this.model = 'gpt-4'
    this.maxRetries = 3
    this.timeout = 30000
    this.isInitialized = false
    this.init()
  }

  init() {
    if (this.isInitialized) return
    this.isInitialized = true
  }

  /**
   * 生成 AI 回應
   */
  async generateResponse(userInput) {
    const requestId = this.generateRequestId()
    
    try {
      // 主要服務
      const response = await this.callPrimaryService(userInput, requestId)
      return response
    } catch (error) {
      console.error(`[${requestId}] ❌ 主要服務失敗:`, error.message)
      
      // 備用服務
      try {
        const fallbackResponse = await this.callFallbackService(userInput, requestId)
        return fallbackResponse
      } catch (fallbackError) {
        console.error(`[${requestId}] ❌ 備用服務也失敗:`, fallbackError.message)
        return this.generateFallbackResponse(userInput, requestId)
      }
    }
  }

  /**
   * 主要 AI 服務
   */
  async callPrimaryService(userInput, requestId) {
    const startTime = Date.now()
    
    try {
      const prompt = this.buildPrompt(userInput)
      console.log(`[${requestId}] 📝 提示詞構建完成`)
      
      const response = await this.makeAPICall(prompt, requestId)
      const processingTime = Date.now() - startTime
      
      console.log(`[${requestId}] ⏱️ 主要服務處理時間: ${processingTime}ms`)
      
      const parsedResponse = this.parseResponse(response, requestId)
      const validatedResponse = this.validateAndEnhanceResponse(parsedResponse, userInput, requestId)
      
      console.log(`[${requestId}] ✅ 主要服務處理成功`)
      return validatedResponse
      
    } catch (error) {
      console.error(`[${requestId}] ❌ 主要服務錯誤:`, error.message)
      throw error
    }
  }

  /**
   * 備用 AI 服務
   */
  async callFallbackService(userInput, requestId) {
    const startTime = Date.now()
    
    try {
      console.log(`[${requestId}] 🔄 啟動備用服務`)
      
      // 使用簡化的提示詞
      const simplifiedPrompt = this.buildSimplifiedPrompt(userInput)
      const response = await this.makeAPICall(simplifiedPrompt, requestId)
      
      const processingTime = Date.now() - startTime
      console.log(`[${requestId}] ⏱️ 備用服務處理時間: ${processingTime}ms`)
      
      const parsedResponse = this.parseResponse(response, requestId)
      const validatedResponse = this.validateAndEnhanceResponse(parsedResponse, userInput, requestId)
      
      console.log(`[${requestId}] ✅ 備用服務處理成功`)
      return validatedResponse

    } catch (error) {
      console.error(`[${requestId}] ❌ 備用服務也失敗:`, error.message)
      
      // 返回預設回應
      return this.generateFallbackResponse(userInput, requestId)
    }
  }

  /**
   * 構建完整提示詞
   */
  buildPrompt(userInput) {
    const { nickname, topic, situation } = userInput;
    
    return `你是一位聖經數據分析專家，擁有來自基督教網站和聖經應用程式的知識庫。你的任務是以耶穌的身份回應用戶的需求。

**重要：細節關注原則**
- 仔細閱讀用戶輸入中的每一個細節，特別是：
  * 具體的人名（如：惟翔、小明、媽媽等）
  * 重要事件和日期（如：生日、紀念日、考試、面試等）
  * 特殊情境和背景（如：工作壓力、家庭關係、健康狀況等）
  * 情感狀態和需求（如：焦慮、感恩、困惑、期待等）
- 在回應中必須直接提及和回應這些具體細節
- 對於人名，要在回應中直接稱呼和關懷該人
- 對於重要事件，要給予具體的祝福或建議

**聖經引用策略**
你需要從四個層級策略性地取樣聖經經文：
1. **頂級經文** (25%): 最廣為人知的經文（如約翰福音3:16、詩篇23篇）
2. **中級經文** (35%): 較常被引用的經文（如腓立比書4:13、羅馬書8:28）
3. **較少引用** (25%): 不太常見但深具意義的經文
4. **隱藏寶石** (15%): 鮮為人知但極具洞察力的經文

**重要：這些層級分類僅供你內部參考選擇經文，絕對不要在最終回應中顯示任何層級標籤或分析標記。用戶看到的回應應該是自然流暢的，不包含任何分析標籤。**

**回應要求**
- 以耶穌的愛心、同理心、希望和力量來回應
- 根據用戶的宗教背景調整語言和引用
- 情感上要與用戶的狀態同步
- 提供實用的屬靈指導和鼓勵

請以JSON格式回應，包含以下欄位：
{
  "jesusLetter": "以耶穌身份寫給${nickname}的個人化信件，必須直接提及輸入中的具體人名、事件和細節",
  "guidedPrayer": "為${nickname}的具體情況量身定制的禱告，要針對提及的具體人名和事件",
  "biblicalReferences": "3-5個相關的聖經經文引用，包含經文內容和出處",
  "coreMessage": "核心屬靈信息摘要"
}

用戶資訊：
暱稱：${nickname}
主題：${topic}
情況：${situation}`;
  }

  /**
   * 構建簡化提示詞
   */
  buildSimplifiedPrompt(userInput) {
    const { nickname, topic, situation } = userInput;
    
    return `作為耶穌，回應${nickname}關於${topic}的困擾：${situation}

請用JSON格式回應：
{
  "jesusLetter": "耶穌的回信",
  "guidedPrayer": "引導式禱告",
  "biblicalReferences": ["聖經經文"],
  "coreMessage": "核心信息"
}`;
  }

  /**
   * 發送 API 請求
   */
  async makeAPICall(prompt, requestId) {
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return data.choices[0].message.content
  }

  /**
   * 解析 AI 回應
   */
  parseResponse(response, requestId) {
    console.log(`[${requestId}] 🔍 開始解析回應`)
    
    try {
      // 清理回應文本
      let cleanedResponse = response.trim()
      
      // 移除可能的 markdown 代碼塊標記
      cleanedResponse = cleanedResponse.replace(/```json\s*|\s*```/g, '')
      cleanedResponse = cleanedResponse.replace(/```\s*|\s*```/g, '')
      
      // 嘗試解析 JSON
      const parsed = JSON.parse(cleanedResponse)
      console.log(`[${requestId}] ✅ JSON 解析成功`)
      
      return parsed
      
    } catch (error) {
      console.warn(`[${requestId}] ⚠️ JSON 解析失敗，嘗試正則提取`)
      
      // 使用正則表達式提取結構化內容
      const extractedContent = this.extractStructuredContent(response, requestId)
      
      if (extractedContent) {
        return extractedContent
      }
      
      // 如果正則提取失敗，嘗試其他方法
      return this.createStructuredResponse(response)
    }
  }

  /**
   * 提取結構化內容
   */
  extractStructuredContent(text, requestId) {
    return this.extractWithRegex(text, requestId)
  }

  /**
   * 使用正則表達式提取內容
   */
  extractWithRegex(text, requestId) {
    try {
      const result = {}
      
      // 提取耶穌的信 - 修復正則表達式以正確處理換行符和特殊字符
      const letterMatch = text.match(/"jesusLetter"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
      if (letterMatch) {
        result.jesusLetter = letterMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
      } else {
        result.jesusLetter = ''
      }
      
      // 提取禱告文 - 修復正則表達式以正確處理換行符和特殊字符
      const prayerMatch = text.match(/"guidedPrayer"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
      if (prayerMatch) {
        result.guidedPrayer = prayerMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
      } else {
        result.guidedPrayer = ''
      }
      
      // 提取聖經經文
      const biblicalMatch = text.match(/"biblicalReferences"\s*:\s*\[(.*?)\]/s)
      if (biblicalMatch) {
        try {
          // 嘗試解析為正確的JSON陣列
          const biblicalArray = JSON.parse(`[${biblicalMatch[1]}]`)
          result.biblicalReferences = biblicalArray.filter(ref => ref && typeof ref === 'string' && ref.trim().length > 0)
        } catch (e) {
          // 如果JSON解析失敗，使用原來的邏輯作為備用
          result.biblicalReferences = biblicalMatch[1]
            .split(',')
            .map(ref => {
              if (typeof ref === 'string') {
                return ref.trim().replace(/"/g, '')
              }
              return String(ref).trim().replace(/"/g, '')
            })
            .filter(ref => ref && ref.length > 0)
        }
      } else {
        result.biblicalReferences = []
      }
      
      // 提取核心信息
      const coreMatch = text.match(/"coreMessage"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
      if (coreMatch) {
        result.coreMessage = coreMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
      } else {
        result.coreMessage = ''
      }
      
      console.log(`[${requestId}] ✅ 正則提取完成`)
      return result
      
    } catch (error) {
      console.error(`[${requestId}] ❌ 正則提取失敗:`, error.message)
      return this.extractContentFromText(text)
    }
  }

  /**
   * 從文本中提取內容（最後備用方案）
   */
  extractContentFromText(text) {
    const lines = text.split('\n').filter(line => line.trim())
    
    return {
      jesusLetter: text.substring(0, Math.min(text.length, 800)),
      guidedPrayer: '親愛的天父，感謝你透過耶穌基督賜給我們的愛和恩典...',
      biblicalReferences: ['約翰福音 3:16', '詩篇 23:1', '腓立比書 4:13'],
      coreMessage: '神愛你，祂必與你同在'
    }
  }

  /**
   * 創建結構化回應
   */
  createStructuredResponse(text) {
    return {
      jesusLetter: text || '親愛的孩子，我看見了你的心，我愛你...',
      guidedPrayer: '親愛的天父，感謝你的愛和恩典，求你賜給我們智慧和力量，奉耶穌的名禱告，阿們。',
      biblicalReferences: ['約翰福音 3:16', '詩篇 23:1'],
      coreMessage: '神愛你，祂必與你同在'
    }
  }

  /**
   * 創建備用回應
   */
  createFallbackResponse(userInput) {
    return {
      jesusLetter: `親愛的孩子，

感謝你向我傾訴你的心聲。雖然現在可能無法給你完整的回應，但請記住，我永遠與你同在。

無論你面對什麼困難或挑戰，都要相信我對你的愛是永恆不變的。在困難中尋求我，在喜樂中感謝我，在迷茫中信靠我。

你的禱告我都聽見了，我會在最合適的時候回應你。請耐心等候，並繼續在信心中前行。

願我的平安與你同在。

愛你的主耶穌`,
      guidedPrayer: `親愛的主耶穌，

感謝你聆聽我的禱告。雖然現在我可能感到困惑或不安，但我相信你有最好的安排。

請幫助我在等候中學習耐心，在困難中保持信心，在迷茫中尋求你的引導。

求你賜給我智慧和力量，讓我能夠面對生活中的各種挑戰。

奉主耶穌的名禱告，阿們。`,
      biblicalReferences: [
        "腓立比書 4:19 - 我的神必照他榮耀的豐富，在基督耶穌裡，使你們一切所需用的都充足。",
        "詩篇 23:1 - 耶和華是我的牧者，我必不致缺乏。"
      ]
    }
  }

  /**
   * 驗證和增強回應
   */
  validateAndEnhanceResponse(response, userInput, requestId) {
    const { nickname } = userInput

    // 確保必要欄位存在
    response.jesusLetter = response.jesusLetter || `親愛的${nickname}，我看見了你的困難，我愛你，我與你同在...`
    response.guidedPrayer = response.guidedPrayer || `親愛的天父，感謝你賜給${nickname}的恩典...`
    response.biblicalReferences = response.biblicalReferences || ['約翰福音 3:16']
    response.coreMessage = response.coreMessage || '神愛你，祂必與你同在'

    // 檢查內容長度並增強
    if (response.jesusLetter.length < 500) {
      response.jesusLetter = this.enhanceJesusLetter(response.jesusLetter, userInput)
    }

    if (response.guidedPrayer.length < 500) {
      response.guidedPrayer = this.enhanceGuidedPrayer(response.guidedPrayer, userInput)
    }

    // 移除自動添加禱告結尾的邏輯，讓 AI 自然生成禱告內容
    // if (!response.guidedPrayer.includes('奉耶穌的名禱告，阿們')) {
    //   response.guidedPrayer += '\n\n奉耶穌的名禱告，阿們。'
    // }

    return response
  }

  /**
   * 增強耶穌的信
   */
  enhanceJesusLetter(letter, userInput) {
    const { nickname, topic, situation } = userInput
    
    const enhancement = `

親愛的${nickname}，

我深深理解你在${topic}方面所面臨的挑戰。每一個困難都是成長的機會，每一次眼淚都被我珍藏。

記住，我曾說過："凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。"（馬太福音 11:28）你不是孤單的，我一直與你同在。

在這個過程中，請相信我的計劃是美好的。雖然現在可能看不清前路，但我會一步步引導你。就像牧羊人引導羊群一樣，我會帶領你走過這個困難時期。

願我的平安充滿你的心，願我的愛成為你的力量。

愛你的耶穌`

    return letter + enhancement
  }

  /**
   * 增強引導式禱告
   */
  enhanceGuidedPrayer(prayer, userInput) {
    const { nickname, topic } = userInput
    
    const enhancement = `

親愛的天父，

我們來到你的面前，為${nickname}在${topic}方面的需要向你祈求。

感謝你的愛從不改變，感謝你的恩典夠我們用。求你賜給${nickname}智慧，讓他/她能夠在困難中看見你的作為。

主啊，求你安慰${nickname}的心，除去一切的憂慮和恐懼。讓你的平安如江河一般流淌在他/她的心中。

天父，即使我們沒有說出口的重擔，你都看見了。求你親自背負我們的憂慮，讓我們知道不需要獨自承擔。

求你按著你在耶穌裡的應許，成就在我們身上。讓我們不僅聽見你的話語，更能經歷你話語的能力。

主啊，我們將這一切都交託在你的手中，相信你必有最好的安排。`

    return prayer + enhancement
  }

  /**
   * 生成備用回應
   */
  generateFallbackResponse(userInput, requestId) {
    const { nickname, topic } = userInput
    const processingTime = Date.now()
    
    console.log(`[${requestId}] 🆘 生成備用回應`)
    
    return {
      jesusLetter: `親愛的${nickname}，

我看見了你在${topic}方面的困擾，我的心與你同在。雖然現在可能感到困難重重，但請記住，我愛你，我永遠不會離棄你。

每一個挑戰都是成長的機會，每一次眼淚都被我珍藏。我知道你的痛苦，我理解你的掙扎，但請相信，我有美好的計劃為你預備。

就像我曾經說過："凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。"（馬太福音 11:28）你不需要獨自承擔這一切，我願意與你分擔。

在這個困難的時刻，請緊緊抓住我的應許。我是你的避難所，是你的力量，是你在患難中隨時的幫助。無論前路如何，我都會與你同行。

願我的平安充滿你的心，願我的愛成為你前進的動力。

愛你的耶穌`,

      guidedPrayer: `親愛的天父，

我們來到你的面前，為${nickname}在${topic}方面的需要向你祈求。

感謝你賜給我們耶穌基督，讓我們可以透過祂來到你的面前。感謝你的愛從不改變，感謝你的恩典夠我們用。

主啊，我們為${nickname}祈求，求你賜給他/她智慧和力量，讓他/她能夠在困難中看見你的作為。求你安慰他/她的心，除去一切的憂慮和恐懼。

天父，你知道我們內心深處的需要，即使我們沒有說出口的重擔，你都看見了。求你親自背負我們的憂慮，讓我們知道不需要獨自承擔。

求你的平安如江河一般流淌在我們心中，讓我們在風暴中仍能經歷你的同在。求你按著你在耶穌裡的應許，成就在我們身上。

主啊，我們將這一切都交託在你的手中，相信你必有最好的安排。求你繼續引導和保守我們，讓我們在每一天都能感受到你的愛。

奉耶穌的名禱告，阿們。`,

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

  /**
   * 生成請求 ID
   */
  generateRequestId() {
    return Math.random().toString(36).substr(2, 9)
  }
}

module.exports = SimplifiedAIService