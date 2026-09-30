import React, { useState } from 'react'
import { PinPad } from './PinPad'
import { PinDots } from './PinDots'

interface ChangePinModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'current' | 'new' | 'confirm'

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>('current')
  const [currentPin, setCurrentPin] = useState<string>('')
  const [newPin, setNewPin] = useState<string>('')
  const [confirmPin, setConfirmPin] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  if (!isOpen) return null

  const handleDigit = (d: string) => {
    setError(null)
    if (step === 'current') {
      if (currentPin.length < 6) setCurrentPin((prev) => prev + d)
    } else if (step === 'new') {
      if (newPin.length < 6) setNewPin((prev) => prev + d)
    } else {
      if (confirmPin.length < 6) setConfirmPin((prev) => prev + d)
    }
  }

  const handleBackspace = () => {
    setError(null)
    if (step === 'current') setCurrentPin((prev) => prev.slice(0, -1))
    else if (step === 'new') setNewPin((prev) => prev.slice(0, -1))
    else setConfirmPin((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setError(null)
    if (step === 'current') setCurrentPin('')
    else if (step === 'new') setNewPin('')
    else setConfirmPin('')
  }

  const handleNext = async () => {
    setError(null)

    if (step === 'current') {
      if (currentPin.length < 4) {
        setError('Current PIN must be 4-6 digits')
        return
      }
      setStep('new')
    } else if (step === 'new') {
      if (newPin.length < 4) {
        setError('New PIN must be 4-6 digits')
        return
      }
      if (newPin === currentPin) {
        setError('New PIN must be different from current PIN')
        return
      }
      setStep('confirm')
    } else {
      if (confirmPin !== newPin) {
        setError('PIN confirmation does not match')
        setConfirmPin('')
        return
      }

      setIsSubmitting(true)
      try {
        const result = await window.electronAPI?.auth.changePin(currentPin, newPin)
        if (result?.success) {
          onSuccess()
          onClose()
        } else {
          setError(result?.error || 'Failed to update PIN')
          setStep('current')
          setCurrentPin('')
          setNewPin('')
          setConfirmPin('')
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error updating PIN')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const activeLength =
    step === 'current' ? currentPin.length : step === 'new' ? newPin.length : confirmPin.length

  const canProceed = activeLength >= 4

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#15181E] border border-[#262B36] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#262B36] pb-3">
          <h2 className="text-base font-bold text-[#F3F4F6]">Change Terminal PIN</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#1C2028] text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold text-[#9CA3AF]">
            {step === 'current' && 'Step 1/3: Enter Current PIN'}
            {step === 'new' && 'Step 2/3: Enter New 4-6 Digit PIN'}
            {step === 'confirm' && 'Step 3/3: Re-enter New PIN to Confirm'}
          </p>
          <PinDots length={activeLength} maxLength={6} hasError={Boolean(error)} />
          {error && <p className="text-xs text-red-400 font-medium mt-1">{error}</p>}
        </div>

        <PinPad
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          onClear={handleClear}
          onSubmit={handleNext}
          disabled={isSubmitting}
          canSubmit={canProceed}
          submitLabel={step === 'confirm' ? (isSubmitting ? 'Updating...' : 'Save New PIN') : 'Next'}
        />
      </div>
    </div>
  )
}
