import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { useEffect, useContext } from 'react'
import SideBar from './components/SideBar'
import HomePage from './Pages/Home/HomePage'
import CategoryPage from './Pages/Category/CategoryPage'
import Package from './Pages/Item/ItemPage'
import LogPage from './Pages/Log/LogPage'
import WithdrawPage from './Pages/Withdraw/WithdrawPage'
import WishlistPage from './Pages/Wishlist/WishlistPage'
import { LoginPage } from './Pages/Login/LoginPage'
import { AdminPage } from './Pages/Admin/AdminPage'
import { FloatingCartButton } from './components/FAB'
import { useFavorites } from './hooks/useFavorite'
import { UserContext } from './Context/UserContextInstance'

export default function App() {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const { favoriteCount, fetchFavorites } = useFavorites()
  const { user, setUser, setLoading } = useContext(UserContext)

  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    if (accounts.length > 0 && !instance.getActiveAccount()) {
      instance.setActiveAccount(accounts[0])
    }
    if (!isAuthenticated) {
      setUser(null)
    }
  }, [accounts, instance, isAuthenticated, setUser])

  useEffect(() => {
    const fetchAllUserData = async () => {
      if (isAuthenticated && accounts.length > 0) {
        setLoading(true)
        try {
          const response = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: accounts[0],
          })
          const token = response.accessToken

          // ยิงคู่ขนานเพื่อความเร็ว (Optional)
          const [graphRes, backendRes] = await Promise.all([
            fetch('https://graph.microsoft.com/v1.0/me', {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/auth`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ])

          const graphData = await graphRes.json()
          const backendData = await backendRes.json()

          // ✅ รวมร่างข้อมูลให้เป็นก้อนเดียว
          const fullUser = {
            ...graphData, // ข้อมูลจาก Microsoft
            role: backendData.items, // ใช้ค่า system_admin จาก backend เก็บในชื่อ role ให้เรียกง่าย
            dbId: backendData.id, // เก็บ id จาก DB แยกไว้
          }

          setUser(fullUser)
          // console.log('✅ Combined User:', fullUser)
        } catch (e) {
          console.error('❌ Sync Error:', e)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchAllUserData()
  }, [isAuthenticated, accounts, instance, setUser, setLoading, API_URL])

  // console.log('account',accounts[0])
  // console.log('instance',instance);
  console.log('User', user)
  return (
    <BrowserRouter>
      <div className="w-full h-screen bg-gray-100 font-[prompt] flex">
        {/* ถ้าล็อกอินแล้วค่อยโชว์ SideBar และเนื้อหา */}
        {isAuthenticated ? (
          <>
            <SideBar />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/category" element={<CategoryPage />} />
                <Route path="/items" element={<Package onUpdate={fetchFavorites} />} />
                <Route path="/withdraw" element={<WithdrawPage />} />
                <Route path="/logs" element={<LogPage />} />
                <Route path="/wishlist" element={<WishlistPage onUpdate={fetchFavorites} />} />
                <Route
                  path="/admin"
                  element={user?.role === 'system_admin' ? <AdminPage /> : <HomePage />}
                />
              </Routes>
              <FloatingCartButton count={favoriteCount} />
            </main>
          </>
        ) : (
          <Routes>
            <Route path="*" element={<LoginPage />} />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  )
}
