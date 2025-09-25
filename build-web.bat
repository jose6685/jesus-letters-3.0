@echo off
echo 🚀 開始構建 Jesus Letter WEB版本...
echo.

REM 設置生產環境變量
set NODE_ENV=production

REM 清理之前的構建
echo 🧹 清理之前的構建文件...
if exist dist rmdir /s /q dist
echo.

REM 安裝依賴（如果需要）
echo 📦 檢查依賴...
npm ci --only=production
echo.

REM 構建前端
echo 🔨 構建前端應用...
npm run build
echo.

REM 檢查構建結果
if exist dist (
    echo ✅ WEB版本構建成功！
    echo 📁 構建文件位於: dist/
    echo 🌐 可以部署到任何靜態文件服務器
    echo.
    echo 📊 構建統計:
    dir dist /s
) else (
    echo ❌ 構建失敗！
    exit /b 1
)

echo.
echo 🎉 WEB版本準備完成！
pause