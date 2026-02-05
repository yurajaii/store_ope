import { useEffect, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import api from './Utils/api'

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
  // Provider ของ msal จะได้มาก็ต่อเมื่อ login สำเร็จ
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  const { favoriteCount, fetchFavorites } = useFavorites()

  const { user, setUser, setLoading } = useContext(UserContext)

  // #################################### คือเอา msal instant, account มันอัพเดท backend ของเรา คือเราจะไม่ได้ใช้ข้อมูลจาก msal อย่างเดียว แต่จะใช้การยืนยันตัวคนและข้อมูลจาก msal บันทึกลง db แล้ว CRUD ในนั้น
  // 1. จัดการ Account Active
  useEffect(() => {
    if (accounts.length > 0 && !instance.getActiveAccount()) {
      instance.setActiveAccount(accounts[0])
    }
  }, [accounts, instance])

  // 2. ดึงข้อมูลจาก Backend ครั้งเดียว
  useEffect(() => {
    const fetchUserData = async () => {
      // เงื่อนไข: ต้องล็อคอินแล้ว มีบัญชี และยังไม่ได้โหลดข้อมูล User เข้า Context
      if (isAuthenticated && accounts.length > 0 && !user) {
        setLoading(true)
        try {
          // ก. ขอ Token สำหรับ Microsoft Graph (อันนี้ยังใช้ fetch แยกต่างหากได้เพราะ scope คนละตัว)+
          const graphTokenRes = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: accounts[0],
          })

          const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${graphTokenRes.accessToken}` },
          })
          const profile = await graphRes.json()

          // ข. ส่งข้อมูลไปที่ Backend โดยใช้ api.js
          // *** ไม่ต้องใส่ headers Authorization เองแล้ว เพราะ Interceptor ใน api.js จัดการให้! ***
          const response = await api.post('/auth/me', {
            displayName: profile.displayName,
            mail: profile.mail,
            jobTitle: profile.jobTitle,
            officeLocation: profile.officeLocation,
          })

          if (response.data.success) {
            setUser(response.data.user)
          }
        } catch (e) {
          console.error('❌ Backend Sync Error:', e)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchUserData()
  }, [isAuthenticated, accounts, instance, user, setLoading, setUser])

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
            <Toaster position="top-right" reverseOrder={false} />
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
