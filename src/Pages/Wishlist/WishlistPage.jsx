import { useState, useEffect } from 'react'
const API_URL = import.meta.env.VITE_API_URL

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch(`${API_URL}/wishlist`)
        const data = await response.json()
        setWishlist(data)
      } catch (error) {
        console.error('Error fetching favorites:', error)
      }
    }

    fetchFavorites()
  }, [])
  return (
    <>
      <div>Wishlist Page</div>
      {wishlist.map((w) => {
        return (
          <div key={w.item_id} className="flex gap-3 justify-between">
            <div>{w.name}</div>
            <div>
              {w.default_quantity} {w.unit}
            </div>
          </div>
        )
      })}
    </>
  )
}
