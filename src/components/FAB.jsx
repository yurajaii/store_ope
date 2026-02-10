import { ShoppingBasket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export function FloatingCartButton({ count = 0 }) {
  const navigate = useNavigate()
  return (
    <motion.button
      key={count}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate('/wishlist')}
      className="
        fixed bottom-6 right-6 z-50
        bg-primary text-white
        w-14 h-14 rounded-full
        flex items-center justify-center
        shadow-lg
        hover:scale-110 active:scale-90
        transition-shadow cursor-pointer
      "
    >
      <ShoppingBasket className="w-6 h-6" />

      <AnimatePresence>
        {count > 0 && (
          <motion.span
            // Animation เฉพาะจุดสีแดงให้เด้งออกมา
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="
              absolute -top-1 -right-1
              bg-red-500 text-white text-xs
              w-5 h-5 rounded-full
              flex items-center justify-center
            "
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
