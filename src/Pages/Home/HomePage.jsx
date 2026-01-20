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
  const [deadstockDays, setDeadstockDays] = useState(1)

  const fetchReportCard = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports/card`)
      setReportCard(res.data.result)
    } catch (error) {
      console.error('Error fetching report card:', error)
    }
  }

  const fetchUsageTrend = async (startDate, endDate) => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const res = await axios.get(`${API_URL}/reports/usage-trend?${params.toString()}`)
      setUsageTrend(res.data.result)
    } catch (error) {
      console.error('Error fetching usage trend:', error)
    }
  }

  const fetchTopTurnoverItems = async (startDate, endDate) => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
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
  }, [])

  console.log('Current reportCard state:', reportCard)
  console.log('Usage Trend', usageTrend)
  console.log('Top Turnover', topTurnoverItems)
  console.log('Dead Stock', deadstockItems)

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
);
  
}
