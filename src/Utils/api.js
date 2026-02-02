// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// สร้างตัวแปรไว้เก็บ instance
let _msalInstance = null;

// ฟังก์ชันสำหรับให้ main.jsx ส่ง instance มาให้
export const injectMsalInstance = (instance) => {
  _msalInstance = instance;
};

api.interceptors.request.use(async (config) => {
  // ถ้ายังไม่มี instance (เช่น ช่วงเสี้ยววินาทีแรกที่แอปโหลด) ให้ข้ามไปก่อน
  if (!_msalInstance) return config;

  const activeAccount = _msalInstance.getActiveAccount();
  const accounts = _msalInstance.getAllAccounts();
  const account = activeAccount || accounts[0];

  if (account) {
    try {
      const response = await _msalInstance.acquireTokenSilent({
        scopes: ['api://f759d6b0-6c0b-4316-ad63-84ba6492af49/access_as_user'],
        account: account,
      });
      config.headers.Authorization = `Bearer ${response.accessToken}`;
    } catch (error) {
      console.warn("Silent token acquisition failed", error);
    }
  }
  return config;
}, (error) => Promise.reject(error));

export default api;