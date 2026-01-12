import axios from 'axios'
import { useState } from 'react'
import { ShoppingBasket } from 'lucide-react'

export default function ItemTable({ data = [], onUpdate }) {
  const API_URL = import.meta.env.VITE_API_URL
  const [quantities, setQuantities] = useState({})

  if (data.length === 0) {
    return (
      <div className="mt-6 p-8 text-center border-2 border-dashed rounded-lg text-gray-400">
        ไม่พบรายการพัสดุ
      </div>
    )
  }

  const handleAdd = async (itemId, qty) => {
    try {
      await axios.post(`${API_URL}/wishlist`, {
        item_id: itemId,
        quantity: qty,
        user_id: 2,
      })
      // Reset จำนวนเฉพาะแถวที่เพิ่มสำเร็จกลับเป็น 1
      setQuantities((prev) => ({ ...prev, [itemId]: 1 }))
      await onUpdate()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* {console.log(data)} */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">รหัสพัสดุ</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">ชื่อพัสดุ</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">หมวดหมู่</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-center">สถานะ</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
                จำนวนในคลัง
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-center">
                จำนวนเบิก
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-center">จัดการ</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100">
            {data
              .sort((a, b) => a.item_id - b.item_id)
              .map((item) => (
                <tr key={item.item_id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{item.item_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {item.category} :: {item.subcategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-gray-700">
                    {item.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <input
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      type="number"
                      min={1}
                      max={item.quantity}
                      value={quantities[item.item_id] ?? 1}
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [item.item_id]: Math.max(1, Number(e.target.value)),
                        }))
                      }
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-30"
                      onClick={() => handleAdd(item.item_id, quantities[item.item_id] ?? 1)}
                      title="เพิ่มลงตะกร้า"
                    >
                      <ShoppingBasket size={20} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
