<template>
  <div id="app" class="app-container">
    <!-- 頂部導航 -->
    <header class="app-header" v-if="currentView !== 'welcome'">
      <div class="header-content">
        <button 
          class="back-btn" 
          @click="goBack"
          v-if="currentView !== 'home'"
        >
          ← 返回
        </button>
        <h1 class="app-title">{{ getPageTitle() }}</h1>
        <div class="header-actions">
          <!-- PWA 安裝按鈕 -->
          <button 
            v-if="canInstall"
            class="install-btn" 
            @click="installPWA"
            title="安裝應用程式到主畫面"
          >
            📱
          </button>
          <button 
            class="theme-toggle" 
            @click="toggleTheme"
            :title="isDarkMode ? '切換到淺色模式' : '切換到深色模式'"
          >
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>
    </header>

    <!-- 主要內容區域 -->
    <main class="app-main">
      <!-- 歡迎頁面 -->
      <WelcomePage 
        v-if="currentView === 'welcome'"
        @start="goToHome"
      />
      
      <!-- 首頁 -->
      <HomePage 
        v-else-if="currentView === 'home'"
        @new-letter="goToShare"
        @view-history="goToHistory"
      />
      
      <!-- 分享頁面 -->
      <SharePage 
        v-else-if="currentView === 'share'"
        @letter-sent="onLetterSent"
        @back="goToHome"
      />
      
      <!-- 回信頁面 -->
      <LetterPage 
        v-else-if="currentView === 'letter'"
        :letter="currentLetter"
        @back="goToHome"
        @save="saveLetter"
        @new-share="goToShare"
      />
      
      <!-- 歷史記錄頁面 -->
      <HistoryPage 
        v-else-if="currentView === 'history'"
        @view-letter="viewLetter"
        @letter-selected="viewLetter"
        @back="goToHome"
        @new-share="goToShare"
      />
    </main>

    <!-- 底部導航 -->
    <nav class="bottom-nav" v-if="currentView !== 'welcome' && currentView !== 'letter'">
      <button 
        class="nav-item"
        :class="{ active: currentView === 'home' }"
        @click="goToHome"
      >
        <span class="nav-icon">🏠</span>
        <span class="nav-label">首頁</span>
      </button>
      <button 
        class="nav-item"
        :class="{ active: currentView === 'share' }"
        @click="goToShare"
      >
        <span class="nav-icon">✍️</span>
        <span class="nav-label">我有事要問 有話要講</span>
      </button>
      <button 
        class="nav-item"
        :class="{ active: currentView === 'history' }"
        @click="goToHistory"
      >
        <span class="nav-icon">📚</span>
        <span class="nav-label">記錄</span>
      </button>
    </nav>

    <!-- 載入遮罩 -->
    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useLetterStore } from './services/LetterStore.js'
import WelcomePage from './components/WelcomePage.vue'
import HomePage from './components/HomePage.vue'
import SharePage from './components/SharePage.vue'
import LetterPage from './components/LetterPage.vue'
import HistoryPage from './components/HistoryPage.vue'

