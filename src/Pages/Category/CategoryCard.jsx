import { Box } from 'lucide-react'
import { CATEGORY_ICON_MAP } from './categoryIcons'

export default function CategoryCard({ icon, title, count, category, subcategory, onClick }) {
  const Icon = CATEGORY_ICON_MAP[icon] || Box

  return (
    <div
      onClick={onClick}
      className="
        flex flex-col items-center justify-center
        h-60 p-4
        rounded-lg
        bg-gray-200
        cursor-pointer
        transition-all duration-200
        hover:scale-[1.02]
        hover:shadow-md
      "
    >
      {/* Icon */}
      <div className="flex justify-center items-center mb-4 bg-secondary w-full h-[70%] rounded-lg">
        <Icon size={32} />
      </div>

      <div className="flex flex-col justify-start items-start w-full pl-2">
        {/* Title */}
        <p className="font-semibold">{title ? title : subcategory}</p>

        {/* Meta */}
        {subcategory
          ? `${category} > ${subcategory}`
          : count > 0 && <span className="text-xs text-gray-500">{count} หมวด</span>}
      </div>
    </div>
  )
}
