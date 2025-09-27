// API Base URL 自動偵測功能
async function detectApiBaseUrl(baseUrl) {
  const testPaths = ["", "/api"];
  
  for (const path of testPaths) {
    try {
      const testUrl = `${baseUrl}${path}/health`;
      console.log(`🔍 測試 API 端點: ${testUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超時
      
      const res = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const resolvedUrl = `${baseUrl}${path}`;
        console.log(`✅ API Base URL 確認成功: ${resolvedUrl}`);
        return resolvedUrl;
      }
    } catch (err) {
      console.log(`❌ 測試失敗: ${baseUrl}${path}/health - ${err.message}`);
    }
  }
  
  // 如果 /health 都失敗，嘗試測試其他端點
  for (const path of testPaths) {
    try {
      const testUrl = `${baseUrl}${path}`;
      console.log(`🔍 測試根端點: ${testUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok || res.status === 404) { // 404 也表示服務器有回應
        const resolvedUrl = `${baseUrl}${path}`;
        console.log(`✅ API Base URL 確認成功 (根端點): ${resolvedUrl}`);
        return resolvedUrl;
      }
    } catch (err) {
      console.log(`❌ 根端點測試失敗: ${baseUrl}${path} - ${err.message}`);
    }
  }
  
  throw new Error("無法偵測 API Base URL，請確認後端是否正確部署");
}

// 全局變數存儲解析後的 Base URL
let resolvedBaseUrl = null;

// API配置
export const API_CONFIG = {
  // 原始 Base URL（不包含 /api）
  RAW_BASE_URL: (() => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    // 檢查環境變數是否正確設置（不包含變數名稱）
    if (envUrl && !envUrl.includes('VITE_API_BASE_URL=')) {
      return envUrl;
    }
    // 在生產環境中使用 Vercel 部署的 URL
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      return window.location.origin;
    }
    // 默認本地開發環境
    return 'http://localhost:3002';
  })(),
  
  // 動態解析的 Base URL
  get BASE_URL() {
    return resolvedBaseUrl || this.RAW_BASE_URL;
  },
  
  // API端點
  ENDPOINTS: {
    // AI服務
    AI_GENERATE: '/generate',
    AI_STATUS: '/status',
    AI_TEST: '/test',
    
    // 健康檢查
    HEALTH: '/health',
    HEALTH_DETAILED: '/health/detailed',
    HEALTH_READY: '/health/ready',
    HEALTH_LIVE: '/health/live'
  },
  
  // 請求配置
  TIMEOUT: 30000, // 30秒超時
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒重試延遲
  
  // 請求頭
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// API請求工具函數
export class APIClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
    this.initialized = false
  }

  // 初始化 API 客戶端，自動偵測 Base URL
  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('🚀 開始初始化 API 客戶端...');
      const rawBaseUrl = API_CONFIG.RAW_BASE_URL;
      console.log(`📡 原始 Base URL: ${rawBaseUrl}`);
      
      resolvedBaseUrl = await detectApiBaseUrl(rawBaseUrl);
      this.baseURL = resolvedBaseUrl;
      this.initialized = true;
      
      console.log(`🎯 API 客戶端初始化完成，使用 Base URL: ${resolvedBaseUrl}`);
    } catch (error) {
      console.error('❌ API 客戶端初始化失敗:', error);
      // 使用原始 URL 作為後備
      resolvedBaseUrl = API_CONFIG.RAW_BASE_URL;
      this.baseURL = resolvedBaseUrl;
      this.initialized = true;
      console.log(`🔄 使用後備 Base URL: ${resolvedBaseUrl}`);
    }
  }

  // 確保在請求前已初始化
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // 通用請求方法
  async request(endpoint, options = {}) {
    await this.ensureInitialized();
    
    const url = `${this.baseURL}${endpoint}`
    const config = {
      method: 'GET',
      headers: { ...API_CONFIG.HEADERS },
      timeout: this.timeout,
      ...options
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API請求失敗: ${url}`, error)
      throw error
    }
  }

  // GET請求
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url)
  }

  // POST請求
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT請求
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE請求
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    })
  }
}

// 創建API客戶端實例並自動初始化
export const apiClient = new APIClient()

// 自動初始化 API 客戶端
;(async () => {
  try {
    await apiClient.initialize();
  } catch (error) {
    console.error('API 客戶端自動初始化失敗:', error);
  }
})();

// AI服務API
export const aiAPI = {
  // 生成AI回復
  async generate(data) {
    return apiClient.post(API_CONFIG.ENDPOINTS.AI_GENERATE, data)
  },

  // 獲取AI服務狀態
  async getStatus() {
    return apiClient.get(API_CONFIG.ENDPOINTS.AI_STATUS)
  },

  // 測試AI服務
  async test() {
    return apiClient.get(API_CONFIG.ENDPOINTS.AI_TEST)
  }
}

// 健康檢查API
export const healthAPI = {
  // 基本健康檢查
  async check() {
    return apiClient.get(API_CONFIG.ENDPOINTS.HEALTH)
  },

  // 詳細健康檢查
  async detailed() {
    return apiClient.get(API_CONFIG.ENDPOINTS.HEALTH_DETAILED)
  },

  // 就緒檢查
  async ready() {
    return apiClient.get(API_CONFIG.ENDPOINTS.HEALTH_READY)
  },

  // 存活檢查
  async live() {
    return apiClient.get(API_CONFIG.ENDPOINTS.HEALTH_LIVE)
  }
}