<template>
  <div class="share-page">
    <div class="share-container">
      <!-- 頁面標題 -->
      <div class="page-header">
        <h2>聽聽看耶穌會怎麼說</h2>
        <p>無論是困擾、感恩或疑問 記錄下來，他必成為你 腳前的燈 路上的光 夜間的歌</p>
      </div>

      <!-- 分享表單 -->
      <form @submit.prevent="handleSubmit" class="share-form">
        <!-- 提問內容區塊 -->
        <div class="form-section">
          <h3 class="section-title">提問內容</h3>
          
          <div class="form-group">
            <label for="nickname">暱稱 *</label>
            <input
              type="text"
              id="nickname"
              v-model="formData.nickname"
              placeholder="請輸入你的暱稱"
              required
              maxlength="20"
            />
          </div>



          <div class="form-group">
            <label for="religion">宗教信仰</label>
            <select id="religion" v-model="formData.religion">
              <option value="">請選擇</option>
              <option value="基督徒">基督徒</option>
              <option value="天主教徒">天主教徒</option>
              <option value="猶太教">猶太教</option>
              <option value="佛教">佛教</option>
              <option value="道教">道教</option>
              <option value="伊斯蘭教">伊斯蘭教</option>
              <option value="印度教">印度教</option>
              <option value="神道教">神道教</option>
              <option value="摩門教">摩門教</option>
              <option value="統一教">統一教</option>
              <option value="一貫道">一貫道</option>
              <option value="無固定信仰">無固定信仰</option>
              <option value="非基督徒">非基督徒</option>
              <option value="其他宗教">其他宗教</option>
              <option value="無宗教信仰">無宗教信仰</option>
            </select>
          </div>
        </div>

        <!-- 分享內容區塊 -->
        <div class="form-section">
          <h3 class="section-title">我要提問</h3>
          
          <div class="form-group">
            <label>主題 * (可複選)</label>
            <div class="checkbox-group">
              <div class="checkbox-item">
                <input type="checkbox" id="topic-work" value="工作" v-model="formData.topics">
                <label for="topic-work">工作</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-love" value="感情" v-model="formData.topics">
                <label for="topic-love">感情</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-health" value="健康" v-model="formData.topics">
                <label for="topic-health">健康</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-family" value="家庭" v-model="formData.topics">
                <label for="topic-family">家庭</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-wealth" value="財富" v-model="formData.topics">
                <label for="topic-wealth">財富</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-faith" value="信仰" v-model="formData.topics">
                <label for="topic-faith">信仰</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-other" value="其他" v-model="formData.topics">
                <label for="topic-other">其他</label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="situation">具體情況(概述與事件關鍵詞亦可) *</label>
            <textarea
              id="situation"
              v-model="formData.situation"
              placeholder="請詳細描述你想分享的情況、困擾或感恩..."
              required
              rows="8"
              maxlength="2000"
            ></textarea>
            <div class="char-count">
              {{ formData.situation.length }}/2000
            </div>
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="handleBack">
            取消
          </button>
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="isSubmitting || !isFormValid"
          >
            <span v-if="isSubmitting" class="loading-spinner"></span>
            {{ isSubmitting ? '發送中...' : '誠心地發送' }}
          </button>
        </div>
      </form>

      <!-- 隱私提示 -->
      <div class="privacy-notice">
        <div class="notice-icon">🔒</div>
        <div class="notice-content">
          <h4>隱私保護</h4>
          <p>你的分享內容將被安全處理，我們重視並保護你的隱私。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { API_CONFIG } from '../config/api.js'

