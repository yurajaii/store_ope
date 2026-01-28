import { useState, useEffect } from 'react'
import {
  Search,
  Shield,
  User,
  Crown,
  Users,
  ChevronDown,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import axios from 'axios'

export function AdminPage() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL

  // Fetch users from API
  const fetchUsers = async () => {
    setFetchLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_URL}/auth`)

      const userData = Array.isArray(response.data)
        ? response.data
        : response.data.users || response.data.data || []

      setUsers(userData)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง')
      setUsers([])
    } finally {
      setFetchLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  
const handleRoleChange = async (userId, newRole) => {
  if (loading) return;

  setLoading(true);
  try {
    const response = await axios.patch(`${API_URL}/auth/${userId}/role`, { 
      role: newRole 
    });

    if (response.data.success) {
      setUsers(prevUsers => 
        prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      
      console.log(`✅ เปลี่ยนสิทธิ์ของ ${userId} เป็น ${newRole} สำเร็จ`);
    }
  } catch (error) {
    console.error('❌ Failed to update role:', error);
    alert('ไม่สามารถเปลี่ยนสิทธิ์ได้: ' + (error.response?.data?.message || 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์'));
  } finally {
    setLoading(false);
  }
};

  const filteredUsers = Array.isArray(users)
    ? users.filter((user) => {
        const matchesSearch =
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesRole = filterRole === 'all' || user.role === filterRole

        return matchesSearch && matchesRole
      })
    : []

  const getRoleConfig = (role) => {
    const configs = {
      system_admin: {
        label: 'System Admin',
        icon: <Crown className="w-4 h-4" />,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        description: 'สิทธิ์เต็มทุกอย่าง',
      },
      user_admin: {
        label: 'User Admin',
        icon: <Shield className="w-4 h-4" />,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        description: 'จัดการผู้ใช้และพัสดุ',
      },
      user: {
        label: 'User',
        icon: <User className="w-4 h-4" />,
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        description: 'ใช้งานทั่วไป',
      },
    }
    return configs[role] || configs.user
  }

  const roleStats = {
    total: users.length,
    system_admin: users.filter((u) => u.role === 'system_admin').length,
    user_admin: users.filter((u) => u.role === 'user_admin').length,
    user: users.filter((u) => u.role === 'user').length,
  }

  // Loading State
  if (fetchLoading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold text-lg mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-6 py-3 bg-linear-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-linear-to-r from-primary to-secondary text-white px-6 md:px-10 py-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <p className="text-3xl font-bold">จัดการสิทธิ์ผู้ใช้งาน</p>
                <p className="text-white/80 text-sm mt-1">
                  สามารถจัดการสิทธิ์การเข้าถึงและใช้งานได้ที่นี่
                </p>
              </div>
            </div>
            {/* Refresh Button */}
            <button
              onClick={fetchUsers}
              disabled={fetchLoading}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 backdrop-blur-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${fetchLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium hidden md:inline">รีเฟรช</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 md:px-10 -mt-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="ผู้ใช้ทั้งหมด"
            value={roleStats.total}
            color="bg-gradient-to-br from-primary to-secondary"
          />
          <StatCard
            icon={<Crown className="w-6 h-6" />}
            label="System Admin"
            value={roleStats.system_admin}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard
            icon={<Shield className="w-6 h-6" />}
            label="User Admin"
            value={roleStats.user_admin}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={<User className="w-6 h-6" />}
            label="User"
            value={roleStats.user}
            color="bg-gradient-to-br from-gray-500 to-gray-600"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white mx-6 md:mx-10 rounded-2xl shadow-lg overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, อีเมล, หรือตำแหน่ง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white cursor-pointer"
            >
              <option value="all">ทุกสิทธิ์</option>
              <option value="system_admin">System Admin</option>
              <option value="user_admin">User Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto min-h-98">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ผู้ใช้</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ตำแหน่ง</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  สิทธิ์ปัจจุบัน
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  จัดการสิทธิ์
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onRoleChange={handleRoleChange}
                  getRoleConfig={getRoleConfig}
                  loading={loading}
                />
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">ไม่พบผู้ใช้งาน</p>
              <p className="text-gray-400 text-sm mt-1">ลองค้นหาด้วยคำอื่นหรือเปลี่ยนตัวกรอง</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-xl shadow-md`}>{icon}</div>
      </div>
    </div>
  )
}

function UserRow({ user, onRoleChange, getRoleConfig, loading }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const currentRoleConfig = getRoleConfig(user.role)

  const roles = ['system_admin', 'user_admin', 'user']

  const handleRoleSelect = (newRole) => {
    if (newRole !== user.role) {
      onRoleChange(user.id, newRole)
    }
    setShowDropdown(false)
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* User Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold shadow-md">
            {user.name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user.job_title || 'ไม่ระบุชื่อ'}</p>
            <p className="text-sm text-gray-500">{user.email || 'ไม่ระบุอีเมล'}</p>
          </div>
        </div>
      </td>

      {/* Job Title */}
      <td className="px-6 py-4">
        <p className="text-gray-700">{user.jobTitle || '-'}</p>
      </td>

      {/* Current Role Badge */}
      <td className="px-6 py-4">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${currentRoleConfig.color}`}
        >
          {currentRoleConfig.icon}
          <span className="font-medium text-sm">{currentRoleConfig.label}</span>
        </div>
      </td>

      {/* Role Dropdown */}
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm font-medium text-gray-700">เปลี่ยนสิทธิ์</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-20">
                {roles.map((role) => {
                  const config = getRoleConfig(role)
                  const isSelected = role === user.role
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>{config.icon}</div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-800 text-sm">{config.label}</p>
                          <p className="text-xs text-gray-500">{config.description}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
