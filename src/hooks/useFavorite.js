import { useState, useEffect } from 'react'
import { useMsal } from '@azure/msal-react'
import api from '../Utils/api'

export function useFavorites() {
  const [favoriteCount, setFavoriteCount] = useState(0)
  const { accounts } = useMsal()

  const fetchFavorites = async () => {
    // ไม่ต้องดึง instance มาขอ token เองแล้ว
    // ไม่ต้องเช็ค activeAccount เอง เพราะ api.js จัดการให้
    if (accounts.length === 0) return

    try {
      // 2. เรียกใช้ Interceptor จะแอบใส่ Authorization: Bearer <token> ให้เองอัตโนมัติ
      const response = await api.get('/wishlist')
      setFavoriteCount(response.data.length || 0)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  useEffect(() => {
    if (accounts.length > 0) {
      fetchFavorites()
    }
  }, [accounts]) 

  return { favoriteCount, fetchFavorites, setFavoriteCount }
}