export default {
  name: 'SharePage',
  emits: ['letter-sent', 'back'],
  setup(props, { emit }) {
    const isSubmitting = ref(false)
    
    const formData = ref({
      nickname: '',
      religion: '',
      topics: [],
      situation: ''
    })

    // 表單驗證
    const isFormValid = computed(() => {
      return formData.value.nickname.trim() && 
             formData.value.topics.length > 0 && 
             formData.value.situation.trim().length >= 10
    })

    // 處理表單提交
    const handleSubmit = async () => {
      if (!isFormValid.value || isSubmitting.value) return

      isSubmitting.value = true
      let response = null // 在函數開始時聲明 response 變量

      try {
        // 準備發送數據
        const requestData = {
          userInput: {
            nickname: formData.value.nickname,
            situation: formData.value.situation,
            topic: formData.value.topics.join(', '), // 將陣列轉換為字符串
            religion: formData.value.religion
          }
        }

        // 發送到後端API
        response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AI_GENERATE}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })

        // 檢查 HTTP 狀態碼
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`HTTP錯誤 ${response.status}: ${errorData.error || '端點不存在'}`)
        }

        const result = await response.json()

        // 根據朋友建議：檢查是否有 error 欄位
        if (result.error) {
          throw new Error(`後端錯誤：${result.error}`)
        }

        // 檢查數據結構是否正確
        if (!result.aiResponse) {
          throw new Error('AI 回應格式不正確')
        }

        // 從正確的數據結構中提取AI響應
        const aiResponse = result.aiResponse

        // 驗證必要欄位
        if (!aiResponse.jesusLetter || !aiResponse.guidedPrayer) {
          throw new Error('AI 回應內容不完整')
        }

        // 創建信件對象
        const letterData = {
          id: generateId(),
          nickname: requestData.userInput.nickname,
          topic: requestData.userInput.topic,
          situation: requestData.userInput.situation,
          jesusLetter: aiResponse.jesusLetter,
          guidedPrayer: aiResponse.guidedPrayer,
          biblicalReferences: processBiblicalReferences(aiResponse.biblicalReferences),
          coreMessage: aiResponse.coreMessage || '',
          createdAt: new Date().toISOString()
        }

        // 發送成功事件
        emit('letter-sent', letterData)

        // 重置表單
        resetForm()

      } catch (error) {
        console.error('發送信件失敗:', error)
        
        // 根據朋友建議：三種狀況處理
        if (response && !response.ok) {
          // 狀況1：res.ok === false → 顯示 HTTP 錯誤
          alert(`發送信件失敗: Error: ${error.message}`)
        } else if (error.message.includes('後端錯誤')) {
          // 狀況2：data.error 存在 → 顯示 AI 錯誤
          alert(`AI 錯誤：${error.message}`)
        } else {
          // 狀況3：其餘 → 正常顯示錯誤訊息
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            alert('網路連接失敗，請檢查網路後重試')
          } else if (error.message.includes('JSON')) {
            alert('伺服器回應格式錯誤，請稍後再試')
          } else {
            alert(`發送信件失敗: Error: ${error.message}`)
          }
        }
      } finally {
        isSubmitting.value = false
      }
    }

    // 處理聖經經文引用 - 增強版本，支援串流和不完整 JSON
    const processBiblicalReferences = (references) => {
      if (!references) return []
      
      // 如果已經是數組，處理數組中的每個元素
      if (Array.isArray(references)) {
        return references.map(ref => {
          // 如果是物件格式 { verse: "...", content: "..." }
          if (typeof ref === 'object' && ref !== null) {
            if (ref.verse && ref.content) {
              return `${ref.verse} - ${ref.content}`
            }
            // 處理只有部分欄位的物件
            if (ref.verse) return ref.verse
            if (ref.content) return ref.content
            // 如果是其他物件格式，嘗試轉換為字串
            return JSON.stringify(ref)
          }
          // 如果是字符串，進一步處理可能的 JSON 格式
          if (typeof ref === 'string') {
            const parsed = parseStringReference(ref)
            // parseStringReference 可能返回數組，需要展開
            if (Array.isArray(parsed)) {
              return parsed
            }
            return parsed
          }
          return String(ref)
        }).flat().filter(ref => ref && typeof ref === 'string' && ref.trim().length > 0)
      }
      
      // 如果是字符串，嘗試解析
      if (typeof references === 'string') {
        return parseStringReference(references)
      }
      
      // 如果是單一物件
      if (typeof references === 'object' && references !== null) {
        if (references.verse && references.content) {
          return [`${references.verse} - ${references.content}`]
        }
        if (references.verse) return [references.verse]
        if (references.content) return [references.content]
      }
      
      return []
    }

    // 解析字符串格式的經文引用
    const parseStringReference = (str) => {
      if (!str || typeof str !== 'string') return []
      
      // 處理包含 JSON 物件的字符串
      if (str.includes('"verse":') || str.includes('"content":')) {
        const results = []
        
        // 嘗試匹配完整的 JSON 物件
        const completeJsonMatches = str.match(/\{\s*"verse":\s*"[^"]*(?:\\.[^"]*)*",\s*"content":\s*"[^"]*(?:\\.[^"]*)*"\s*\}/g)
        if (completeJsonMatches) {
          completeJsonMatches.forEach(match => {
            try {
              const obj = JSON.parse(match)
              if (obj.verse && obj.content) {
                results.push(`${obj.verse} - ${obj.content}`)
              } else if (obj.verse) {
                results.push(obj.verse)
              } else if (obj.content) {
                results.push(obj.content)
              }
            } catch (e) {
              console.warn('解析完整 JSON 物件失敗:', e, match)
              results.push(match) // 保留原始字串
            }
          })
        }
        
        // 處理不完整的 JSON 片段
        if (results.length === 0) {
          // 嘗試提取 verse 和 content 欄位
          const verseMatch = str.match(/"verse":\s*"([^"]*(?:\\.[^"]*)*)"/g)
          const contentMatch = str.match(/"content":\s*"([^"]*(?:\\.[^"]*)*)"/g)
          
          if (verseMatch && contentMatch) {
            const verses = verseMatch.map(m => m.match(/"verse":\s*"([^"]*)"/)?.[1]).filter(Boolean)
            const contents = contentMatch.map(m => m.match(/"content":\s*"([^"]*)"/)?.[1]).filter(Boolean)
            
            // 配對 verse 和 content
            for (let i = 0; i < Math.max(verses.length, contents.length); i++) {
              const verse = verses[i] || ''
              const content = contents[i] || ''
              if (verse && content) {
                results.push(`${verse} - ${content}`)
              } else if (verse) {
                results.push(verse)
              } else if (content) {
                results.push(content)
              }
            }
          } else if (verseMatch) {
            verseMatch.forEach(m => {
              const verse = m.match(/"verse":\s*"([^"]*)"/)?.[1]
              if (verse) results.push(verse)
            })
          } else if (contentMatch) {
            contentMatch.forEach(m => {
              const content = m.match(/"content":\s*"([^"]*)"/)?.[1]
              if (content) results.push(content)
            })
          }
        }
        
        if (results.length > 0) return results
      }
      
      // 嘗試標準 JSON 解析
      try {
        const parsed = JSON.parse(str)
        if (Array.isArray(parsed)) {
          return processBiblicalReferences(parsed) // 遞歸處理
        }
        if (typeof parsed === 'object' && parsed !== null) {
          return processBiblicalReferences(parsed)
        }
      } catch (e) {
        // JSON 解析失敗，使用換行符分割
        return str
          .split('\n')
          .map(ref => ref.trim())
          .filter(ref => ref.length > 0 && !ref.match(/^[\{\}",:\s]*$/)) // 過濾掉只包含 JSON 符號的行
      }
      
      return [str.trim()].filter(ref => ref && ref.length > 0)
    }

    // 生成唯一ID
    const generateId = () => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }

    // 重置表單
    const resetForm = () => {
      formData.value = {
        nickname: '',
        religion: '',
        topics: [],
        situation: ''
      }
    }

    // 返回上一頁
    const handleBack = () => {
      emit('back')
    }

    return {
      formData,
      isSubmitting,
      isFormValid,
      handleSubmit,
      handleBack,
      processBiblicalReferences
    }
  }
}
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 1rem;
}

.share-container {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, var(--primary-color), #357ABD);
  color: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-medium);
}

.page-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.page-header p {
  opacity: 0.9;
  font-size: 1rem;
}

.share-form {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
}

.form-section {
  margin-bottom: 2rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-color);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

input,
select,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-family: inherit;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: var(--transition);
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
}

.char-count {
  text-align: right;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

/* 複選框樣式 */
.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-item input[type="checkbox"] {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.checkbox-item label {
  margin: 0;
  cursor: pointer;
  font-weight: normal;
  color: var(--text-secondary);
  transition: var(--transition);
}

.checkbox-item input[type="checkbox"]:checked + label {
  color: var(--primary-color);
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #357ABD;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--border-color);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.privacy-notice {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: rgba(126, 211, 33, 0.1);
  border: 1px solid rgba(126, 211, 33, 0.3);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-top: 1.5rem;
}

.notice-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notice-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.notice-content p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .share-page {
    padding: 0.5rem;
  }
  
  .share-form {
    padding: 1.5rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1.5rem 1rem;
  }
  
  .page-header h2 {
    font-size: 1.3rem;
  }
  
  .share-form {
    padding: 1rem;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
}
</style>