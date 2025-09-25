# 耶穌的信 3.0 部署指南

## 📱 Android Play商店發佈

### 前置需求
1. **安裝 Java JDK 17 或更高版本**
   - 下載：https://adoptium.net/
   - 設定 JAVA_HOME 環境變數
   - 將 Java bin 目錄加入 PATH

2. **安裝 Android Studio**
   - 下載：https://developer.android.com/studio
   - 安裝 Android SDK
   - 設定 ANDROID_HOME 環境變數

### 建置步驟
```bash
# 1. 建置前端
npm run build

# 2. 同步 Capacitor
npx cap sync

# 3. 建置 Android APK (Debug)
npx cap build android

# 4. 建置 Android AAB (Release - 用於 Play Store)
cd android
./gradlew bundleRelease
```

### Play Store 上傳
1. **準備簽名金鑰**
   ```bash
   keytool -genkey -v -keystore jesus-letter-release.keystore -alias jesus-letter -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **配置簽名** (在 `android/app/build.gradle`)
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('jesus-letter-release.keystore')
               storePassword 'your-store-password'
               keyAlias 'jesus-letter'
               keyPassword 'your-key-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

3. **建置簽名版本**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

4. **上傳到 Play Console**
   - 登入 Google Play Console
   - 創建新應用程式
   - 上傳 `android/app/build/outputs/bundle/release/app-release.aab`

## 🌐 網路版本部署

### 已準備的文件
- ✅ **生產建置**: `dist/` 目錄
- ✅ **部署包**: `jesus-letter-web.zip`

### 部署選項

#### 1. 靜態網站託管
**推薦平台:**
- **Netlify** (免費)
  1. 拖拽 `jesus-letter-web.zip` 到 Netlify
  2. 自動部署完成

- **Vercel** (免費)
  1. 連接 GitHub 倉庫
  2. 自動建置和部署

- **GitHub Pages** (免費)
  1. 上傳 `dist/` 內容到 `gh-pages` 分支
  2. 啟用 GitHub Pages

#### 2. 雲端平台
**AWS S3 + CloudFront:**
```bash
# 上傳到 S3
aws s3 sync dist/ s3://your-bucket-name --delete

# 配置 CloudFront 分發
```

**Google Cloud Storage:**
```bash
# 上傳到 GCS
gsutil -m rsync -r -d dist/ gs://your-bucket-name
```

#### 3. 傳統主機
1. 解壓 `jesus-letter-web.zip`
2. 上傳所有文件到網站根目錄
3. 確保支援 SPA 路由 (配置 fallback 到 index.html)

### 環境配置

#### 後端 API 配置
確保在生產環境中設定正確的 API 端點：

**在 `src/config/api.js`:**
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com/api'
  : 'http://localhost:3002/api';
```

#### 環境變數
創建 `.env.production` 文件：
```
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_TITLE=耶穌的信
```

## 🔧 後端 API 部署

### Docker 部署 (推薦)
```bash
# 建置 Docker 映像
docker build -f Dockerfile.backend -t jesus-letter-api .

# 運行容器
docker run -d -p 3002:3002 --env-file .env.production jesus-letter-api
```

### 雲端平台部署
- **Railway**: 連接 GitHub，自動部署
- **Render**: 免費方案，支援 Node.js
- **Heroku**: 經典選擇
- **DigitalOcean App Platform**: 簡單易用

## 📋 發佈檢查清單

### Android 發佈前
- [ ] 更新版本號 (`android/app/build.gradle`)
- [ ] 測試所有功能
- [ ] 檢查權限設定
- [ ] 準備應用程式圖示和截圖
- [ ] 撰寫應用程式描述

### 網路發佈前
- [ ] 測試生產建置
- [ ] 檢查 API 端點配置
- [ ] 測試所有頁面和功能
- [ ] 檢查 SEO 設定
- [ ] 配置 HTTPS

## 🚀 自動化部署

### GitHub Actions 範例
創建 `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './dist'
```

## 📞 支援

如需協助，請參考：
- [Capacitor 文檔](https://capacitorjs.com/docs)
- [Vue.js 部署指南](https://vuejs.org/guide/best-practices/production-deployment.html)
- [Google Play Console 說明](https://support.google.com/googleplay/android-developer)