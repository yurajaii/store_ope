import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
import { useContext } from 'react'
import { UserContext } from '@/Context/UserContextInstance'
import { useMsal } from '@azure/msal-react'
import { LogIn, LogOut, Shield } from 'lucide-react'
import { loginRequest } from '@/authConfig'

export function LoginPage() {
  const { instance } = useMsal()
  const { logout: contextLogout } = useContext(UserContext)

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => console.error(e))
  }

  const handleLogout = () => {
    contextLogout()
    instance
      .logoutRedirect({
        postLogoutRedirectUri: window.location.origin,
      })
      .catch((e) => console.error(e))
  }

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-primary via-primary to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-linear-to-r from-primary to-secondary p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">ยินดีต้อนรับ</h1>
            <p className="text-white/90 text-sm">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <AuthenticatedTemplate>
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600">คุณได้เข้าสู่ระบบแล้ว</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  ออกจากระบบ
                </button>
              </div>
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
              <div className="space-y-6">
                <div className="text-center text-gray-600 mb-6">
                  <p className="text-sm">เข้าสู่ระบบด้วยบัญชี Microsoft ของคุณ</p>
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full bg-linear-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  เข้าสู่ระบบ
                </button>
                
                {/* Additional Info */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    การเข้าสู่ระบบหมายความว่าคุณยอมรับ
                    <br />
                    <span className="text-primary hover:underline cursor-pointer">เงื่อนไขการใช้งาน</span>
                    {' '}และ{' '}
                    <span className="text-primary hover:underline cursor-pointer">นโยบายความเป็นส่วนตัว</span>
                  </p>
                </div>
              </div>
            </UnauthenticatedTemplate>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </div>
  )
}