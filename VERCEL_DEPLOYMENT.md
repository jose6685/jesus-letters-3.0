# 🚀 Vercel 部署指南 - 耶穌的信 3.0

## 📋 部署前準備

### 1. 確認文件結構
```
JesusLtter/
├── dist/                 # 建置輸出目錄
├── server/              # 後端API (可選)
├── vercel.json          # Vercel配置
├── .vercelignore        # 忽略文件
└── package.json         # 專案配置
```

### 2. 環境變數設定
在Vercel控制台設定以下環境變數：
- `NODE_ENV=production`
- `GEMINI_API_KEY=your_gemini_api_key`
- `OPENAI_API_KEY=your_openai_api_key`

## 🌐 部署方式

### 方式一：GitHub 連接 (推薦)
1. 將代碼推送到GitHub倉庫
2. 登入 [Vercel](https://vercel.com)
3. 點擊 "New Project"
4. 選擇GitHub倉庫
5. 配置環境變數
6. 點擊 "Deploy"

### 方式二：Vercel CLI
```bash
# 安裝Vercel CLI
npm i -g vercel

# 登入Vercel
vercel login

# 部署
vercel --prod
```

### 方式三：拖拽部署
1. 壓縮 `dist/` 目錄內容
2. 拖拽到 [Vercel部署頁面](https://vercel.com/new)
3. 配置環境變數

## ⚙️ 配置說明

### vercel.json 配置
- **靜態建置**: 使用 `@vercel/static-build`
- **路由配置**: SPA路由支援
- **API路由**: `/api/*` 路由到後端
- **環境變數**: 生產環境配置

### 建置命令
- **建置命令**: `npm run build`
- **輸出目錄**: `dist`
- **Node版本**: 18.x

## 🔧 後端API部署 (可選)

如果需要部署後端API到Vercel：

1. 修改 `server/app.js` 為Serverless函數
2. 創建 `api/` 目錄
3. 移動路由文件到 `api/`
4. 更新 `vercel.json` 配置

## 📱 域名配置

### 自定義域名
1. 在Vercel控制台選擇專案
2. 進入 "Settings" > "Domains"
3. 添加自定義域名
4. 配置DNS記錄

### SSL證書
Vercel自動提供免費SSL證書

## 🚀 部署後檢查

### 功能測試
- [ ] 首頁載入正常
- [ ] AI對話功能
- [ ] 歷史記錄
- [ ] 分享功能
- [ ] PWA安裝

### 性能優化
- [ ] 檢查Lighthouse分數
- [ ] 確認CDN快取
- [ ] 測試載入速度

## 🔄 自動部署

### GitHub Actions (可選)
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📊 監控和分析

### Vercel Analytics
- 啟用Vercel Analytics
- 監控訪問量和性能
- 查看用戶行為數據

### 錯誤追蹤
- 配置錯誤日誌
- 設定警報通知
- 監控API響應時間

## 🛠️ 故障排除

### 常見問題
1. **建置失敗**: 檢查Node版本和依賴
2. **路由404**: 確認SPA路由配置
3. **API錯誤**: 檢查環境變數設定
4. **載入緩慢**: 優化資源大小

### 調試工具
- Vercel函數日誌
- 瀏覽器開發者工具
- Network面板分析

## 📞 支援資源

- [Vercel文檔](https://vercel.com/docs)
- [Vue.js部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Capacitor Web部署](https://capacitorjs.com/docs/web)

---

**部署完成後，您的應用將可在 `https://your-project.vercel.app` 訪問！** 🎉