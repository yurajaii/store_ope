export default function CategoryCard({ icon, title, count }) {
  return (
    <div
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
        {icon}
      </div>

      <div className="flex flex-col justify-start items-start w-full pl-2">
        {/* Title */}
        <p className="font-semibold ">{title}</p>

        {/* Count */}
        <span className="text-sm text-gray-500">{count} รายการ</span>
      </div>
    </div>
  )
}
