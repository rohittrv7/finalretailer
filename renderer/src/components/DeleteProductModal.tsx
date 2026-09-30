import React from 'react'

interface DeleteProductModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  productName: string
  isDeleting?: boolean
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  isDeleting = false,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#15181E] border border-[#262B36] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-scale-up">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xl border border-red-500/20 mx-auto">
          🗑️
        </div>

        <div>
          <h3 className="text-base font-bold text-[#F3F4F6]">Delete Product?</h3>
          <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
            Are you sure you want to remove <strong className="text-[#F3F4F6]">"{productName}"</strong> from
            your catalog? This will delete its record from SQLite.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl bg-[#1C2028] hover:bg-[#262B36] active:scale-95 text-xs font-semibold text-[#9CA3AF] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-red-950/60 transition-all cursor-pointer"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
