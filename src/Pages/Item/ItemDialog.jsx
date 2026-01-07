/* eslint-disable react-hooks/set-state-in-effect */
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

export default function ItemDialog({
  open,
  onClose,
  mode = 'add',
  categories = [],
  defaultData,
  onSubmit,
}) {
  const [category, setCategory] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')

  // preload / reset
  useEffect(() => {
    if (mode === 'edit' && defaultData) {
      setCategory(defaultData.category || '')
      setSubcategoryId(defaultData.category_id?.toString() || '')
      setName(defaultData.name || '')
      setUnit(defaultData.unit || '')
    } else {
      setCategory('')
      setSubcategoryId('')
      setName('')
      setUnit('')
    }
  }, [mode, defaultData, open])

  // หมวดหลัก (ไม่ซ้ำ)
  const mainCategories = Array.from(new Set(categories.map((c) => c.category)))

  // หมวดย่อยตามหมวด
  const subcategories = categories.filter((c) => c.category === category)

  const handleSubmit = () => {
    onSubmit({
      category_id: Number(subcategoryId),
      name,
      unit,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md font-[prompt]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'เพิ่มพัสดุ' : 'แก้ไขพัสดุ'}</DialogTitle>
          <DialogDescription>กรอกข้อมูลพัสดุและเลือกหมวดหมู่ให้ถูกต้อง</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* หมวด */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">หมวด</label>
            <Select
              value={category}
              onValueChange={(val) => {
                setCategory(val)
                setSubcategoryId('')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวด" />
              </SelectTrigger>
              <SelectContent>
                {mainCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* หมวดย่อย */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">หมวดย่อย</label>
            <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={!category}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดย่อย" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ชื่อพัสดุ */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">ชื่อพัสดุ</label>
            <input
              className="border p-2 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น หลอดไฟ LED"
            />
          </div>

          {/* หน่วย */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">หน่วยนับ</label>
            <input
              className="border p-2 rounded"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="เช่น ชิ้น / กล่อง / แพ็ค"
            />
          </div>
        </div>

        <DialogFooter>
          <button className="bg-gray-200 px-4 py-2 rounded" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            className="bg-primary text-white px-4 py-2 rounded"
            onClick={handleSubmit}
            disabled={!subcategoryId || !name || !unit}
          >
            บันทึก
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
