import axios from 'axios'
import { useState } from 'react'
import { ShoppingBasket } from 'lucide-react'

export default function ItemTable({ data = [] }) {
  const API_URL = import.meta.env.VITE_API_URL
  const [quantities, setQuantities] = useState({})

  if (data.length === 0) {
    return <div className="mt-6 text-gray-400">ไม่พบรายการ</div>
  }

  const handleAdd = async (itemId, qty) => {
    try {
      await axios.post(`${API_URL}/wishlist`, {
        item_id: itemId,
        quantity: qty,
        user_id: 2,
      })

      setQuantities((prev) => ({
        ...prev,
        [itemId]: 1,
      }))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="mt-6">
      <div className="border-b py-2 flex justify-between items-center overflow-y-auto">
        <span>รหัสพัสดุ</span>
        <span>ชื่อพัสดุ</span>
        <span>สถานะ</span>
        <span>หมวดหมู่</span>
        <span>จำนวนในคลัง</span>
        <span>จำนวนเบิก</span>
        <span>เพิ่มลงตระกร้า</span>
      </div>
      {data.map((item) => (
        <div key={item.item_id} className="border-b py-2 flex justify-between items-center">
          <span>{item.item_id}</span>
          <span>{item.name}</span>
          <span className="text-gray-500">{item.category_name}</span>
          <span>{item.is_active ? 'Active' : 'Non Active'}</span>
          <span>{item.category}</span>
          <span>{item.quantity}</span>

          <input
            className="w-14 border rounded px-1"
            type="number"
            min={1}
            value={quantities[item.item_id] ?? 1}
            onChange={(e) =>
              setQuantities((prev) => ({
                ...prev,
                [item.item_id]: Number(e.target.value),
              }))
            }
          />

          <button
          className='text-gray-400 cursor-pointer hover:text-gray-500' onClick={() => handleAdd(item.item_id, quantities[item.item_id] ?? 1)}>
            <ShoppingBasket />
          </button>
        </div>
      ))}
    </div>
  )
}