export default {
  name: 'App',
  components: {
    WelcomePage,
    HomePage,
    SharePage,
    LetterPage,
    HistoryPage
  },
  setup() {
    const { saveLetter } = useLetterStore()
    const currentView = ref('welcome')
    const currentLetter = ref(null)
    const isLoading = ref(false)
    const loadingMessage = ref('載入中...')
    const isDarkMode = ref(false)
    const viewHistory = ref([])
    
    // PWA 安裝相關狀態
    const canInstall = ref(false)
    const deferredPrompt = ref(null)
    const showInstallPrompt = ref(false)

    // 檢查是否首次訪問
    onMounted(() => {
      console.log('🔧 PWA Debug: App mounted, initializing PWA detection...');
      
      // 詳細的環境檢測
      const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasBeforeInstallPrompt = 'onbeforeinstallprompt' in window;
      
      console.log('🔧 PWA Environment Check:', {
        isHTTPS,
        isStandalone,
        hasServiceWorker,
        hasBeforeInstallPrompt,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isLocalhost: location.hostname === 'localhost'
      });

      // 檢查是否已經安裝
      if (isStandalone) {
        console.log('🔧 PWA Debug: App is already running in standalone mode');
        canInstall.value = false;
        return;
      }

      // 強制在開發環境顯示安裝按鈕（用於測試）
      if (location.hostname === 'localhost' && !isStandalone) {
        console.log('🔧 PWA Debug: Development mode - showing install button for testing');
        canInstall.value = true;
        showInstallPrompt.value = true;
      }

      // beforeinstallprompt 事件監聽器
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('🔧 PWA Debug: beforeinstallprompt event triggered');
        // 只在需要時阻止默認行為
        if (!isStandalone) {
          e.preventDefault();
          deferredPrompt.value = e;
          canInstall.value = true;
          showInstallPrompt.value = true;
          console.log('🔧 PWA Debug: Install prompt is now available');
        } else {
          console.log('🔧 PWA Debug: App already in standalone mode, not preventing default');
        }
      });

      // appinstalled 事件監聽器
      window.addEventListener('appinstalled', () => {
        console.log('🔧 PWA Debug: App was installed');
        canInstall.value = false;
        showInstallPrompt.value = false;
        deferredPrompt.value = null;
      });

      // 檢查瀏覽器支援
      setTimeout(() => {
        if (!canInstall.value && !isStandalone) {
          console.log('🔧 PWA Debug: beforeinstallprompt not triggered after 3 seconds');
          console.log('🔧 PWA Debug: This might be due to:');
          console.log('  - Browser doesn\'t support PWA installation');
          console.log('  - PWA criteria not met');
          console.log('  - App already installed');
          console.log('  - User has dismissed the prompt before');
          
          // 在某些情況下仍然顯示按鈕，提供手動安裝指引
          if (hasServiceWorker && isHTTPS) {
            console.log('🔧 PWA Debug: Showing manual install option');
            canInstall.value = true;
            showInstallPrompt.value = true;
          }
        }
      }, 3000);
    })

    // 導航方法
    const goToHome = () => {
      currentView.value = 'home'
      localStorage.setItem('jesus-letters-visited', 'true')
    }

    const goToShare = () => {
      viewHistory.value.push(currentView.value)
      currentView.value = 'share'
    }

    const goToHistory = () => {
      viewHistory.value.push(currentView.value)
      currentView.value = 'history'
    }

    const goBack = () => {
      if (viewHistory.value.length > 0) {
        currentView.value = viewHistory.value.pop()
      } else {
        currentView.value = 'home'
      }
    }

    // 處理信件發送
    const onLetterSent = (letterData) => {
      // 保存信件到存儲
      saveLetter(letterData)
      currentLetter.value = letterData
      currentView.value = 'letter'
    }

    // 查看歷史信件
    const viewLetter = (letterData) => {
      currentLetter.value = letterData
      viewHistory.value.push(currentView.value)
      currentView.value = 'letter'
    }

    // 保存信件 - 使用全局存儲
    const saveLetterHandler = (letterData) => {
      saveLetter(letterData)
    }

    // 主題切換
    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value
      document.body.classList.toggle('dark-mode', isDarkMode.value)
      localStorage.setItem('jesus-letters-theme', isDarkMode.value ? 'dark' : 'light')
    }

    // 獲取頁面標題
    const getPageTitle = () => {
      const titles = {
        home: '聽聽看耶穌會怎麼說',
        share: '我要問事',
        letter: '耶穌的回信',
        history: '歷史記錄'
      }
      return titles[currentView.value] || '聽聽看耶穌會怎麼說'
    }

    // PWA 安裝功能
    const installPWA = async () => {
      console.log('🔧 PWA Debug: Install button clicked');
      
      if (!deferredPrompt.value) {
        console.log('🔧 PWA Debug: No deferred prompt available, showing manual instructions');
        
        // 提供手動安裝指引
        const userAgent = navigator.userAgent.toLowerCase();
        let instructions = '';
        
        if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
          instructions = '在 Chrome 瀏覽器中：\n1. 點擊網址列右側的安裝圖示 ⊕\n2. 或點擊右上角選單 ⋮ → 安裝應用程式';
        } else if (userAgent.includes('edg')) {
          instructions = '在 Edge 瀏覽器中：\n1. 點擊網址列右側的安裝圖示 ⊕\n2. 或點擊右上角選單 ⋯ → 應用程式 → 安裝此網站為應用程式';
        } else if (userAgent.includes('firefox')) {
          instructions = '在 Firefox 瀏覽器中：\n1. 點擊網址列右側的安裝圖示\n2. 或將此頁面加入書籤以便快速存取';
        } else if (userAgent.includes('safari')) {
          instructions = '在 Safari 瀏覽器中：\n1. 點擊分享按鈕 📤\n2. 選擇「加入主畫面」\n3. 點擊「新增」';
        } else {
          instructions = '請在瀏覽器選單中尋找「安裝應用程式」或「加入主畫面」選項';
        }
        
        alert(`無法自動安裝應用程式\n\n${instructions}\n\n這樣就能像原生應用程式一樣使用了！`);
        return;
      }
      
      try {
        console.log('🔧 PWA Debug: Showing install prompt');
        
        // 顯示安裝提示
        const promptResult = await deferredPrompt.value.prompt();
        console.log('🔧 PWA Debug: Prompt result:', promptResult);
        
        // 等待用戶選擇
        const { outcome } = await deferredPrompt.value.userChoice;
        console.log(`🔧 PWA Debug: User choice outcome: ${outcome}`);
        
        if (outcome === 'accepted') {
          console.log('🔧 PWA Debug: User accepted installation');
          // 可以在這裡添加成功安裝的提示
          setTimeout(() => {
            alert('應用程式安裝成功！\n您現在可以在桌面或應用程式列表中找到它。');
          }, 1000);
        } else {
          console.log('🔧 PWA Debug: User dismissed installation');
        }
        
        // 清理
        deferredPrompt.value = null;
        canInstall.value = false;
        
      } catch (error) {
        console.error('🔧 PWA Debug: Installation error:', error);
        
        // 根據錯誤類型提供不同的處理
        if (error.name === 'NotAllowedError') {
          alert('安裝被阻止。請檢查瀏覽器設置或稍後再試。');
        } else if (error.name === 'AbortError') {
          console.log('🔧 PWA Debug: Installation was aborted by user');
        } else {
          alert('安裝過程中發生錯誤，請稍後再試或使用瀏覽器的安裝功能。');
        }
      }
    }

    return {
      currentView,
      currentLetter,
      isLoading,
      loadingMessage,
      isDarkMode,
      canInstall,
      goToHome,
      goToShare,
      goToHistory,
      goBack,
      onLetterSent,
      viewLetter,
      saveLetter: saveLetterHandler,
      toggleTheme,
      getPageTitle,
      installPWA
    }
  }
}
</script>

