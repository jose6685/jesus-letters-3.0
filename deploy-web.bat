@echo off
echo 🌐 Jesus Letter WEB版本部署腳本
echo.

REM 構建WEB版本
echo 🔨 開始構建...
call build-web.bat
if errorlevel 1 (
    echo ❌ 構建失敗，停止部署
    exit /b 1
)

echo.
echo 📋 部署選項:
echo 1. 本地預覽 (推薦測試)
echo 2. 複製到指定目錄
echo 3. 創建部署包
echo 4. 顯示部署說明
echo.

set /p choice="請選擇部署方式 (1-4): "

if "%choice%"=="1" goto preview
if "%choice%"=="2" goto copy
if "%choice%"=="3" goto package
if "%choice%"=="4" goto instructions
goto end

:preview
echo 🚀 啟動本地預覽...
npm run preview
goto end

:copy
set /p target="請輸入目標目錄路径: "
if not exist "%target%" mkdir "%target%"
xcopy dist\* "%target%" /s /e /y
echo ✅ 文件已複製到: %target%
goto end

:package
echo 📦 創建部署包...
if exist jesus-letter-web.zip del jesus-letter-web.zip
powershell Compress-Archive -Path dist\* -DestinationPath jesus-letter-web.zip
echo ✅ 部署包已創建: jesus-letter-web.zip
goto end

:instructions
echo.
echo 📖 WEB版本部署說明:
echo.
echo 🌟 靜態文件服務器部署:
echo    - 將 dist/ 目錄內容上傳到服務器
echo    - 支持 Apache, Nginx, IIS 等
echo.
echo 🌟 CDN部署:
echo    - Netlify: 拖拽 dist/ 目錄到 netlify.com
echo    - Vercel: 連接 Git 倉庫自動部署
echo    - GitHub Pages: 上傳到 gh-pages 分支
echo.
echo 🌟 本地測試:
echo    - 運行: npm run preview
echo    - 訪問: http://localhost:3001
echo.
echo 🔧 服務器配置建議:
echo    - 啟用 GZIP 壓縮
echo    - 設置緩存策略
echo    - 配置 HTTPS
echo    - 設置 SPA 路由重定向
echo.

:end
echo.
echo 🎉 部署腳本執行完成！
pause