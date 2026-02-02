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

import { useMsal } from '@azure/msal-react'

export default function WishlistPage({ onUpdate }) {
  const API_URL = import.meta.env.VITE_API_URL
  const [wishlist, setWishlist] = useState([])
  const [selectedItems, setSelectedItems] = useState({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const { instance, accounts } = useMsal()

  // Form data สำหรับ topic
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    department: '',
    purpose: '',
    project: '',
  })

  const fetchWishlist = async () => {
    try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['api://f759d6b0-6c0b-4316-ad63-84ba6492af49/access_as_user'],
        account: accounts[0],
      })
      const token = tokenResponse.accessToken
      const res = await api.get(`${API_URL}/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
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
      if (currentQty <= 1) {
        await api.delete(`${API_URL}/wishlist/${itemId}`, {
          data: { user_id: 2 },
        })
        await onUpdate()
        fetchWishlist()
        return
      }

      const newQty = currentQty - 1
      await api.patch(`${API_URL}/wishlist/${itemId}`, {
        user_id: 2,
        default_quantity: newQty,
      })

      await onUpdate()
      fetchWishlist()
    } catch (err) {
      console.error(err)
    }
  }

  const handleIncrease = async (itemId, currentQty) => {
    try {
      const newQty = currentQty + 1
      await api.patch(`${API_URL}/wishlist/${itemId}`, {
        user_id: 2,
        default_quantity: newQty,
      })

      await onUpdate()
      fetchWishlist()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (itemId) => {
    try {
      await api.delete(`${API_URL}/wishlist/${itemId}`)
      await onUpdate()
      fetchWishlist()
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
      // Validate form
      if (
        !formData.fullname.trim() ||
        !formData.phone.trim() ||
        !formData.department.trim() ||
        !formData.purpose.trim() ||
        !formData.project.trim()
      ) {
        alert('กรุณากรอกข้อมูลให้ครบทุกช่อง')
        return
      }

      const itemsToWithdraw = wishlist
        .filter((w) => selectedItems[w.item_id])
        .map((w) => ({
          item_id: w.item_id,
          quantity: w.default_quantity,
        }))

      // ส่งตาม format ที่ต้องการ
      const response = await api.post(`${API_URL}/withdraw`, {
        requestedBy: 2, // user_id
        topic: {
          fullname: formData.fullname,
          phone: formData.phone,
          department: formData.department,
          purpose: formData.purpose,
          project: formData.project,
        },
        items: itemsToWithdraw,
      })

      if (response.data.success) {
        alert('เบิกของสำเร็จ!')

        for (const item of itemsToWithdraw) {
          await api.delete(`${API_URL}/wishlist/${item.item_id}`, {
            data: { user_id: 2 },
          })
        }

        setSelectedItems({})
        setFormData({
          fullname: '',
          phone: '',
          department: '',
          purpose: '',
          project: '',
        })
        setDialogOpen(false)
        await onUpdate()
        fetchWishlist()
      }
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาด')
    }
  }
  return (
    <>
      <div className="categorypage w-full h-full mt-10">
        {/* Header */}
        <div className="header flex justify-between px-10 py-8 ">
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold">ตระกร้าของฉัน</p>
            <p className="text-gray-400">แก้ไข ลบตระกร้า และสร้างใบเบิกได้ที่นี่</p>
          </div>
          <button
            onClick={handleOpenDialog}
            className="p-2 px-4 bg-primary w-fit h-fit rounded-2xl font-semibold text-white cursor-pointer hover:bg-secondary"
          >
            + สร้างใบเบิก
          </button>
        </div>

        {/* Content */}
        <div className="bg-white px-10 py-10">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {wishlist.length === 0 && (
              <div className="text-center py-12 text-gray-500">ยังไม่มีพัสดุในตระกร้า</div>
            )}
            {wishlist.map((w) => (
              <div
                key={w.item_id}
                className="flex items-center justify-between gap-3 p-2 pl-8 border-b hover:bg-blue-100"
              >
                <input
                  type="checkbox"
                  checked={selectedItems[w.item_id] || false}
                  onChange={() => handleCheckbox(w.item_id)}
                  className="w-5 h-5 accent-black bg-white border-2 border-gray-300 rounded cursor-pointer"
                />

                <div className="font-base flex-1">{w.name}</div>
                <div className="flex items-center border-gray-300 rounded">
                  <button
                    className="flex items-center justify-center  w-4 h-4 bg-gray-300 hover:bg-gray-400 text-black text-s rounded"
                    onClick={() => handleDecrease(w.item_id, w.default_quantity)}
                  >
                    -
                  </button>
                  <div className="text-center px-3 ">{w.default_quantity}</div>

                  <button
                    className="flex items-center justify-center w-4 h-4 bg-gray-300 hover:bg-gray-400 text-black text-s border-b border-gray-300 rounded"
                    onClick={() => handleIncrease(w.item_id, w.default_quantity)}
                  >
                    +
                  </button>
                </div>
                <div
                  className="p-2 text-red-400 cursor-pointer  hover:bg-red-100 rounded-full transition-colors disabled:opacity-30"
        
                  onClick={() => handleDelete(w.item_id)}
                >
                  <Trash2 size={20} />
                </div>
              </div>
            ))}
          </div>

          {/* Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="font-[prompt] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ยืนยันการเบิกพัสดุ</DialogTitle>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {/* ชื่อ-นามสกุล */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น รุ่งรวง วิบูญานนท์"
                    value={formData.fullname}
                    onChange={(e) => handleInputChange('fullname', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* เบอร์โทร */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 6058"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* แผนก */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    แผนก/หน่วยงาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น กองอาคารและสิ่งแวดล้อม [20105]"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* วัตถุประสงค์ */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    วัตถุประสงค์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ทดแทนของเก่าที่หมด แผนซ่อมบำรุง"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* โครงการ/กิจกรรม */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    โครงการ/กิจกรรม <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น กิจกรรมปี เสาหรุส"
                    value={formData.project}
                    onChange={(e) => handleInputChange('project', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* รายการที่เลือก */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">รายการที่เลือก:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {wishlist
                      .filter((w) => selectedItems[w.item_id])
                      .map((w) => (
                        <li key={w.item_id}>
                          • {w.name} (จำนวน: {w.default_quantity})
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <DialogFooter>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmitWithdraw}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded ml-2"
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
