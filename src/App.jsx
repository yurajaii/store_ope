import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SideBar from './components/SideBar'
import HomePage from './Pages/Home/HomePage'
import CategoryPage from './Pages/Category/CategoryPage'
import Package from './Pages/Item/ItemPage'
import LogPage from './Pages/Log/LogPage'
import WithdrawPage from './Pages/Withdraw/WithdrawPage'
import WishlistPage from './Pages/Wishlist/WishlistPage'
import { FloatingCartButton } from './components/FAB'

export default function App() {
  const [favoriteCount, setFavoriteCount] = useState(0)
  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch(`${API_URL}/wishlist`)
        const data = await response.json()
        setFavoriteCount(data.length)
      } catch (error) {
        console.error('Error fetching favorites:', error)
      }
    }

    fetchFavorites()
  }, [])

  return (
    <BrowserRouter>
      <div className="w-full h-screen bg-gray-100 font-[prompt] flex">
        <SideBar />

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/items" element={<Package />} />
            <Route path="/withdraw" element={<WithdrawPage />} />
            <Route path="/logs" element={<LogPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
          </Routes>
          <FloatingCartButton count={favoriteCount} />
        </main>
      </div>
    </BrowserRouter>
  )
}
