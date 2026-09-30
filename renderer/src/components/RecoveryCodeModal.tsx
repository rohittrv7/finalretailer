import React, { useState } from 'react'

interface RecoveryCodeModalProps {
  recoveryCode: string
  isOpen: boolean
  onConfirm: () => void
  title?: string
  subtitle?: string
}

export const RecoveryCodeModal: React.FC<RecoveryCodeModalProps> = ({
  recoveryCode,
  isOpen,
  onConfirm,
  title = 'Save Your One-Time Recovery Code',
  subtitle = 'This code is shown ONLY ONCE. Write it down or save it safely. You will need it to reset your PIN if forgotten.',
}) => {
  const [copied, setCopied] = useState<boolean>(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#15181E] border border-[#262B36] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#F3F4F6] tracking-tight">{title}</h2>
          <p className="text-xs text-[#9CA3AF] mt-2 leading-relaxed">{subtitle}</p>
        </div>

        {/* Code display */}
        <div className="bg-[#0C0E12] border border-[#262B36] rounded-2xl p-4 flex items-center justify-between gap-3">
          <span className="text-2xl font-mono font-bold tracking-widest text-amber-400 select-all">
            {recoveryCode}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-[#1C2028] hover:bg-[#262B36] text-xs font-semibold text-[#F3F4F6] border border-[#262B36] transition-colors cursor-pointer shrink-0"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-left">
          <p className="text-[11px] text-amber-400/90 leading-tight">
            <strong>Important:</strong> Store this recovery key in a safe place. If you lose both your PIN
            and this key, your local database access cannot be recovered without a technical reset.
          </p>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-sm font-bold text-black shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
        >
          I Have Saved This Code — Proceed to App
        </button>
      </div>
    </div>
  )
}
