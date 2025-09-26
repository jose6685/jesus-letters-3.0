# 部署指南

本文檔詳細說明如何將 JesusLetter 應用部署到 Vercel 平台，包括手動部署和自動部署設置。

## 前置準備

### 1. 註冊 Vercel 帳戶
- 訪問 [Vercel](https://vercel.com) 並註冊帳戶
- 建議使用 GitHub 帳戶登錄以便後續集成

### 2. 安裝 Vercel CLI
```bash
npm i -g vercel
```

### 3. 準備環境變量
確保您有以下必要的環境變量：
- `OPENAI_API_KEY` - OpenAI API 密鑰
- `VITE_API_BASE_URL` - 前端 API 基礎 URL

## 手動部署

### 方法一：使用 Vercel CLI

1. **登錄 Vercel**
   ```bash
   vercel login
   ```

2. **初始化項目**
   ```bash
   vercel
   ```
   按照提示完成項目設置

3. **設置環境變量**
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add VITE_API_BASE_URL
   ```

4. **部署到生產環境**
   ```bash
   vercel --prod
   ```

### 方法二：通過 Vercel 控制台

1. 登錄 [Vercel 控制台](https://vercel.com/dashboard)
2. 點擊 "New Project"
3. 導入您的 GitHub 倉庫
4. 配置構建設置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加環境變量
6. 點擊 "Deploy"

## 自動部署設置

### 1. GitHub Actions 設置

項目已包含 `.github/workflows/deploy.yml` 文件，需要在 GitHub 倉庫中設置以下 Secrets：

#### 必需的 GitHub Secrets

1. **VERCEL_TOKEN**
   - 在 Vercel 控制台 → Settings → Tokens 創建
   - 複製 token 並添加到 GitHub Secrets

2. **ORG_ID**
   - 在 Vercel 控制台 → Settings → General 找到
   - 複製 Team ID 並添加到 GitHub Secrets

3. **PROJECT_ID**
   - 在項目設置頁面的 General 標籤找到
   - 複製 Project ID 並添加到 GitHub Secrets

4. **VITE_API_BASE_URL**
   - 您的後端 API URL
   - 例如：`https://your-backend.vercel.app`

#### 設置步驟

1. 進入 GitHub 倉庫
2. 點擊 Settings → Secrets and variables → Actions
3. 點擊 "New repository secret"
4. 添加上述所有 secrets

### 2. Vercel 項目配置

確保 `vercel.json` 文件配置正確：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/app.js"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

## 分離部署（前後端分開）

### 前端部署

1. **創建前端專用倉庫**
   ```bash
   # 只包含前端代碼
   git subtree push --prefix=src origin frontend-branch
   ```

2. **配置前端 vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build"
       }
     ]
   }
   ```

### 後端部署

1. **創建後端專用倉庫**
   ```bash
   # 只包含後端代碼
   git subtree push --prefix=server origin backend-branch
   ```

2. **配置後端 vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "app.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/app.js"
       }
     ]
   }
   ```

## 環境配置

### 開發環境
```env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001
```

### 生產環境
```env
NODE_ENV=production
VITE_API_BASE_URL=https://your-backend.vercel.app
```

## 域名配置

### 1. 自定義域名

1. 在 Vercel 項目設置中點擊 "Domains"
2. 添加您的自定義域名
3. 按照提示配置 DNS 記錄

### 2. SSL 證書

Vercel 自動為所有域名提供 SSL 證書，無需額外配置。

## 監控和日誌

### 1. 查看部署日誌
- 在 Vercel 控制台的 "Functions" 標籤查看
- 使用 `vercel logs` 命令查看實時日誌

### 2. 性能監控
- Vercel Analytics 提供性能指標
- 在項目設置中啟用 Analytics

### 3. 錯誤追蹤
```javascript
// 在前端添加錯誤處理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});
```

## 故障排除

### 常見問題

1. **構建失敗**
   - 檢查 Node.js 版本兼容性
   - 確認所有依賴都已正確安裝
   - 查看構建日誌中的錯誤信息

2. **API 請求失敗**
   - 確認 CORS 設置正確
   - 檢查環境變量是否正確設置
   - 驗證 API 端點是否可訪問

3. **靜態資源 404**
   - 檢查 `vercel.json` 中的路由配置
   - 確認構建輸出目錄正確

### 調試命令

```bash
# 本地測試構建
npm run build
npm run preview

# 檢查 Vercel 配置
vercel inspect

# 查看部署狀態
vercel ls

# 查看實時日誌
vercel logs --follow
```

## 回滾部署

### 1. 通過控制台回滾
1. 在 Vercel 控制台進入項目
2. 點擊 "Deployments" 標籤
3. 找到要回滾的版本
4. 點擊 "Promote to Production"

### 2. 通過 CLI 回滾
```bash
# 查看部署歷史
vercel ls

# 回滾到指定版本
vercel promote <deployment-url>
```

## 最佳實踐

1. **環境分離**
   - 使用不同的 Vercel 項目管理不同環境
   - 開發、測試、生產環境分別部署

2. **版本管理**
   - 使用 Git 標籤標記發布版本
   - 在部署前進行充分測試

3. **性能優化**
   - 啟用 Vercel Edge Network
   - 使用適當的緩存策略
   - 監控 Core Web Vitals

4. **安全性**
   - 定期更新依賴包
   - 使用環境變量管理敏感信息
   - 啟用適當的 CORS 策略

## 成本優化

1. **函數執行時間**
   - 優化 API 響應時間
   - 使用適當的緩存策略

2. **帶寬使用**
   - 壓縮靜態資源
   - 使用 CDN 加速

3. **監控使用量**
   - 定期檢查 Vercel 使用統計
   - 設置使用量警報

---

如有任何部署問題，請參考 [Vercel 官方文檔](https://vercel.com/docs) 或創建 GitHub Issue。