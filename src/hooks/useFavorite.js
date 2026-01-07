import { useState, useEffect } from 'react'

export function useFavorites() {
  const [favoriteCount, setFavoriteCount] = useState(0)
  const API_URL = import.meta.env.VITE_API_URL

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${API_URL}/wishlist`)
      const data = await response.json()
      setFavoriteCount(data.length)
      return data
    } catch (error) {
      console.error('Error fetching favorites:', error)
      return []
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  return { favoriteCount, fetchFavorites, setFavoriteCount }
}