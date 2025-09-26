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
  async speak(text) {
    if (!text || typeof text !== 'string') {
      console.warn('SpeechService.speak: 無效的文本輸入')
      return
    }

    // 如果相同文本正在播放，跳過
    if (this.currentText === text && this.isPlaying) {
      return
    }

    // 停止當前播放
    this.stop()

    try {
      // 創建語音合成實例
      const utterance = new SpeechSynthesisUtterance(text)
      
      // 設置語音參數
      utterance.rate = this.rate
      utterance.pitch = this.pitch
      utterance.volume = this.volume
      utterance.lang = this.lang

      // 嘗試使用中文語音
      const voices = speechSynthesis.getVoices()
      const chineseVoices = voices.filter(voice => 
        voice.lang.includes('zh') || voice.lang.includes('cmn')
      )
      
      if (chineseVoices.length > 0) {
        utterance.voice = chineseVoices[0]
      }

      // 設置事件監聽器
      utterance.onstart = () => {
        this.isPlaying = true
        this.isPaused = false
        this.currentText = text
        this.currentUtterance = utterance
      }

      utterance.onend = () => {
        this.isPlaying = false
        this.isPaused = false
        this.currentText = null
        this.currentUtterance = null
      }

      utterance.onerror = (event) => {
        console.error('語音播放錯誤:', event.error)
        this.isPlaying = false
        this.isPaused = false
        this.currentText = null
        this.currentUtterance = null
      }

      utterance.onpause = () => {
        this.isPaused = true
      }

      utterance.onresume = () => {
        this.isPaused = false
      }

      // 開始播放
      speechSynthesis.speak(utterance)
      
    } catch (error) {
      console.error('語音播放失敗:', error)
      this.isPlaying = false
      this.isPaused = false
      this.currentText = null
      this.currentUtterance = null
    }
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