import React from 'react'
import { TrendingUp } from 'lucide-react'
import ReactECharts from 'echarts-for-react'

const UsageTrendChart = ({ data }) => {
  const dates = data.map((item) => new Date(item.time_bucket).toLocaleDateString('th-TH'))
  const indexData = data.map((item) => item.usage_index)

  // console.log('dates:', dates);
  // console.log('indexData:', indexData);

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['ดัชนีการใช้งาน (Index)'],
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      name: 'Index (Baseline 100)',
      min: 0,
      axisLabel: { formatter: '{value}%' },
    },
    series: [
      {
        name: 'ดัชนีการใช้งาน (Index)',
        type: 'line',
        data: indexData,
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(130, 202, 157, 0.8)' },
              { offset: 1, color: 'rgba(130, 202, 157, 0.1)' },
            ],
          },
        },
        lineStyle: { color: '#82ca9d', width: 3 },
        itemStyle: { color: '#82ca9d' },
        markLine: {
          symbol: ['none', 'none'],
          data: [
            {
              yAxis: 100,
              name: 'Baseline',
              lineStyle: { color: '#ff4d4f', type: 'dashed', width: 1 },
              label: {
                position: 'end',
                formatter: 'Baseline (100)',
                color: '#ff4d4f',
                fontWeight: 'bold',
              },
            },
          ],
        },
      },
    ],
  }

  return (
    <div className="bg-white p-6 rounded-xl border-gray-300 border w-full  h-125">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        แนวโน้มการเบิกจ่ายพัสดุ
      </h2>
      <ReactECharts option={option} style={{ height: '400px' }} opts={{ renderer: 'canvas' }} />
    </div>
  )
}

export default UsageTrendChart
