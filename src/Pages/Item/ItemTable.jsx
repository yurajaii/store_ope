import api from '@/Utils/api'
import { useState, useContext } from 'react'
import { ShoppingBasket, Settings, Trash2, Undo2 } from 'lucide-react'
import toast from 'react-hot-toast'

import ItemDialog from './ItemDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { UserContext } from '@/Context/UserContextInstance'

export default function ItemTable({
  data = [],
  onUpdate,
  categories = [],
  page,
  totalPages,
  onPageChange,
}) {
  const API_URL = import.meta.env.VITE_API_URL
  const [quantities, setQuantities] = useState({})
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const { user } = useContext(UserContext)

  const openDeleteDialog = (item) => {
    setItemToDelete(item)
    setDeleteConfirmOpen(true)
  }

  const handleAdd = async (itemId, qty) => {
    try {
      await api.post(`${API_URL}/wishlist`, {
        item_id: itemId,
        quantity: qty,
      })
      setQuantities((prev) => ({ ...prev, [itemId]: 1 }))
      toast.success(`เพิ่มพัสดุลงตระกร้าแล้ว`)
      await onUpdate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (item) => {
    setSelectedItem(item)
    setEditDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await api.patch(`${API_URL}/items/${itemToDelete.item_id}/delete`)
      await onUpdate()
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
      toast.success(`${itemToDelete.name} ถูกลบสำเร็จ`)
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบ')
      console.error('Delete error:', error)
    }
  }

  const handleRestoreItem = async (itemId) => {
    try {
      await api.patch(`${API_URL}/items/${itemId}/restore`)
      await onUpdate()
      toast.success(`กู้คืนพัสดุสำเร็จ`)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('เกิดข้อผิดพลาดในการกู้คืน')
    }
  }

  const handleUpdate = async (payload) => {
    try {
      await api.patch(`${API_URL}/items/${selectedItem.item_id}`, payload)
      setEditDialogOpen(false)
      toast.success(`${selectedItem.name} ถูกอัพเดทแล้ว`)
      await onUpdate()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล')
    }
  }

  if (data.length === 0) {
    return (
      <div className="mt-6 p-8 text-center border-2 border-dashed rounded-lg text-gray-400">
        ไม่พบรายการพัสดุ
      </div>
    )
  }

  return (
    <>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-center">
            {/* Table Header */}
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-indigo-900 uppercase tracking-wider">
                  รหัสพัสดุ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-indigo-900 uppercase tracking-wider">
                  ชื่อพัสดุ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-indigo-900 uppercase tracking-wider">
                  หมวดหมู่
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-indigo-900 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-indigo-900 uppercase tracking-wider">
                  จำนวนในคลัง
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-indigo-900 uppercase tracking-wider">
                  ขีดจำกัด (ต่ำ-สูง)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-indigo-900 uppercase tracking-wider">
                  จำนวนเบิก
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-indigo-900 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {data
                .sort((a, b) => {
                  const aStock = a.quantity > 0 ? 1 : 0
                  const bStock = b.quantity > 0 ? 1 : 0

                  if (aStock !== bStock) {
                    return bStock - aStock
                  }
                  return b.quantity - a.quantity
                })
                .map((item) => (
                  <tr
                    key={item.item_id}
                    className={`transition-colors ${
                      item.quantity === 0 && user.role == 'user'
                        ? 'bg-gray-200 opacity-60 cursor-not-allowed pointer-events-none grayscale'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{item.item_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {item.category} :: {item.subcategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div
                        className={`inline-flex items-center px-3 rounded-full py-1 text-[10px] font-bold shadow-sm ${
                          item.quantity < item.min_threshold
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : item.quantity > item.max_threshold
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.quantity === 0
                          ? 'สินค้าหมด'
                          : item.quantity < item.min_threshold
                            ? 'ต่ำกว่าเกณฑ์'
                            : item.quantity > item.max_threshold
                              ? 'สูงกว่าเกณฑ์'
                              : 'ปกติ'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-center font-semibold text-gray-700">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      <span className="bg-gray-50 px-2 py-1 rounded text-xs">
                        {item.min_threshold || 0} - {item.max_threshold || 0}
                      </span>
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
                        onBlur={(e) => {
                          const value = Number(e.target.value)
                          if (value > item.quantity) {
                            setQuantities((prev) => ({
                              ...prev,
                              [item.item_id]: item.quantity,
                            }))
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex gap-2 justify-center ">
                        {(user?.role === 'system_admin' || user?.role === 'user_admin') && (
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            onClick={() => handleEdit(item)}
                            title="แก้ไข"
                          >
                            <Settings size={18} />
                          </button>
                        )}
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-30 cursor-pointer"
                          onClick={() => handleAdd(item.item_id, quantities[item.item_id] ?? 1)}
                          title="เพิ่มลงตะกร้า"
                        >
                          <ShoppingBasket size={20} />
                        </button>
                        {(user?.role === 'system_admin' || user?.role === 'user_admin') &&
                          (!item.is_active ? (
                            <button
                              className="p-2 text-green-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-30"
                              onClick={() => handleRestoreItem(item.item_id)}
                              title="กู้คืนพัสดุ"
                            >
                              <Undo2 size={20} />
                            </button>
                          ) : (
                            <button
                              className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-30 cursor-pointer"
                              onClick={() => openDeleteDialog(item)}
                              title="ลบพัสดุ"
                            >
                              <Trash2 size={20} />
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {/* Pagination UI */}
          <div className="flex  justify-between items-center px-6 py-4 bg-gray-50 border-t">
            <p className="text-sm text-gray-600">
              หน้า <span className="font-semibold text-indigo-600">{page}</span> จาก {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="px-4 py-2 text-sm border rounded shadow-sm bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                ก่อนหน้า
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="px-4 py-2 text-sm border rounded shadow-sm bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="ยืนยันการลบพัสดุ?"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${itemToDelete?.name}"? รายการนี้จะถูกย้ายไปอยู่ในกลุ่มพัสดุที่ไม่ใช้งาน`}
      />

      <ItemDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        mode="edit"
        categories={categories}
        defaultData={selectedItem}
        onSubmit={handleUpdate}
      />
    </>
  )
}
