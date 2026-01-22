import React from 'react'
import ReactECharts from 'echarts-for-react'
import { AlertTriangle } from 'lucide-react'

const DeadstockChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border-gray-300 border w-full">
        <h2 className="text-xl font-bold mb-4">พัสดุคงค้าง (Deadstock)</h2>
        <div className="text-center py-8 text-gray-400">ไม่มีพัสดุคงค้าง</div>
      </div>
    )
  }

  // คำนวณจำนวนวันและ sort จากมากไปน้อย
  const itemsWithDays = data.map((item) => {
    if (!item.last_withdraw) {
      return { ...item, days: 999 }
    }
    const days = Math.floor((new Date() - new Date(item.last_withdraw)) / (1000 * 60 * 60 * 24))
    return { ...item, days }
  })

  // Sort จากวันมากไปน้อย (ไม่ได้เบิกนานที่สุดอยู่บนสุด)
  const sortedItems = itemsWithDays.sort((a, b) => a.days - b.days)

  const itemNames = sortedItems.map((item) => item.name)
  const daysIdle = sortedItems.map((item) => item.days)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const name = params[0].axisValue
        const days = params[0].value
        return `${name}<br/>ไม่มีการเบิก: <strong>${days === 999 ? 'ไม่เคยเบิก' : days + ' วัน'}</strong>`
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'จำนวนวัน',
      axisLabel: {
        formatter: (value) => (value === 999 ? 'ไม่เคย' : value),
      },
    },
    yAxis: {
      type: 'category',
      data: itemNames,
      axisLabel: {
        width: 150,
        overflow: 'truncate',
        ellipsis: '...',
      },
    },
    series: [
      {
        name: 'จำนวนวันที่ไม่มีการเบิก',
        type: 'bar',
        data: daysIdle,
        itemStyle: {
          color: (params) => {
            const days = params.value
            if (days === 999) return '#ef4444' // แดง - ไม่เคยเบิก
            if (days > 90) return '#f97316' // ส้ม - มากกว่า 90 วัน
            if (days > 60) return '#f59e0b' // เหลือง - 60-90 วัน
            return '#94a3b8' // เทา - น้อยกว่า 60 วัน
          },
        },
        barMaxWidth: 30,
      },
    ],
  }

  return (
    <div className="bg-white p-6 rounded-xl border-gray-300 border w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          พัสดุค้างใช้งาน (Deadstock)
        </h2>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-400 rounded"></span> &lt; 60 วัน
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-500 rounded"></span> 60-90 วัน
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-orange-500 rounded"></span> &gt; 90 วัน
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500 rounded"></span> ไม่เคยเบิก
          </span>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: '400px' }} />
    </div>
  )
}

export default DeadstockChart
