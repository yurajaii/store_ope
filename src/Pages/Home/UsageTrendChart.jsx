import React from 'react'
import { TrendingUp } from 'lucide-react'
import ReactECharts from 'echarts-for-react'

const UsageTrendChart = ({ data, startDate, endDate }) => {
  // 1. กำหนดช่วงวันที่จาก Props ที่ User เลือก (ถ้าไม่มีให้ใช้จาก Data)
  const start = startDate
    ? new Date(startDate)
    : new Date(Math.min(...data.map((d) => new Date(d.time_bucket))))
  const end = endDate
    ? new Date(endDate)
    : new Date(Math.max(...data.map((d) => new Date(d.time_bucket))))

  const fullDates = []
  const fullIndexData = []

  // ล้างค่าเวลาให้เป็น 00:00:00 เพื่อการเปรียบเทียบวันที่ที่แม่นยำ
  let current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const finalEnd = new Date(end)
  finalEnd.setHours(0, 0, 0, 0)

  // 2. Loop สร้างข้อมูลทุกวัน
  while (current <= finalEnd) {
    // สร้าง Key สำหรับเทียบ (YYYY-MM-DD)
    const dateKey = current.toLocaleDateString('en-CA') // ได้ฟอร์แมต YYYY-MM-DD
    const displayDate = current.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })

    // ค้นหาข้อมูลที่ตรงกับวันที่นั้นๆ
    const found = data.find((item) => {
      const itemDate = new Date(item.time_bucket).toLocaleDateString('en-CA')
      return itemDate === dateKey
    })

    fullDates.push(displayDate)
    fullIndexData.push(found ? found.usage_index : 0)

    current.setDate(current.getDate() + 1)
  }

  const option = {
    textStyle: {
      fontFamily: 'Prompt, sans-serif',
    },
    tooltip: { trigger: 'axis' },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
      },
    ],
    grid: { left: '3%', right: '5%', bottom: '1%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: fullDates,
      axisLabel: { interval: 0, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: 'Index (%)',
      min: 0,
      max: (value) => (value.max > 100 ? value.max + 20 : 120),
      axisLabel: { formatter: '{value}%' },
    },
    series: [
      {
        name: 'ดัชนีการใช้งาน',
        type: 'line',
        data: fullIndexData,
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(130, 202, 157, 0.4)' },
              { offset: 1, color: 'rgba(130, 202, 157, 0)' },
            ],
          },
        },
        lineStyle: { color: '#82ca9d', width: 3 },

        markLine: {
          data: [
            {
              yAxis: 100,
              label: {
                formatter: 'เฉลี่ย (Baseline)',
                position: 'insideEndTop',
                distance: [5, 10],
                fontFamily: 'Prompt, sans-serif',
                fontWeight: 'bold',
                color: '#ff4d4f',
                fontSize: 12,
              },
              lineStyle: {
                color: '#ff4d4f',
                type: 'dashed',
                width: 1.5,
              },
            },
          ],
        },
      },
    ],
  }
  return (
    <div className="bg-white p-6 rounded-xl border-gray-300 border w-full  h-125">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        แนวโน้มการเบิกจ่ายพัสดุ
      </h2>
      <ReactECharts option={option} style={{ height: '420px' }} opts={{ renderer: 'canvas' }} />
    </div>
  )
}

export default UsageTrendChart