<style>
:root {
  --primary-color: #4A90E2;
  --secondary-color: #F5A623;
  --success-color: #7ED321;
  --danger-color: #D0021B;
  --warning-color: #F5A623;
  --info-color: #50E3C2;
  
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F9FA;
  --bg-tertiary: #E9ECEF;
  
  --border-color: #DEE2E6;
  --shadow-light: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-medium: 0 4px 8px rgba(0,0,0,0.15);
  --shadow-heavy: 0 8px 16px rgba(0,0,0,0.2);
  
  --border-radius: 8px;
  --border-radius-lg: 12px;
  --transition: all 0.3s ease;
}

.dark-mode {
  --text-primary: #FFFFFF;
  --text-secondary: #CCCCCC;
  --text-muted: #999999;
  
  --bg-primary: #1A1A1A;
  --bg-secondary: #2D2D2D;
  --bg-tertiary: #404040;
  
  --border-color: #404040;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
  transition: var(--transition);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.app-header {
  background: var(--primary-color);
  color: white;
  padding: 1rem;
  box-shadow: var(--shadow-medium);
  position: sticky;
  position: -webkit-sticky; /* Safari compatibility */
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
}

.back-btn:hover {
  background: rgba(255,255,255,0.3);
}

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.install-btn,
.theme-toggle {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.install-btn:hover,
.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.install-btn:active,
.theme-toggle:active {
  transform: scale(0.95);
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  display: flex;
  padding: 0.5rem;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--border-radius);
}

.nav-item:hover,
.nav-item.active {
  color: var(--primary-color);
  background: rgba(74, 144, 226, 0.1);
}

.nav-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: var(--border-radius-lg);
  text-align: center;
  box-shadow: var(--shadow-heavy);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .app-header {
    padding: 0.75rem 1rem;
  }
  
  .app-title {
    font-size: 1.1rem;
  }
  
  .back-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}

/* 滾動條樣式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>