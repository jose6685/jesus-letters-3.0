/**
 * 語音播放服務
 * 使用 Web Speech API 實現文字轉語音功能
 */
class SpeechService {
  constructor() {
    this.synthesis = window.speechSynthesis
    this.currentUtterance = null
    this.isPlaying = false
    this.isPaused = false
    
    // 檢查瀏覽器支援
    this.isSupported = 'speechSynthesis' in window
    
    // 語音設定
    this.defaultSettings = {
      lang: 'zh-TW',
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0
    }
  }

  /**
   * 檢查瀏覽器是否支援語音合成
   */
  isSupported() {
    return this.isSupported
  }

  /**
   * 獲取可用的語音列表
   */
  getVoices() {
    return this.synthesis.getVoices()
  }

  /**
   * 獲取中文語音
   */
  getChineseVoices() {
    const voices = this.getVoices()
    return voices.filter(voice => 
      voice.lang.includes('zh') || 
      voice.lang.includes('cmn') ||
      voice.name.includes('Chinese')
    )
  }

  /**
   * 強制停止並重置狀態
   */
  forceStop() {
    try {
      this.synthesis.cancel()
      // 多次調用確保完全停止
      setTimeout(() => this.synthesis.cancel(), 50)
      setTimeout(() => this.synthesis.cancel(), 100)
    } catch (error) {
      console.warn('強制停止語音時出錯:', error)
    }
    this.resetStatus()
  }

  /**
   * 重置所有狀態
   */
  resetStatus() {
    this.isPlaying = false
    this.isPaused = false
    this.currentUtterance = null
  }

  /**
   * 播放文字
   * @param {string} text - 要播放的文字
   * @param {object} options - 播放選項
   */
  speak(text, options = {}) {
    console.log('SpeechService.speak 被調用，文本:', text)
    
    if (!this.isSupported) {
      console.error('瀏覽器不支援語音合成功能')
      return Promise.reject(new Error('瀏覽器不支援語音合成功能'))
    }

    // 清理文字（移除 HTML 標籤）
    const cleanText = this.cleanText(text)
    
    if (!cleanText.trim()) {
      console.warn('清理後的文本為空')
      return Promise.reject(new Error('沒有可播放的文字'))
    }

    // 防止重複播放相同文本
    if (this.isPlaying && this.currentUtterance && this.currentUtterance.text === cleanText) {
      console.log('相同文本正在播放中，跳過重複請求')
      return Promise.resolve()
    }

    // 強制停止所有語音播放並清理狀態
    this.forceStop()
    
    // 等待更長時間確保停止完成
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.currentUtterance = new SpeechSynthesisUtterance(cleanText)
        
        // 設定語音參數
        const settings = { ...this.defaultSettings, ...options }
        this.currentUtterance.lang = settings.lang
        this.currentUtterance.rate = settings.rate
        this.currentUtterance.pitch = settings.pitch
        this.currentUtterance.volume = settings.volume

        // 選擇中文語音
        const chineseVoices = this.getChineseVoices()
        if (chineseVoices.length > 0) {
          this.currentUtterance.voice = chineseVoices[0]
          console.log('使用語音:', chineseVoices[0].name)
        }

        // 事件監聽
        this.currentUtterance.onstart = () => {
          console.log('語音播放開始')
          this.isPlaying = true
          this.isPaused = false
        }

        this.currentUtterance.onend = () => {
          console.log('語音播放結束')
          this.resetStatus()
          resolve()
        }

        this.currentUtterance.onerror = (event) => {
          console.log('語音播放錯誤:', event.error)
          this.resetStatus()
          
          // 將 interrupted 和 canceled 錯誤視為正常停止
          if (event.error === 'interrupted' || event.error === 'canceled') {
            console.log('語音播放被中斷，視為正常停止')
            resolve()
          } else {
            reject(new Error(`語音播放錯誤: ${event.error}`))
          }
        }

        this.currentUtterance.onpause = () => {
          console.log('語音播放暫停')
          this.isPaused = true
        }

        this.currentUtterance.onresume = () => {
          console.log('語音播放恢復')
          this.isPaused = false
        }

        // 開始播放
        try {
          this.synthesis.speak(this.currentUtterance)
          console.log('語音播放請求已發送')
        } catch (error) {
          console.error('語音播放啟動失敗:', error)
          this.resetStatus()
          reject(error)
        }
      }, 150) // 增加延遲時間確保完全停止
    })
  }

  /**
   * 暫停播放
   */
  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.synthesis.pause()
    }
  }

  /**
   * 恢復播放
   */
  resume() {
    if (this.isPlaying && this.isPaused) {
      this.synthesis.resume()
    }
  }

  /**
   * 停止播放
   */
  stop() {
    if (this.isPlaying) {
      this.synthesis.cancel()
      this.isPlaying = false
      this.isPaused = false
      this.currentUtterance = null
    }
  }

  /**
   * 獲取播放狀態
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isSupported: this.isSupported
    }
  }

  /**
   * 清理文字，移除 HTML 標籤和多餘空白
   * @param {string} text - 原始文字
   */
  cleanText(text) {
    if (!text) return ''
    
    return text
      // 移除 HTML 標籤
      .replace(/<[^>]*>/g, '')
      // 移除多餘的空白字符
      .replace(/\s+/g, ' ')
      // 移除首尾空白
      .trim()
      // 將常見的標點符號替換為適合語音的停頓
      .replace(/[。！？]/g, '。 ')
      .replace(/[，、]/g, '， ')
  }

  /**
   * 分段播放長文字
   * @param {string} text - 要播放的文字
   * @param {number} maxLength - 每段最大長度
   * @param {object} options - 播放選項
   */
  async speakInChunks(text, maxLength = 200, options = {}) {
    const cleanText = this.cleanText(text)
    const chunks = this.splitTextIntoChunks(cleanText, maxLength)
    
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].trim()) {
        await this.speak(chunks[i], options)
        // 短暫停頓
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
  }

  /**
   * 將文字分割成適當的段落
   * @param {string} text - 原始文字
   * @param {number} maxLength - 每段最大長度
   */
  splitTextIntoChunks(text, maxLength) {
    const sentences = text.split(/[。！？]/)
    const chunks = []
    let currentChunk = ''

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (!trimmedSentence) continue

      if (currentChunk.length + trimmedSentence.length <= maxLength) {
        currentChunk += (currentChunk ? '。' : '') + trimmedSentence
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '。')
        }
        currentChunk = trimmedSentence
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk + '。')
    }

    return chunks
  }
}

// 創建單例實例
const speechService = new SpeechService()

export default speechService