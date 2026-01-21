import React from 'react'
import { TrendingUp, Package } from 'lucide-react'

const TopTurnoverList = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md w-full overflow-y-auto h-125 ">
        <h2 className="text-xl font-bold mb-4">พัสดุที่มีการเบิกสูงสุด (Top Turnover)</h2>
        <div className="text-center py-8 text-gray-400">ไม่มีข้อมูลในช่วงเวลาที่เลือก</div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md w-full overflow-y-auto h-125 ">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        พัสดุที่มีการเบิกสูงสุด (Top Turnover)
      </h2>

      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* อันดับและชื่อ */}
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${
                    index === 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : index === 1
                        ? 'bg-gray-100 text-gray-700'
                        : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-50 text-gray-600'
                  }
                `}
              >
                {index + 1}
              </div>

              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-800">{item.name}</span>
              </div>
            </div>

            {/* ข้อมูลสถิติ */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-500">จำนวนเบิก</p>
                <p className="text-lg font-bold text-primary">
                  {item.total_out.toLocaleString()} ชิ้น
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">จำนวนครั้ง</p>
                <p className="text-sm font-semibold text-gray-600">
                  {item.transaction_count} ครั้ง
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopTurnoverList
