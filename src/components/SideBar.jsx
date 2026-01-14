import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { House, Package, Group, FileClock, Menu, X, Files } from 'lucide-react'

export default function SideBar() {
  const [open, setOpen] = useState(false)
  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center px-4 bg-white z-50 shadow">
        <button onClick={() => setOpen(true)}>
          <Menu className="w-7 h-7 text-primary" />
        </button>
        <h1 className="ml-4 text-primary text-xl font-semibold">OPE</h1>
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
        bg-primary text-white
        flex flex-col rounded--2xl
        transition-transform duration-300 ease-in-out

        /* Mobile */
        fixed top-0 left-0 z-50
        h-screen w-4/5 max-w-xs
        ${open ? 'translate-x-0' : '-translate-x-full'}

        /* Desktop */
        md:relative md:translate-x-0
        md:h-screen md:w-1/5 md:max-w-none
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5">
          <h1 className="text-3xl">OPE</h1>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>

        {/* Menu */}
        <div className="flex flex-col gap-2 px-3">
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
        </div>
      </aside>
    </>
  )
}

function MenuItem({ icon, label, path, setOpen }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname === path
  return (
    <div
      className={`
        flex items-center gap-3
        p-4 rounded-lg
        transition-colors duration-200
        cursor-pointer
        ${isActive ? 'bg-secondary text-white' : 'hover:bg-hover text-white/80 hover:text-white'}
      `}
      onClick={() => {
        navigate(path)
        if (setOpen) setOpen(false)
      }}
    >
      {icon && <span className={isActive ? 'text-white' : 'text-white/70'}>{icon}</span>}
      <span className="text-lg">{label}</span>
    </div>
  )
}
