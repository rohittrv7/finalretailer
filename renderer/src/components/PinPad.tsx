import React, { useEffect } from 'react'

interface PinPadProps {
  onDigit: (digit: string) => void
  onBackspace: () => void
  onClear: () => void
  onSubmit?: () => void
  disabled?: boolean
  submitLabel?: string
  canSubmit?: boolean
}

const PAD_BUTTONS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
]

export const PinPad: React.FC<PinPadProps> = ({
  onDigit,
  onBackspace,
  onClear,
  onSubmit,
  disabled = false,
  submitLabel = 'Confirm',
  canSubmit = false,
}) => {
  // Support physical keyboard as well as touch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return

      if (/^[0-9]$/.test(e.key)) {
        onDigit(e.key)
      } else if (e.key === 'Backspace') {
        onBackspace()
      } else if (e.key === 'Escape') {
        onClear()
      } else if (e.key === 'Enter' && canSubmit && onSubmit) {
        onSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, onDigit, onBackspace, onClear, onSubmit, canSubmit])

  return (
    <div className="w-full max-w-[360px] mx-auto select-none space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {PAD_BUTTONS.map(({ digit, letters }) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => onDigit(digit)}
            className="h-16 sm:h-20 rounded-2xl bg-[#15181E] hover:bg-[#1C2028] active:scale-95 active:border-amber-500/60 disabled:opacity-30 disabled:pointer-events-none border border-[#262B36] hover:border-[#384050] shadow-sm transition-all duration-150 flex flex-col items-center justify-center cursor-pointer group"
          >
            <span className="text-xl sm:text-2xl font-bold text-[#F3F4F6] group-hover:text-amber-400 transition-colors">
              {digit}
            </span>
            {letters ? (
              <span className="text-[10px] font-semibold tracking-widest text-[#64748B] group-hover:text-[#9CA3AF] mt-0.5">
                {letters}
              </span>
            ) : (
              <span className="h-[14px]" />
            )}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="h-16 sm:h-20 rounded-2xl bg-[#15181E]/60 hover:bg-red-500/10 active:scale-95 text-xs font-bold uppercase tracking-wider text-[#9CA3AF] hover:text-red-400 border border-[#262B36] hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
        >
          Clear
        </button>

        {/* 0 Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDigit('0')}
          className="h-16 sm:h-20 rounded-2xl bg-[#15181E] hover:bg-[#1C2028] active:scale-95 active:border-amber-500/60 disabled:opacity-30 disabled:pointer-events-none border border-[#262B36] hover:border-[#384050] shadow-sm transition-all duration-150 flex flex-col items-center justify-center cursor-pointer group"
        >
          <span className="text-xl sm:text-2xl font-bold text-[#F3F4F6] group-hover:text-amber-400 transition-colors">
            0
          </span>
          <span className="text-[10px] font-semibold tracking-widest text-[#64748B] group-hover:text-[#9CA3AF] mt-0.5">
            +
          </span>
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={onBackspace}
          className="h-16 sm:h-20 rounded-2xl bg-[#15181E]/60 hover:bg-amber-500/10 active:scale-95 text-[#9CA3AF] hover:text-amber-400 border border-[#262B36] hover:border-amber-500/30 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Delete last digit"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.5-6.5a1.5 1.5 0 011.06-.44H20a2 2 0 012 2v10a2 2 0 01-2 2h-9.44a1.5 1.5 0 01-1.06-.44L3 12z"
            />
          </svg>
        </button>
      </div>

      {/* Action / Submit Button */}
      {onSubmit && (
        <button
          type="button"
          disabled={disabled || !canSubmit}
          onClick={onSubmit}
          className="w-full h-13 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none text-sm font-bold text-black shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <span>{submitLabel}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      )}
    </div>
  )
}
