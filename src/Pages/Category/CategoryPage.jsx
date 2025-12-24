import CategoryCard from './CategoryCard'
import { Watch } from 'lucide-react'
export default function CategoryPage() {
  return (
    <>
      <div className="categorypage w-full h-full mt-10">
        {/* Header */}
        <div className="header flex justify-between px-10 py-8 ">
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold">หมวดหมู่พัสดุ</p>
            <p className="text-gray-400">จัดการหมวดหมู่พัสดุของคุณ</p>
          </div>

          <button className="p-2 px-4 bg-primary w-fit h-fit rounded-2xl font-semibold text-white cursor-pointer hover:bg-secondary">
            + เพิ่มหมวดใหม่
          </button>
        </div>

        {/* Content */}
        <div className="bg-white w-full px-10 py-10 h-full">
          <div className="flex justify-end gap-6">
            <input type="text" name="search" className="border border-gray-300 rounded" />
            <button>ค้นหา</button>
            <button>ล้างการค้นหา</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            <CategoryCard icon={<Watch size={28} />} title="Accessories" count={58} />
            <CategoryCard icon={<Watch size={28} />} title="Accessories" count={58} />
            <CategoryCard icon={<Watch size={28} />} title="Accessories" count={58} />
            <CategoryCard icon={<Watch size={28} />} title="Accessories" count={58} />
            <CategoryCard icon={<Watch size={28} />} title="Accessories" count={58} />
            <CategoryCard icon={<Watch size={28} />} title="Accessories" count={58} />
          </div>
        </div>
      </div>
    </>
  )
}
