 

import { useState, useEffect } from 'react'
import axios from 'axios'
import { CircleX } from 'lucide-react'
import ItemTable from './ItemTable'
import ItemDialog from './ItemDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Package({ onUpdate }) {
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('__all__')
  const [items, setItems] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL
  const groupedCategories = categories.reduce((acc, cur) => {
    const key = cur.category

    if (!acc[key]) {
      acc[key] = {
        id: cur.id,
        category: cur.category,
        icon: cur.icon,
        count: 0,
      }
    }

    acc[key].count += 1

    return acc
  }, {})

  const effectiveCategoryId = selectedCategoryId === '__all__' ? null : Number(selectedCategoryId)

  const filteredItems =
    effectiveCategoryId == null ? items : items.filter((i) => i.category_id === effectiveCategoryId)

  const fetchCategory = async () => {
    try {
      const res = await axios.get(`${API_URL}/category`)
      setCategories(res.data.categories)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/items`)
      setItems(res.data.items)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchCategory()
    fetchItems()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className="categorypage w-full h-full mt-10">
        {/* Header */}
        <div className="header flex justify-between px-10 py-8 ">
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold">รายการพัสดุ</p>
            <p className="text-gray-400">ลงเบียน แก้ไข ลบ และจัดการรายพัสดุได้ที่นี่</p>
          </div>
        </div>
        {/* Content */}
        <div className="bg-white w-full px-10 py-10 h-full">
          {/* Search Bar */}
          <div className="flex justify-end gap-6">
            <div className="flex border border-gray-300 rounded px-2 py-2">
              <input
                type="text"
                name="search"
                placeholder="ค้นหาหมวด / หมวดย่อย"
                className="
                outline-none
                focus:outline-none
                focus:ring-0
                active:outline-none
                active:ring-0
              "
              />
              <button className="text-gray-400">
                <CircleX />
              </button>
            </div>

            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="w-45 h-11 text-gray-500 border-gray-300 text-base">
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>

              <SelectContent className="font-[prompt]">
                <SelectItem className="text-base" value="__all__">
                  ทั้งหมด
                </SelectItem>

                {Object.values(groupedCategories).map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()} className="text-base">
                    {c.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              className="
              p-2 px-4
              bg-primary
              min-w-35
              rounded-2xl
              font-semibold
              text-white
              cursor-pointer
              hover:bg-secondary
            "
              onClick={() => setDialogOpen(true)}
            >
              + Add Product
            </button>
          </div>

          {/* Main Content */}
          <ItemTable data={filteredItems} onUpdate={onUpdate}/>
        </div>
      </div>

      <ItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mode="add"
        categories={categories}
        onSubmit={async (payload) => {
          await axios.post(`${API_URL}/items`, payload)
          setDialogOpen(false)
          fetchItems()
        }}
      />
    </>
  )
}
