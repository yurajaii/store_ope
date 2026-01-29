import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

  // 1. จัดการ Account Active
  useEffect(() => {
    if (accounts.length > 0 && !instance.getActiveAccount()) {
      instance.setActiveAccount(accounts[0])
    }
  }, [accounts, instance])

  // 2. ดึงข้อมูลจาก Backend ครั้งเดียว
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && accounts.length > 0 && !user) {
        setLoading(true)
        try {
          // 1. ขอ Token สำหรับ Microsoft Graph (เพื่อเอา displayName, mail)
          const graphTokenRes = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: accounts[0],
          })

          const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${graphTokenRes.accessToken}` },
          })
          const { displayName, mail, jobTitle, officeLocation } = await graphRes.json()

          // 2. ขอ Token สำหรับ Backend ของคุณ (เพื่อให้ aud ตรงกับ api://f759d6b0...)
          const backendTokenRes = await instance.acquireTokenSilent({
            scopes: ['api://f759d6b0-6c0b-4316-ad63-84ba6492af49/access_as_user'],
            account: accounts[0],
          })
          console.log(backendTokenRes)
          // 3. ส่งข้อมูลไปที่ Backend
          const backendRes = await fetch(`${API_URL}/auth/me`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${backendTokenRes.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ displayName, mail, jobTitle, officeLocation }),
          })

          const data = await backendRes.json()
          if (data.success) {
            setUser(data.user)
          }
          // ใน App.jsx ส่วน catch ของ fetchUserData
        } catch (e) {
          if (e.name === 'InteractionRequiredAuthError') {
            // ใช้ Redirect แทน Popup เพื่อเลี่ยงปัญหาโดน Browser บล็อค
            instance.acquireTokenRedirect({
              scopes: ['api://f759d6b0-6c0b-4316-ad63-84ba6492af49/access_as_user'],
            })
          }
          console.error('❌ Backend Sync Error:', e)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchUserData()
  }, [isAuthenticated, accounts, instance, API_URL, user, setLoading, setUser])

  // 3. หน้า Loading ระหว่างรอ Backend ตอบกลับ (สำคัญมาก!)
  if (isAuthenticated && !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center font-[prompt]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังเตรียมข้อมูลระบบ...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="w-full h-screen bg-gray-100 font-[prompt] flex">
        {isAuthenticated && user ? (
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
                  element={user.role === 'system_admin' ? <AdminPage /> : <Navigate to="/" />}
                />
                <Route path="*" element={<Navigate to="/" />} />
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
