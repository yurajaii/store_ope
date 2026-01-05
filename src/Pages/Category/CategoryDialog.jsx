import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { CATEGORY_ICON_MAP } from './categoryIcons'

export default function CategoryDialog({ mode, defaultData, open, onClose, onSubmit }) {
  const [category, setCategory] = useState(defaultData?.category || '')
  const [subcategory, setSubcategory] = useState(defaultData?.subcategory || '')

  const [iconKey, setIconKey] = useState(defaultData?.icon || '')

  const handleSubmit = () => {
    onSubmit({
      id: defaultData?.id,
      category,
      subcategory,
      icon: iconKey,
    })

    onClose()
  }

  useEffect(() => {
    if (defaultData) {
      setCategory(defaultData.category || '')
      setSubcategory(defaultData.subcategory || '')
      setIconKey(defaultData.icon || '')
    } else {
      setCategory('')
      setSubcategory('')
      setIconKey('')
    }
  }, [defaultData, open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg font-[prompt]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'เพิ่มหมวดใหม่' : 'แก้ไขหมวด'}</DialogTitle>
          <DialogDescription>กรอกข้อมูลหมวดหมู่และหมวดย่อย</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">หมวดหลัก</label>
            <input
              className={`border p-2 rounded ${
                mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="เช่น ไฟฟ้า"
              disabled={mode === 'edit'}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">หมวดย่อย</label>
            <input
              className="border p-2 rounded"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="เช่น หลอดไฟ"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Icon</label>
            {/* <input
              className="border p-2 rounded"
              value={iconKey}
              onChange={(e) => setIconKey(e.target.value)}
              placeholder="เช่น box หรือ lightbulb"
            /> */}

            <div className="grid grid-cols-4 gap-3">
              {CATEGORY_ICON_MAP.map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIconKey(key)}
                  className={`border p-3 rounded hover:bg-gray-100
                  ${iconKey === key ? 'ring-2 ring-primary' : ''}
                `}
                >
                  <Icon size={24} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button className="bg-gray-200 px-4 py-2 rounded" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="bg-primary text-white px-4 py-2 rounded" onClick={handleSubmit}>
            บันทึก
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
