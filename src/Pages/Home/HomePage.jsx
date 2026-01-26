import axios from 'axios'
import { useState, useEffect } from 'react'
import Card from './Card'
import UsageTrendChart from './UsageTrendChart'
import TopTurnoverList from './TopTurnoverList'
import DeadstockChart from './DeadstockChart'
const API_URL = import.meta.env.VITE_API_URL
export default function HomePage() {
  const [reportCard, setReportCard] = useState([])
  const [usageTrend, setUsageTrend] = useState([])
  const [topTurnoverItems, setTopTurnoverItems] = useState([])
  const [deadstockItems, setDeadstockItems] = useState([])
  const [deadstockDays, setDeadstockDays] = useState(30)
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const firstDay = `${year}-${month}-01`
  const today = now.toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(today)

  const fetchCategory = async () => {
    try {
      const res = await axios.get(`${API_URL}/category`)
      setCategories(res.data.categories)
    } catch (error) {
      console.error(error)
    }
  }
  const fetchReportCard = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports/card`)
      setReportCard(res.data.result)
    } catch (error) {
      console.error('Error fetching report card:', error)
    }
  }

  const fetchUsageTrend = async (startDate, endDate, category_id) => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (category_id) params.append('category_id', category_id)
      const res = await axios.get(`${API_URL}/reports/usage-trend?${params.toString()}`)
      setUsageTrend(res.data.result)
    } catch (error) {
      console.error('Error fetching usage trend:', error)
    }
  }

  const fetchTopTurnoverItems = async (startDate, endDate, category_id) => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (category_id) params.append('category_id', category_id)
      const res = await axios.get(`${API_URL}/reports/top-turnover?${params.toString()}`)
      setTopTurnoverItems(res.data.result)
    } catch (error) {
      console.error('Error fetching usage trend:', error)
    }
  }
  const fetchDeadStockItems = async (days = 30) => {
    try {
      const res = await axios.get(`${API_URL}/reports/deadstock?days=${days}`)
      setDeadstockItems(res.data.result)
    } catch (error) {
      console.error('Fetch deadstock error:', error)
    }
  }

  useEffect(() => {
    fetchReportCard()
    fetchUsageTrend()
    fetchTopTurnoverItems()
    fetchDeadStockItems(deadstockDays)
    fetchCategory()
  }, [])

  useEffect(() => {
    fetchUsageTrend(startDate, endDate, categoryId),
    fetchTopTurnoverItems(startDate, endDate, categoryId)
  }, [startDate, endDate, categoryId])

  // console.log('Current reportCard state:', reportCard)
  // console.log('Usage Trend', usageTrend)
  // console.log('Top Turnover', topTurnoverItems)
  // console.log('Dead Stock', deadstockItems)

  return (
    <>
      <div className="categorypage w-full min-h-screen mt-10">
        {/* Header */}
        <div className="header flex justify-between px-10 py-8">
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold">Dashboard Overview</p>
            <p className="text-gray-400">ดูภาพรวมการใช้งานระบบได้ที่นี่</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white px-10 py-6 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 w-full">
            {reportCard.map((item, index) => (
              <Card key={index} amt={item.value} act={item.label} />
            ))}
          </div>

          {/* Filters */}
          <div>
            <div className="bg-white p-6">
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
          </div>
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* UsageTrendChart - ใช้ 2 คอลัมน์ */}
            <div className="lg:col-span-2">
              <UsageTrendChart data={usageTrend} />
            </div>

            {/* TopTurnoverList - ใช้ 1 คอลัมน์ */}
            <div className="lg:col-span-1">
              <TopTurnoverList data={topTurnoverItems} />
            </div>
          </div>

          <div className="mt-6">
            <DeadstockChart data={deadstockItems} />
          </div>
        </div>
      </div>
    </>
  )
}
