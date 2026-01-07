import { ShoppingBasket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function FloatingCartButton({ count = 0 }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/wishlist')}
      className="
        fixed bottom-6 right-6 z-50
        bg-primary text-white
        w-14 h-14 rounded-full
        flex items-center justify-center
        shadow-lg
        hover:scale-105 active:scale-95
        transition cursor-pointer
      "
    >
      <ShoppingBasket className="w-6 h-6" />

      {count > 0 && (
        <span
          className="
            absolute -top-1 -right-1
            bg-red-500 text-white text-xs
            w-5 h-5 rounded-full
            flex items-center justify-center
          "
        >
          {count}
        </span>
      )}
    </button>
  )
}
