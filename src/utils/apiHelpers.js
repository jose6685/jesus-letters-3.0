/**
 * API 輔助函數
 * 提供 axios 和 fetch 兩種實現方式
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://jesus-letters-3-0.onrender.com";

// ✅ axios 寫法（推薦）
import axios from "axios";

// Health 檢查 (GET)
export async function checkHealth() {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/health`);
    console.log("✅ Health:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Health check failed:", err.response?.data || err.message);
    throw err;
  }
}

// AI 呼叫 (POST)
export async function askAI(prompt) {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/ai`, { prompt });
    console.log("✅ AI Response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ AI call failed:", err.response?.data || err.message);
    throw err;
  }
}

// ✅ fetch 寫法
// Health 檢查 (GET)
export async function checkHealthFetch() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    const data = await res.json();
    console.log("✅ Health:", data);
    return data;
  } catch (err) {
    console.error("❌ Health check failed:", err);
    throw err;
  }
}

// AI 呼叫 (POST)
export async function askAIFetch(prompt) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    console.log("✅ AI Response:", data);
    return data;
  } catch (err) {
    console.error("❌ AI call failed:", err);
    throw err;
  }
}