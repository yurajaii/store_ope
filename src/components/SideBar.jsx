import { useState, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  House,
  Package,
  Group,
  FileClock,
  Menu,
  X,
  Files,
  Shield,
  LogOut,
  User,
} from 'lucide-react'
import { UserContext } from '../Context/UserContextInstance'
import { useMsal } from '@azure/msal-react'

export default function SideBar() {
  const [open, setOpen] = useState(false)
  const { user, logout: contextLogout } = useContext(UserContext)

  const { instance } = useMsal()
  const handleLogout = () => {
    contextLogout()

    sessionStorage.clear()
    localStorage.clear()

    instance
      .logoutRedirect({
        postLogoutRedirectUri: window.location.origin,
        onRedirectNavigate: () => false,
      })
      .catch((e) => console.error(e))
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 flex items-center px-4 bg-white z-50 shadow-lg">
        <button
          onClick={() => setOpen(true)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-primary" />
        </button>
        <h1 className="ml-3  text-primary text-lg font-bold tracking-wide">OPF Warehouse</h1>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        bg-primary text-white
        flex flex-col
        transition-transform duration-300 ease-in-out
        shadow-2xl

        /* Mobile */
        fixed top-0 left-0 z-50
        h-screen w-72
        ${open ? 'translate-x-0' : '-translate-x-full'}

        /* Desktop */
        md:relative md:translate-x-0
        md:h-screen md:w-64 lg:w-72
        md:shadow-xl
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">OPF Warehouse</h1>
          </div>
          <button
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-linear-to-br from-secondary to-primary rounded-full flex items-center justify-center shadow-md">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/60 font-medium">สวัสดี</p>
              <p className="text-white font-semibold truncate">{user?.job_title || 'ผู้ใช้งาน'}</p>
              <p className="text-sm text-white/60 font-medium  truncate">
                {user?.office_location || 'ไม่ทราบหน่วยงาน'}
              </p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="flex flex-col flex-1 justify-between overflow-y-auto">
          {/* Main Menu */}
          <nav className="px-3 py-4 space-y-2">
            <MenuItem icon={<House size={20} />} label="หน้าแรก" path="/" setOpen={setOpen} />
            <MenuItem
              icon={<Group size={20} />}
              label="หมวดหมู่"
              path="/category"
              setOpen={setOpen}
            />
            <MenuItem
              icon={<Package size={20} />}
              label="รายการพัสดุ"
              path="/items"
              setOpen={setOpen}
            />
            <MenuItem
              icon={<Files size={20} />}
              label="รายการเบิก"
              path="/withdraw"
              setOpen={setOpen}
            />
            <MenuItem
              icon={<FileClock size={20} />}
              label="การเคลื่อนไหว"
              path="/logs"
              setOpen={setOpen}
            />
          </nav>

          {/* Bottom Menu */}
          <div className="px-3 pb-4 space-y-1 pt-4">
            {(user?.role === 'system_admin' || user?.role === 'user_admin') && (
              <MenuItem
                icon={<Shield size={20} />}
                label="จัดการผู้ใช้"
                path="/admin"
                setOpen={setOpen}
              />
            )}
            <MenuItem
              icon={<LogOut size={20} />}
              label="ออกจากระบบ"
              path="*"
              onClick={handleLogout}
              isLogout
            />
          </div>
        </div>
      </aside>
    </>
  )
}

function MenuItem({ icon, label, path, setOpen, onClick, isLogout = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname === path

  const handleClick = () => {
    if (onClick) {
      onClick()
    }

    if (path && path !== '*') {
      navigate(path)
    }

    if (setOpen) setOpen(false)
  }

  return (
    <div
      className={`
        flex items-center gap-3
        px-4 py-3 rounded-xl
        transition-all duration-200
        cursor-pointer
        group
        ${
          isActive
            ? 'bg-white text-primary shadow-md scale-[1.02]'
            : isLogout
              ? 'hover:bg-red-500/20 text-white/80 hover:text-white'
              : 'hover:bg-white/10 text-white/80 hover:text-white hover:scale-[1.02]'
        }
      `}
      onClick={handleClick}
    >
      <span
        className={`
          transition-colors
          ${isActive ? 'text-primary' : 'text-white/70 group-hover:text-white'}
        `}
      >
        {icon}
      </span>
      <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
    </div>
  )
}
