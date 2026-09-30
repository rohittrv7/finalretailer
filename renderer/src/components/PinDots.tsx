import React from 'react'

interface PinDotsProps {
  length: number
  maxLength?: number
  hasError?: boolean
}

export const PinDots: React.FC<PinDotsProps> = ({ length, maxLength = 6, hasError = false }) => {
  return (
    <div className="flex items-center justify-center gap-3.5 my-5">
      {Array.from({ length: maxLength }).map((_, index) => {
        const isFilled = index < length
        return (
          <div
            key={index}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              isFilled
                ? hasError
                  ? 'bg-red-500 scale-125 ring-4 ring-red-500/25 shadow-lg shadow-red-500/40'
                  : 'bg-amber-400 scale-125 ring-4 ring-amber-500/25 shadow-lg shadow-amber-500/40'
                : 'bg-[#1C2028] border border-[#262B36]'
            }`}
          />
        )
      })}
    </div>
  )
}
