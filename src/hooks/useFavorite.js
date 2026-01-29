import { useState, useEffect } from 'react'
import { useMsal } from '@azure/msal-react'
import axios from 'axios'

export function useFavorites() {
  const [favoriteCount, setFavoriteCount] = useState(0)
  const { instance, accounts } = useMsal()
  const API_URL = import.meta.env.VITE_API_URL

  const fetchFavorites = async () => {
    // 1. ตรวจสอบว่ามี Account พร้อมใช้งานหรือยัง
    const activeAccount = instance.getActiveAccount() || accounts[0];
    if (!activeAccount) return;

    try {
      // 2. ขอ Token สำหรับ Backend Scope (เพื่อให้ค่า aud ถูกต้อง)
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['api://f759d6b0-6c0b-4316-ad63-84ba6492af49/access_as_user'],
        account: activeAccount,
      })

      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      })

      // เช็คโครงสร้าง data ที่มาจาก axios ให้ดีนะครับ (ปกติคือ response.data)
      setFavoriteCount(response.data.length || 0)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  // 3. ให้ทำงานเมื่อ accounts โหลดเสร็จแล้วเท่านั้น
  useEffect(() => {
    if (accounts.length > 0) {
      fetchFavorites()
    }
  }, [accounts, instance])

  return { favoriteCount, fetchFavorites, setFavoriteCount }
}