import { useEffect, useState } from 'react'
import api from '@/Utils/api'
import toThaiTime from '@/Utils/toThaiTime'

export default function LogPage() {
  const API_URL = import.meta.env.VITE_API_URL
  const [logs, setLogs] = useState([])
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const firstDay = `${year}-${month}-01`
  const today = now.toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(today)
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function fetchLogs() {
    setLoading(true)
    try {
      const result = await api.get(`${API_URL}/inventory/log`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          category_id: categoryId,
          page: page,
          limit: 20,
        },
      })
      setLogs(result.data.inventory_log)

      setTotalPages(result.data.pagination.total_pages || 1)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchCategory = async () => {
    try {
      const res = await api.get(`${API_URL}/category`)
      setCategories(res.data.categories)
    } catch (error) {
      console.error(error)
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'IN':
      case 'เพิ่ม':
        return 'bg-green-100 text-green-800'
      case 'OUT':
      case 'เบิก':
        return 'bg-red-100 text-red-800'
      case 'ADJUST':
      case 'ปรับยอด':
        return 'bg-blue-100 text-blue-800'
      case 'RETURN':
      case 'คืน':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionText = (action) => {
    switch (action) {
      case 'IN':
        return 'เพิ่ม'
      case 'OUT':
        return 'เบิก'
      case 'ADJUST':
        return 'แก้ไข'
      case 'RETURN':
        return 'คืน'
      default:
        return action
    }
  }

  useEffect(() => {
    fetchCategory()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [startDate, endDate, categoryId, page])

  return (
    <>
      <div className="LogPage w-full min-h-screen">
        <div className="header flex justify-between px-10 py-8 pt-20 bg-gray-100">
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold">ประวัติการเคลื่อนไหวพัสดุในคลัง</p>
            <p className="text-gray-400">สามารถดูประวัติการเคลื่อนไหวได้ที่นี่</p>
          </div>
        </div>

        <div className=" bg-white px-10 py-4 h-full">
          {/* Filters */}
          <div className="bg-white mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">ทั้งหมด</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category}:: {category.subcategory}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="mt-6 p-8 text-center rounded-lg text-gray-400">
                ไม่พบข้อมูลประวัติการเคลื่อนไหว
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">
                        วันที่/เวลา
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">
                        สินค้า
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">
                        หมวดหมู่
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">
                        การกระทำ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-indigo-900 uppercase tracking-wider">
                        จำนวน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">
                        หมายเหตุ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">
                        ผู้ดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {toThaiTime(log.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.item_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {log.category_name} :: {log.subcategory_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(
                              log.type
                            )}`}
                          >
                            {getActionText(log.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-700">
                          {log.quantity > 0 ? '+' : ''}
                          {log.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.remark || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {`${log.job_title} `}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination UI */}
                <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
                  <p className="text-sm text-gray-600">
                    หน้า {page} จาก {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => prev - 1)}
                      className="px-4 py-2 border rounded shadow-sm bg-white disabled:opacity-50"
                    >
                      ก่อนหน้า
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((prev) => prev + 1)}
                      className="px-4 py-2 border rounded shadow-sm bg-white disabled:opacity-50"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
