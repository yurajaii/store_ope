import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useEffect } from 'react'
import api from '@/Utils/api'

export default function InventoryDialog({ open, onClose, items = [], onUpdate }) {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [type, setType] = useState('IN')
  const [quantity, setQuantity] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    if (open) {
      setSelectedItemId('')
      setType('IN')
      setQuantity('')
      setReferenceId('')
      setRemark('')
    }
  }, [open])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        item_id: Number(selectedItemId),
        type: type,
        quantity: Number(quantity),
        reference_id: referenceId,
        remark: remark,
      }

      await api.post(`${API_URL}/inventory/log`, payload)

      if (onUpdate) onUpdate()
      onClose()
    } catch (error) {
      console.error('Update inventory error:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* {console.log(items)} */}
      <DialogContent className="sm:max-w-md font-[prompt]">
        <DialogHeader>
          <DialogTitle>จัดการสต็อกพัสดุ</DialogTitle>
          <DialogDescription>เพิ่มหรือปรับปรุงจำนวนพัสดุในคลัง</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* เลือกพัสดุ */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">เลือกพัสดุ</label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกรายการพัสดุ" />
              </SelectTrigger>
              <SelectContent className="font-[prompt] max-h-75 overflow-y-auto">
                {items.map((item) => (
                  <SelectItem key={item.item_id} value={item.item_id.toString()}>
                    {item.name} (คงเหลือ: {item.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* ประเภทการทำรายการ */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">ประเภท</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-[prompt]">
                  <SelectItem value="IN">นำเข้า</SelectItem>
                  <SelectItem value="ADJUST">ปรับปรุง</SelectItem>
                  <SelectItem value="RETURN">รับคืน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* จำนวน */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">จำนวน</label>
              <input
                type="number"
                className="border p-2 rounded h-10 outline-none focus:border-primary"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* เลขที่อ้างอิง */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">เลขที่อ้างอิง (เช่น เลข PO / ใบเบิก)</label>
            <input
              className="border p-2 rounded outline-none focus:border-primary"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="REF-XXXXX"
            />
          </div>

          {/* หมายเหตุ */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">หมายเหตุ</label>
            <textarea
              className="border p-2 rounded outline-none focus:border-primary"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="ระบุเหตุผลการเพิ่ม/ปรับปรุง..."
            />
          </div>
        </div>

        <DialogFooter>
          <button className="bg-gray-100 px-4 py-2 rounded-xl" onClick={onClose} disabled={loading}>
            ยกเลิก
          </button>
          <button
            className="bg-primary text-white px-6 py-2 rounded-xl hover:bg-secondary transition-colors"
            onClick={handleSubmit}
            disabled={!selectedItemId || !quantity || loading}
          >
            {loading ? 'กำลังบันทึก...' : 'ยืนยันเพิ่มสต็อก'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
