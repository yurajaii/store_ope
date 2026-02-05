/* eslint-disable react-hooks/set-state-in-effect */
import api from '@/Utils/api'
import CategoryCard from './CategoryCard'
import CategoryDialog from './CategoryDialog'

import { CircleX } from 'lucide-react'
import { useState, useEffect, useContext } from 'react'
import { UserContext } from '@/Context/UserContextInstance'
import toast from 'react-hot-toast'
const API_URL = import.meta.env.VITE_API_URL

export default function CategoryPage() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { user } = useContext(UserContext)

  const groupedCategories = categories.reduce((acc, cur) => {
    const key = cur.category

    if (!acc[key]) {
      acc[key] = {
        category: cur.category,
        icon: cur.icon,
        count: 0,
      }
    }

    acc[key].count += 1
    return acc
  }, {})

  const categoryList = Object.values(groupedCategories)
  const subCategoryList = categories.filter((c) => c.category === selectedCategory)
  const searchedSubCategories = categories.filter((c) =>
    `${c.category} ${c.subcategory}`.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const fetchCategory = async () => {
    try {
      const res = await api.get(`${API_URL}/category`)
      setCategories(res.data.categories)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchCategory()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
    }, 1000)

    return () => clearTimeout(t)
  }, [search])

  return (
    <>
      <div className="categorypage w-full h-full mt-10">
        {/* Header */}
        <div className="header flex justify-between px-10 py-8 ">
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold">หมวดหมู่พัสดุ</p>
            <p className="text-gray-400">จัดการหมวดหมู่พัสดุของคุณ</p>
          </div>
          {(user?.role === 'system_admin' || user?.role === 'user_admin') && (
            <button
              className="p-2 px-4 bg-primary w-fit h-fit rounded-2xl font-semibold text-white cursor-pointer hover:bg-secondary"
              onClick={() => {
                setEditData(
                  selectedCategory
                    ? {
                        category: selectedCategory,
                      }
                    : null
                )
                setDialogOpen(true)
              }}
            >
              + เพิ่มหมวดใหม่
            </button>
          )}
        </div>

        {/* Content */}
        <div className="bg-white w-full px-10 py-10 h-full">
          <div className="flex justify-end gap-6">
            <div className="flex border border-gray-300 rounded px-2 py-2">
              <input
                type="text"
                name="search"
                placeholder="ค้นหาหมวด / หมวดย่อย"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                outline-none
                focus:outline-none
                focus:ring-0
                active:outline-none
                active:ring-0
                bg-or
              "
              />
              <button
                onClick={() => {
                  setSearch('')
                  setSelectedCategory(null)
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <CircleX />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {selectedCategory && (
              <button
                className="text-lg text-primary mb-4 cursor-pointer hover:text-2xl transition-all duration-200"
                onClick={() => setSelectedCategory(null)}
              >
                ← กลับไปหมวดหมู่
              </button>
            )}

            {/* 🔍 SEARCH MODE → แสดง subcategory ทันที */}
            {debouncedSearch &&
              searchedSubCategories.map((c) => (
                <CategoryCard
                  key={c.id}
                  icon={c.icon}
                  category={c.category}
                  subcategory={c.subcategory}
                  onClick={() => {}}
                />
              ))}

            {/* 📦 CATEGORY SUMMARY MODE */}
            {!debouncedSearch &&
              !selectedCategory &&
              categoryList.map((c) => (
                <CategoryCard
                  key={c.category}
                  icon={c.icon}
                  title={c.category}
                  count={c.count}
                  onClick={() => setSelectedCategory(c.category)}
                />
              ))}

            {/* 📂 SUBCATEGORY MODE */}
            {!debouncedSearch &&
              selectedCategory &&
              subCategoryList.map((c) => (
                <CategoryCard
                  key={c.id}
                  icon={c.icon}
                  category={c.category}
                  subcategory={c.subcategory}
                  onClick={() => {
                    if (user?.role === 'system_admin' || user?.role === 'user_admin') {
                      setEditData({
                        id: c.id,
                        category: c.category,
                        subcategory: c.subcategory,
                        icon: c.icon,
                      })
                      setDialogOpen(true)
                    }
                  }}
                />
              ))}
          </div>
        </div>
      </div>
      <CategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mode={editData ? 'edit' : 'add'}
        defaultData={editData}
        onSubmit={async (data) => {
          if (editData?.id) {
            await api.put(`${API_URL}/category/${data.id}`, data)
            toast.success('อัพเดทสำเร็จ')
          } else {
            await api.post(`${API_URL}/category`, data)
            toast.success('เพิ่มหมวดหมู่สำเร็จ')
          }
          setDialogOpen(false)
          fetchCategory()
        }}
      />
    </>
  )
}
