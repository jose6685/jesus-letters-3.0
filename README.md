# 耶穌的信 (Jesus Letter)

一個基於 Vue.js 和 Node.js 的 AI 驅動的基督教信仰應用，讓用戶可以向耶穌傾訴心聲並獲得充滿愛與智慧的回應。

## 功能特色

- 🙏 **AI 信件生成**: 基於用戶輸入生成個人化的耶穌回信
- 📖 **引導禱告**: 提供相應的禱告文本幫助用戶靈修
- 📚 **聖經經文**: 自動匹配相關的聖經經文
- 💾 **本地存儲**: 安全地保存對話記錄在本地
- 🎵 **語音播放**: 支持文字轉語音功能
- 📱 **PWA 支持**: 可安裝為手機應用
- 🌙 **深色模式**: 支持明暗主題切換
- 📤 **匯出功能**: 支持 PDF、Word、圖片等格式匯出

## 技術架構

### 前端
- **Vue 3** - 現代化的前端框架
- **Vite** - 快速的構建工具
- **PWA** - 漸進式網頁應用支持
- **Speech API** - 語音合成功能
- **Canvas API** - 圖片生成功能

### 後端
- **Node.js** - 服務器運行環境
- **Express.js** - Web 應用框架
- **OpenAI API** - AI 文本生成
- **Rate Limiting** - 請求頻率限制
- **CORS** - 跨域資源共享

## 本地開發環境設置

### 前置要求

- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器
- OpenAI API 密鑰

### 安裝步驟

1. **克隆項目**
   ```bash
   git clone <repository-url>
   cd JesusLtter
   ```

2. **安裝前端依賴**
   ```bash
   npm install
   ```

3. **安裝後端依賴**
   ```bash
   cd server
   npm install
   ```

4. **配置環境變量**
   
   在 `server` 目錄下創建 `.env` 文件：
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

### 本地啟動

1. **啟動後端服務器**
   ```bash
   cd server
   npm start
   ```
   後端服務將在 `http://localhost:3001` 運行

2. **啟動前端開發服務器**
   ```bash
   # 在項目根目錄
   npm run dev
   ```
   前端應用將在 `http://localhost:5173` 運行

3. **訪問應用**
   
   打開瀏覽器訪問 `http://localhost:5173`

## 生產環境部署

### Vercel 部署 (推薦)

#### 前端部署

1. **準備部署**
   ```bash
   npm run build
   ```

2. **Vercel CLI 部署**
   ```bash
   # 安裝 Vercel CLI
   npm i -g vercel
   
   # 登錄 Vercel
   vercel login
   
   # 部署
   vercel --prod
   ```

3. **GitHub 自動部署**
   - 將代碼推送到 GitHub
   - 在 Vercel 控制台連接 GitHub 倉庫
   - 配置自動部署

#### 後端部署

1. **創建 `vercel.json` 配置**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/app.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "server/app.js"
       }
     ],
     "env": {
       "OPENAI_API_KEY": "@openai-api-key"
     }
   }
   ```

2. **設置環境變量**
   ```bash
   vercel env add OPENAI_API_KEY
   ```

3. **部署後端**
   ```bash
   cd server
   vercel --prod
   ```

### 其他部署選項

#### Netlify 部署

1. **構建前端**
   ```bash
   npm run build
   ```

2. **部署到 Netlify**
   - 將 `dist` 目錄上傳到 Netlify
   - 或連接 GitHub 倉庫自動部署

#### 傳統服務器部署

1. **構建應用**
   ```bash
   npm run build
   ```

2. **配置 Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/dist;
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **使用 PM2 管理後端進程**
   ```bash
   npm install -g pm2
   cd server
   pm2 start app.js --name "jesus-letter-api"
   ```

## 環境變量配置

### 後端環境變量

| 變量名 | 描述 | 默認值 | 必需 |
|--------|------|--------|------|
| `OPENAI_API_KEY` | OpenAI API 密鑰 | - | ✅ |
| `PORT` | 服務器端口 | 3001 | ❌ |
| `NODE_ENV` | 運行環境 | development | ❌ |
| `CORS_ORIGIN` | 允許的跨域來源 | * | ❌ |
| `RATE_LIMIT_WINDOW` | 速率限制時間窗口(分鐘) | 15 | ❌ |
| `RATE_LIMIT_MAX` | 速率限制最大請求數 | 100 | ❌ |

### 前端環境變量

| 變量名 | 描述 | 默認值 | 必需 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | 後端 API 基礎 URL | http://localhost:3001 | ❌ |

## 項目結構

```
JesusLtter/
├── public/                 # 靜態資源
│   ├── icons/             # PWA 圖標
│   └── manifest.json      # PWA 配置
├── src/                   # 前端源碼
│   ├── components/        # Vue 組件
│   ├── services/          # 服務層
│   ├── styles/           # 樣式文件
│   └── main.js           # 入口文件
├── server/               # 後端源碼
│   ├── routes/           # 路由處理
│   ├── middleware/       # 中間件
│   └── app.js           # 服務器入口
├── dist/                # 構建輸出
└── package.json         # 項目配置
```

## API 文檔

### 生成信件

**POST** `/api/generate`

**請求體:**
```json
{
  "userInput": "用戶的禱告或心聲"
}
```

**響應:**
```json
{
  "aiResponse": {
    "jesusLetter": "耶穌的回信內容",
    "guidedPrayer": "引導禱告內容",
    "biblicalReferences": ["相關聖經經文"]
  }
}
```

### 健康檢查

**GET** `/api/health`

**響應:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 開發指南

### 代碼規範

- 使用 ESLint 進行代碼檢查
- 遵循 Vue.js 官方風格指南
- 使用 Prettier 進行代碼格式化

### 提交規範

使用 Conventional Commits 格式：
```
feat: 新功能
fix: 修復問題
docs: 文檔更新
style: 代碼格式調整
refactor: 代碼重構
test: 測試相關
chore: 構建或輔助工具變動
```

### 測試

```bash
# 運行前端測試
npm run test

# 運行後端測試
cd server
npm test
```

## 故障排除

### 常見問題

1. **API 請求失敗**
   - 檢查 OpenAI API 密鑰是否正確
   - 確認後端服務是否正常運行
   - 檢查網絡連接

2. **PWA 安裝問題**
   - 確保使用 HTTPS 協議
   - 檢查 manifest.json 配置
   - 清除瀏覽器緩存

3. **語音播放不工作**
   - 檢查瀏覽器是否支持 Speech API
   - 確認用戶已授權音頻播放
   - 嘗試不同的瀏覽器

### 日誌查看

```bash
# 查看後端日誌
cd server
npm run logs

# 查看 PM2 日誌
pm2 logs jesus-letter-api
```

## 貢獻指南

1. Fork 項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 創建 Pull Request

## 許可證

本項目採用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 聯繫方式

如有問題或建議，請通過以下方式聯繫：

- 創建 GitHub Issue
- 發送郵件至 [your-email@example.com]

## 致謝

- OpenAI 提供的 GPT API
- Vue.js 社區的優秀工具和資源
- 所有貢獻者的支持和幫助

---

願神祝福這個項目，讓更多人能夠感受到主的愛與恩典。🙏