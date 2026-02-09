/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useContext } from 'react'
import api from '@/Utils/api'
import { Ellipsis, CircleX, Trash2 } from 'lucide-react'
import toThaiTime from '@/Utils/toThaiTime'
import { UserContext } from '@/Context/UserContextInstance'
import toast from 'react-hot-toast'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function WithdrawPage() {
  const [withdrawList, setWithdrawList] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWithdraw, setSelectedWithdraw] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [withdrawToDelete, setWithdrawToDelete] = useState(null)
  const [loading, setLoading] = useState(false)
  const [approveNote, setApproveNote] = useState('')
  const [approvalData, setApprovalData] = useState({})
  const [sortOrder, setSortOrder] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 20

  const { user } = useContext(UserContext)

  const API_URL = import.meta.env.VITE_API_URL

  const fetchWithdrawList = async () => {
    try {
      const res = await api.get(
        `${API_URL}/withdraw?page=${page}&limit=${limit}&search=${debouncedSearch}`
      )
      setWithdrawList(res.data.withdrawn)
      setTotalPages(res.data.pagination.totalPages)
    } catch (err) {
      console.error(err)
    }
  }

const fetchWithdrawDetail = async (withdrawId) => {
  setLoading(true)
  try {
    const res = await api.get(`${API_URL}/withdraw/${withdrawId}`)
    setSelectedWithdraw(res.data.withdraw)

    const initialApproval = {}
    res.data.withdraw.items?.forEach((item) => {
      const stockQty = Number(item.stock_quantity)
      const requestedQty = item.requested_quantity
      
      initialApproval[item.withdraw_item_id] = {
        approved_quantity: stockQty === 0 ? 0 : Math.min(requestedQty, stockQty),
        reject_reason: stockQty === 0 ? 'สินค้าหมดสต็อก' : '',
      }
    })
    setApprovalData(initialApproval)
  } catch (err) {
    console.error(err)
    alert('ไม่สามารถโหลดข้อมูลได้')
  } finally {
    setLoading(false)
  }
}

  const handleOpenDialog = async (withdraw) => {
    setDialogOpen(true)
    await fetchWithdrawDetail(withdraw.id)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedWithdraw(null)
    setApprovalData({})
    setApproveNote('')
  }

  const handleQuantityChange = (itemId, value) => {
    setApprovalData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        approved_quantity: parseInt(value) || 0,
      },
    }))
  }

  const handleReasonChange = (itemId, value) => {
    setApprovalData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        reject_reason: value,
      },
    }))
  }

  const handleApprove = async () => {
    try {
      const items = selectedWithdraw.items.map((item) => ({
        withdraw_item_id: item.withdraw_item_id,
        approved_quantity: approvalData[item.withdraw_item_id]?.approved_quantity || 0,
        reject_reason: approvalData[item.withdraw_item_id]?.reject_reason || null,
      }))

      await api.post(`${API_URL}/withdraw/${selectedWithdraw.id}/approve`, {
        items,
        note: approveNote,
      })

      toast.success('อนุมัติสำเร็จ')
      handleCloseDialog()
      await fetchWithdrawList()
    } catch (error) {
      console.error('Approval failed:', error)
      toast.error(`อนุมัติไม่สำเร็จ กรุณาตรวจสอบจำนวนที่อนุมัติ`)
    }
  }

  const handleReturn = async (item, withdrawId) => {
    const returnQty = prompt(
      `กรุณาระบุจำนวนที่ต้องการคืน (สูงสุด: ${item.approved_quantity}):`,
      item.approved_quantity
    )

    if (returnQty === null) return

    const qty = parseInt(returnQty)
    if (isNaN(qty) || qty <= 0 || qty > item.approved_quantity) {
      toast.error('จำนวนไม่ถูกต้อง')
      return
    }

    try {
      const payload = {
        item_id: item.item_id,
        type: 'RETURN',
        quantity: qty,
        reference_id: `WITHDRAW-#${withdrawId}`,
        remark: `คืนพัสดุจากใบเบิก #${withdrawId}`,
      }

      await api.post(`${API_URL}/inventory/log`, payload)
      toast.success('บันทึกการคืนของสำเร็จ!')

      // Refresh ข้อมูล
      await fetchWithdrawDetail(withdrawId)
      await fetchWithdrawList()
    } catch (error) {
      console.error('Return failed:', error)
      toast.error(`เกิดข้อผิดพลาดเนื่องจาก ${error?.response.data.message}`)
    }
  }

  const handleDelete = async () => {
    if (!withdrawToDelete) return

    try {
      await api.patch(`${API_URL}/withdraw/${withdrawToDelete}/cancel`)

      toast.success('ยกเลิกใบเบิกเรียบร้อยแล้ว')

      setDeleteDialogOpen(false)
      setWithdrawToDelete(null)

      await fetchWithdrawList()
    } catch (error) {
      console.error('Cancel failed:', error)
      toast.error(error.response?.data?.message || 'ไม่สามารถยกเลิกได้')
    }
  }

  const onOpenDeleteDialog = (id) => {
    setWithdrawToDelete(id)
    setDeleteDialogOpen(true)
  }
  const sortedList = [...withdrawList].sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)

    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery])

  useEffect(() => {
    fetchWithdrawList()
  }, [debouncedSearch, page])

  return (
    <>
      <div className="categorypage w-full  mt-10">
        {/* Header */}
        <div className="header flex justify-between px-10 py-8">
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold">ใบเบิกของฉัน</p>
            <p className="text-gray-400">สามารถดูสถานะใบเบิกได้ที่นี่</p>
          </div>
        </div>
        {/* Content */}
        <div className="bg-white px-10 py-4 h-full">
          <div className="flex border border-gray-300 rounded px-2 py-2">
            <input
              type="text"
              placeholder="ค้นหาชื่อ/วัตถุประสงค์/ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none focus:ring-0 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <CircleX className="w-5 h-5" />
              </button>
            )}
          </div>
          {/* Sort Button */}
          <div className="mb-4">
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              เรียงตาม: {sortOrder === 'desc' ? '↓ ใหม่ → เก่า' : '↑ เก่า → ใหม่'}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                      ลำดับ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                      วัตถุประสงค์
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                      แผนก
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                      วันที่สร้าง
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedList.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        #{w.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{w.topic.purpose}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{w.topic.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            w.status === 'REQUESTED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : w.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {toThaiTime(w.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-2">
                          {/* ปุ่มดูรายละเอียดเดิม */}
                          <button
                            onClick={() => handleOpenDialog(w)}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Ellipsis className="w-5 h-5 text-gray-500" />
                          </button>

                          {/* เพิ่มปุ่มลบตรงนี้: แสดงเฉพาะเมื่อสถานะเป็น REQUESTED */}
                          {w.status === 'REQUESTED' && (
                            <button
                              onClick={() => onOpenDeleteDialog(w.id)} // เรียกใช้ฟังก์ชันที่ ESLint บ่นถึง
                              className="p-1 hover:bg-red-100 rounded-full transition-colors"
                              title="ยกเลิกใบเบิก"
                            >
                              <Trash2 className="w-5 h-5 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination UI */}
            <div className="flex justify-between items-center px-10 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600 font-[prompt]">
                หน้า <span className="font-semibold text-indigo-600">{page}</span> จาก {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="px-4 py-2 text-sm font-medium border rounded-lg shadow-sm bg-white hover:bg-gray-50 disabled:opacity-50 transition-all font-[prompt]"
                >
                  ก่อนหน้า
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-4 py-2 text-sm font-medium border rounded-lg shadow-sm bg-white hover:bg-gray-50 disabled:opacity-50 transition-all font-[prompt]"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
          {withdrawList.length === 0 && (
            <div className="text-center py-12 text-gray-500">ไม่พบข้อมูลใบเบิก</div>
          )}
        </div>

        {/* Dialog for Withdraw Details */}
        <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="font-[prompt] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                รายละเอียดใบเบิก {selectedWithdraw ? `#${selectedWithdraw.id}` : ''}
              </DialogTitle>
              <DialogDescription>แสดงรายละเอียดและอนุมัติใบเบิกพัสดุ</DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="py-10 text-center text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mx-auto"></div>
                <p className="mt-3">กำลังโหลด...</p>
              </div>
            ) : selectedWithdraw ? (
              <div
                className={`space-y-4 py-4 transition-all ${
                  user?.role === 'user' ? 'pointer-events-none opacity-100 cursor-not-allowed' : ''
                }`}
              >
                {/* ข้อมูลผู้ขอเบิก */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      ชื่อ-นามสกุล
                    </label>
                    <p className="text-sm font-medium">{selectedWithdraw.topic.fullname}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      เบอร์โทรศัพท์
                    </label>
                    <p className="text-sm font-medium">{selectedWithdraw.topic.phone}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      แผนก/หน่วยงาน
                    </label>
                    <p className="text-sm font-medium">{selectedWithdraw.topic.department}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      โครงการ/กิจกรรม
                    </label>
                    <p className="text-sm font-medium">{selectedWithdraw.topic.project}</p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      วัตถุประสงค์
                    </label>
                    <p className="text-sm font-medium">{selectedWithdraw.topic.purpose}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">สถานะ</label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedWithdraw.status === 'REQUESTED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedWithdraw.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedWithdraw.status}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      วันที่สร้าง
                    </label>
                    <p className="text-sm font-medium">{toThaiTime(selectedWithdraw.created_at)}</p>
                  </div>
                </div>

                {/* รายการสินค้า */}
                <div>
                  <p className="text-sm font-bold mb-3">รายการที่ขอเบิก:</p>
                  <div className="space-y-3">
                    {selectedWithdraw.items?.map((item) => (
                      <div key={item.withdraw_item_id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-base">{item.name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              หมวดหมู่: {item.category || '-'}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              item.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : item.status === 'returned'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.status || 'pending'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">จำนวนที่ขอ</p>
                            <p className="font-semibold">
                              {item.requested_quantity} {item.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">คงเหลือในสต็อก</p>
                            <p className="font-semibold">
                              {item.stock_quantity} {item.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">สถานะการอนุมัติ</p>
                            {item.approved_quantity !== null ? (
                              <div className="flex justify-between gap-2">
                                <p className="font-semibold text-green-600">
                                  อนุมัติ: {item.approved_quantity} {item.unit}
                                </p>

                                {/* ปุ่มคืนของ */}
                                {selectedWithdraw.status === 'APPROVED' &&
                                  item.approved_quantity > 0 &&
                                  item.returned_quantity == 0 && (
                                    <button
                                      onClick={() => handleReturn(item, selectedWithdraw.id)}
                                      className=" text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 w-fit"
                                    >
                                      คืนของเข้าสต็อก ↺
                                    </button>
                                  )}

                                {selectedWithdraw.status === 'APPROVED' &&
                                  item.approved_quantity > 0 &&
                                  item.returned_quantity > 0 && (
                                    <p className="font-semibold text-gray-400">
                                      คืน: {item.returned_quantity} {item.unit}
                                    </p>
                                  )}
                              </div>
                            ) : (
                              <p className="font-semibold text-gray-400">รอพิจารณา</p>
                            )}
                          </div>
                        </div>

                        {/* ฟอร์มอนุมัติ (แสดงเฉพาะสถานะ REQUESTED) */}
                        {selectedWithdraw.status === 'REQUESTED' && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                จำนวนที่อนุมัติ (สูงสุด: {item.requested_quantity})
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.requested_quantity}
                                value={
                                  Number(item.stock_quantity) === 0
                                    ? 0
                                    : approvalData[item.withdraw_item_id]?.approved_quantity || 0
                                }
                                onChange={(e) =>
                                  handleQuantityChange(item.withdraw_item_id, e.target.value)
                                }
                                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                  Number(item.stock_quantity) === 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : ''
                                }`}
                                disabled={Number(item.stock_quantity) === 0}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                เหตุผล (ถ้าปฏิเสธหรืออนุมัติบางส่วน)
                              </label>
                              <input
                                type="text"
                                placeholder="เช่น สต็อกไม่เพียงพอ"
                                value={approvalData[item.withdraw_item_id]?.reject_reason || ''}
                                onChange={(e) =>
                                  handleReasonChange(item.withdraw_item_id, e.target.value)
                                }
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* แสดงเหตุผลถ้ามี */}
                        {item.reject_reason && (
                          <div className="mt-3 p-3 bg-red-50 rounded">
                            <p className="text-xs text-red-600">
                              <span className="font-semibold">เหตุผล:</span> {item.reject_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* หมายเหตุการอนุมัติ */}
                {selectedWithdraw.approved_note && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-blue-900 mb-1">
                      หมายเหตุจากผู้อนุมัติ
                    </label>
                    <p className="text-sm text-blue-800">{selectedWithdraw.approved_note}</p>
                  </div>
                )}
                {selectedWithdraw.status === 'REQUESTED' && (
                  <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                    <label className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <span className="bg-indigo-600 w-1.5 h-4 rounded-full inline-block"></span>
                      หมายเหตุการอนุมัติ (ภาพรวม)
                    </label>
                    <textarea
                      rows="3"
                      placeholder="ระบุข้อความเพิ่มเติมถึงผู้เบิก เช่น 'มารับของได้ที่ตึก A ชั้น 2' หรือเหตุผลสรุปการอนุมัติ"
                      value={approveNote}
                      onChange={(e) => setApproveNote(e.target.value)}
                      className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white placeholder:text-gray-400 text-sm transition-all"
                    />
                    <p className="mt-2 text-xs text-indigo-400">
                      ** หมายเหตุนี้จะแสดงให้ผู้เบิกเห็นในหน้าสถานะใบเบิก
                    </p>
                  </div>
                )}
                {}
              </div>
            ) : null}

            <DialogFooter>
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                ปิด
              </button>

              {selectedWithdraw?.status === 'REQUESTED' && !loading && user.role != 'user' && (
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded ml-2"
                >
                  บันทึกการอนุมัติ
                </button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete} // เรียกใช้ฟังก์ชันที่เราเขียนไว้ในข้อ 2
          title="ยืนยันการยกเลิกใบเบิก"
          description="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกใบเบิกนี้? รายการสินค้าที่ยังไม่ได้รับจะถูกยกเลิกทั้งหมด"
        />
      </div>
    </>
  )
}
