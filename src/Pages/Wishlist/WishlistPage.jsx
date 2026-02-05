import { useState, useEffect } from 'react'
import api from '@/Utils/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMsal } from '@azure/msal-react'

export default function WishlistPage({ onUpdate }) {
  const API_URL = import.meta.env.VITE_API_URL
  const [wishlist, setWishlist] = useState([])
  const [selectedItems, setSelectedItems] = useState({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const { instance, accounts } = useMsal()

  // ดึง oid จาก accounts เพื่อใช้ระบุตัวตนผู้ใช้
  const userOid = accounts[0]?.idTokenClaims?.oid || accounts[0]?.localAccountId

  // Form data สำหรับใบเบิก
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    department: '',
    purpose: '',
    project: '',
  })

  // ฟังก์ชันกลางสำหรับดึง Access Token
  const getAccessToken = async () => {
    try {
      const response = await instance.acquireTokenSilent({
        scopes: ['api://f759d6b0-6c0b-4316-ad63-84ba6492af49/access_as_user'],
        account: accounts[0],
      })
      return response.accessToken
    } catch (error) {
      console.error('Token acquisition failed:', error)
      return null
    }
  }

  // ดึงข้อมูล Wishlist ของผู้ใช้คนนั้นๆ
  const fetchWishlist = async () => {
    try {
      const token = await getAccessToken()
      if (!token) return

      const res = await api.get(`${API_URL}/wishlist`)
      setWishlist(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [])

  const handleCheckbox = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const handleDecrease = async (itemId, currentQty) => {
    try {
      const token = await getAccessToken()
      if (!token) return

      if (currentQty <= 1) {
        await api.delete(`${API_URL}/wishlist/${itemId}`)
        await onUpdate()
        fetchWishlist()
        return
      }

      const newQty = currentQty - 1
      await api.patch(`${API_URL}/wishlist/${itemId}`, { default_quantity: newQty })

      await onUpdate()
      fetchWishlist()
    } catch (err) {
      console.error(err)
    }
  }

  const handleIncrease = async (itemId, currentQty) => {
    try {
      const token = await getAccessToken()
      if (!token) return

      const newQty = currentQty + 1
      await api.patch(`${API_URL}/wishlist/${itemId}`, { default_quantity: newQty })

      await onUpdate()
      fetchWishlist()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (itemId) => {
    try {
      const token = await getAccessToken()
      if (!token) return

      await api.delete(`${API_URL}/wishlist/${itemId}`)
      await onUpdate()
      fetchWishlist()
      toast.success('ลบสินค้าออกจากตระกร้าแล้ว')
    } catch (error) {
      console.error(error)
    }
  }

  const handleOpenDialog = () => {
    const selectedCount = Object.values(selectedItems).filter(Boolean).length
    if (selectedCount === 0) {
      alert('กรุณาเลือกรายการที่ต้องการเบิก')
      return
    }
    setDialogOpen(true)
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmitWithdraw = async () => {
    try {
      if (Object.values(formData).some((val) => !val.trim())) {
        toast.error('กรุณากรอกข้อมูลให้ครบทุกช่อง')
        return
      }

      const token = await getAccessToken()
      if (!token) return

      const itemsToWithdraw = wishlist
        .filter((w) => selectedItems[w.item_id])
        .map((w) => ({
          item_id: w.item_id,
          quantity: w.default_quantity,
        }))

      const response = await api.post(`${API_URL}/withdraw`, {
        requestedBy: userOid,
        topic: { ...formData },
        items: itemsToWithdraw,
      })

      if (response.data.success) {
        toast.success(`สร้างใบเบิกหมายเลข ${response.data.withdraw_id} สำเร็จ!`)

        for (const item of itemsToWithdraw) {
          await api.delete(`${API_URL}/wishlist/${item.item_id}`)
        }

        setSelectedItems({})
        setFormData({ fullname: '', phone: '', department: '', purpose: '', project: '' })
        setDialogOpen(false)
        await onUpdate()
        fetchWishlist()
      }
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาดในการเบิก')
    }
  }

  return (
    <>
      <div className="categorypage w-full h-full mt-10 font-[prompt]">
        <div className="header flex justify-between px-10 py-8 ">
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold">ตะกร้าของฉัน</p>
            <p className="text-gray-400">แก้ไข ลบรายการ และสร้างใบเบิกได้ที่นี่</p>
          </div>
          <button
            onClick={handleOpenDialog}
            className="p-2 px-6 bg-primary w-fit h-fit rounded-2xl font-semibold text-white cursor-pointer hover:bg-indigo-700 transition-colors"
          >
            + สร้างใบเบิก
          </button>
        </div>

        <div className="bg-white px-10 py-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {wishlist.length === 0 ? (
              <div className="text-center py-20 text-gray-500">ยังไม่มีพัสดุในตะกร้า</div>
            ) : (
              wishlist.map((w) => (
                <div
                  key={w.item_id}
                  className="flex items-center justify-between gap-3 p-4 pl-8 border-b hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems[w.item_id] || false}
                    onChange={() => handleCheckbox(w.item_id)}
                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                  />
                  <div className="font-medium flex-1 ml-4 text-gray-700">
                    {w.name} <span className="text-xs text-gray-400">({w.unit})</span>
                  </div>
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      className="flex items-center justify-center w-8 h-8 bg-white hover:bg-gray-200 text-gray-600 rounded shadow-sm transition-colors"
                      onClick={() => handleDecrease(w.item_id, w.default_quantity)}
                    >
                      {' '}
                      -{' '}
                    </button>
                    <div className="text-center px-4 font-semibold w-12">{w.default_quantity}</div>
                    <button
                      className="flex items-center justify-center w-8 h-8 bg-white hover:bg-gray-200 text-gray-600 rounded shadow-sm transition-colors"
                      onClick={() => handleIncrease(w.item_id, w.default_quantity)}
                    >
                      {' '}
                      +{' '}
                    </button>
                  </div>
                  <button
                    className="p-2 ml-4 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    onClick={() => handleDelete(w.item_id)}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  ยืนยันการเบิกพัสดุ
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {Object.keys(formData).map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1 capitalize text-gray-700">
                      {key === 'fullname'
                        ? 'ชื่อ-นามสกุล'
                        : key === 'phone'
                          ? 'เบอร์โทรศัพท์'
                          : key === 'department'
                            ? 'แผนก/หน่วยงาน'
                            : key === 'purpose'
                              ? 'วัตถุประสงค์'
                              : 'โครงการ/กิจกรรม'}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                ))}
                <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-bold mb-2 text-indigo-900">รายการพัสดุที่จะเบิก:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {wishlist
                      .filter((w) => selectedItems[w.item_id])
                      .map((w) => (
                        <li
                          key={w.item_id}
                          className="flex justify-between border-b border-gray-200 py-1 last:border-0"
                        >
                          <span>• {w.name}</span>
                          <span className="font-bold">
                            x {w.default_quantity} {w.unit}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <button
                  onClick={() => setDialogOpen(false)}
                  className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmitWithdraw}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all"
                >
                  ยืนยันการเบิก
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}
