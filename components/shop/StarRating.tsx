'use client'

import { Star } from 'lucide-react'

interface Props {
  value: number
  max?: number
  interactive?: boolean
  onChange?: (rating: number) => void
  size?: number
}

export default function StarRating({ value, max = 5, interactive = false, onChange, size = 18 }: Props) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          >
            <Star
              size={size}
              className={filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            />
          </button>
        )
      })}
    </div>
  )
}
