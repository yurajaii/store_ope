/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useContext } from 'react'
import { CircleX } from 'lucide-react'
import ItemTable from './ItemTable'
import ItemDialog from './ItemDialog'
import InventoryDialog from './InventoryDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserContext } from '@/Context/UserContextInstance'
import api from '@/Utils/api'

export default function Package({ onUpdate }) {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('__all__')
  const [selectedSubchainId, setSelectedSubchainId] = useState('__all__')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false)
  const { user } = useContext(UserContext)

  const API_URL = import.meta.env.VITE_API_URL

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 20

  const mainCategories = [...new Set(categories.map((c) => c.category))]

  const availableSubcategories = categories.filter(
    (c) => selectedCategory === '__all__' || c.category === selectedCategory
  )

  const fetchCategory = async () => {
    try {
      const res = await api.get(`${API_URL}/category`)
      setCategories(res.data.categories)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchItems = async () => {
    if (!user) return
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      if (selectedCategory !== '__all__') {
        params.append('main_category', selectedCategory)
      }

      if (selectedSubchainId !== '__all__') {
        params.append('category_id', selectedSubchainId)
      }

      const res = await api.get(`${API_URL}/items?${params.toString()}`)
      setItems(res.data.items || [])
      setTotalPages(res.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error(error)
    }
  }

  const handleItemUpdate = async () => {
    await fetchItems()
    if (onUpdate) {
      await onUpdate()
    }
  }

  useEffect(() => {
    setPage(1)
    fetchItems()
  }, [selectedCategory, selectedSubchainId, searchQuery])

  useEffect(() => {
    fetchItems()
  }, [page])

  useEffect(() => {
    fetchCategory()
  }, [])

  return (
    <>
      <div className="categorypage w-full h-full mt-10">
        {/* Header */}
        <div className="header flex justify-between px-10 py-8">
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold">รายการพัสดุ</p>
            <p className="text-gray-400">ลงเบียน แก้ไข ลบ และจัดการรายพัสดุได้ที่นี่</p>
          </div>
        </div>
        {/* Content */}
        <div className="bg-white px-10 py-4 h-full">
          {/* Search Bar */}
          <div className="flex justify-end gap-2">
            <div className="flex border border-gray-300 rounded px-2 py-2">
              <input
                type="text"
                name="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ/รหัสพัสดุ"
                className="
                outline-none
                focus:outline-none
                focus:ring-0
                active:outline-none
                active:ring-0
              "
              />
              <button className="text-gray-400" onClick={() => setSearchQuery('')}>
                <CircleX />
              </button>
            </div>

            {/* --- 1. เลือกหมวดหลัก --- */}
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val)
                setSelectedSubchainId('__all__')
              }}
            >
              <SelectTrigger className="w-40 h-11 border-gray-300">
                <SelectValue placeholder="หมวดหลัก" />
              </SelectTrigger>
              <SelectContent className="font-[Prompt] ">
                <SelectItem value="__all__" >หมวดหลักทั้งหมด</SelectItem>
                {mainCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* --- 2. เลือกหมวดย่อย --- */}
            <Select
              value={selectedSubchainId}
              onValueChange={setSelectedSubchainId}
              disabled={selectedCategory === '__all__'}
            >
              <SelectTrigger className="w-40 h-11 border-gray-300">
                <SelectValue placeholder="หมวดย่อย" />
              </SelectTrigger>
              <SelectContent className="font-[Prompt]">
                <SelectItem value="__all__">หมวดย่อยทั้งหมด</SelectItem>
                {availableSubcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id.toString()}>
                    {sub.subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(user?.role === 'system_admin' || user?.role === 'user_admin') && (
              <>
                <button
                  className="p-2 px-4 bg-primary min-w-35 rounded-2xl font-semibold text-white cursor-pointer hover:bg-secondary"
                  onClick={() => setDialogOpen(true)}
                >
                  ลงทะเบียนพัสดุ
                </button>

                <button
                  className="p-2 px-4 bg-primary min-w-35 rounded-2xl font-semibold text-white cursor-pointer hover:bg-secondary"
                  onClick={() => setInventoryDialogOpen(true)}
                >
                  เพิ่มสต็อกพัสดุ
                </button>
              </>
            )}
          </div>

          {/* Main Content */}
          <ItemTable
            data={items}
            onUpdate={handleItemUpdate}
            categories={categories}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <ItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mode="add"
        categories={categories}
        onSubmit={async (payload) => {
          await api.post(`${API_URL}/items`, payload)
          setDialogOpen(false)
          handleItemUpdate()
        }}
      />
      <InventoryDialog
        open={inventoryDialogOpen}
        onClose={() => setInventoryDialogOpen(false)}
        items={items}
        onUpdate={handleItemUpdate}
      />
    </>
  )
}
