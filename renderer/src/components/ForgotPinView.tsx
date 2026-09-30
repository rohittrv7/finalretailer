import React, { useState } from 'react'
import { PinPad } from './PinPad'
import { PinDots } from './PinDots'

interface ForgotPinViewProps {
  onBack: () => void
  onSuccess: (newRecoveryCode: string) => void
}

type Step = 'code' | 'new_pin' | 'confirm_pin'

export const ForgotPinView: React.FC<ForgotPinViewProps> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState<Step>('code')
  const [recoveryCode, setRecoveryCode] = useState<string>('')
  const [newPin, setNewPin] = useState<string>('')
  const [confirmPin, setConfirmPin] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleNextFromCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryCode.trim()) {
      setError('Please enter your recovery code')
      return
    }
    setError(null)
    setStep('new_pin')
  }

  const handleDigit = (d: string) => {
    setError(null)
    if (step === 'new_pin') {
      if (newPin.length < 6) setNewPin((prev) => prev + d)
    } else if (step === 'confirm_pin') {
      if (confirmPin.length < 6) setConfirmPin((prev) => prev + d)
    }
  }

  const handleBackspace = () => {
    setError(null)
    if (step === 'new_pin') setNewPin((prev) => prev.slice(0, -1))
    else if (step === 'confirm_pin') setConfirmPin((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setError(null)
    if (step === 'new_pin') setNewPin('')
    else if (step === 'confirm_pin') setConfirmPin('')
  }

  const handlePinSubmit = async () => {
    setError(null)
    if (step === 'new_pin') {
      if (newPin.length < 4) {
        setError('New PIN must be 4-6 digits')
        return
      }
      setStep('confirm_pin')
    } else if (step === 'confirm_pin') {
      if (confirmPin !== newPin) {
        setError('PIN confirmation does not match')
        setConfirmPin('')
        return
      }

      setIsSubmitting(true)
      try {
        const res = await window.electronAPI?.auth.resetWithRecovery(recoveryCode, newPin)
        if (res?.success && res.newRecoveryCode) {
          onSuccess(res.newRecoveryCode)
        } else {
          setError(res?.error || 'Invalid recovery code. Reset failed.')
          setStep('code')
          setNewPin('')
          setConfirmPin('')
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Reset failed')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const activeLength = step === 'new_pin' ? newPin.length : confirmPin.length

  return (
    <div className="min-h-screen w-full bg-[#0C0E12] text-[#F3F4F6] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 select-none relative overflow-x-hidden">
      {/* Two-Side Split Container */}
      <div className="w-full max-w-5xl bg-[#15181E] border border-[#262B36] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 z-10">
        {/* SIDE 1: Status & Info */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-[#15181E] border-b lg:border-b-0 lg:border-r border-[#262B36] space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span>🔑</span> PIN Recovery
            </div>
            <h1 className="text-3xl font-black text-[#F3F4F6] tracking-tight">Reset Terminal PIN</h1>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              {step === 'code' &&
                'Enter the one-time recovery code you received during first-time setup.'}
              {step === 'new_pin' &&
                'Use the keypad on the right to enter your new 4 to 6 digit security PIN.'}
              {step === 'confirm_pin' &&
                'Re-enter your new PIN on the keypad to confirm and unlock the terminal.'}
            </p>
          </div>

          {/* Display Box */}
          <div className="bg-[#0C0E12] border border-[#262B36] rounded-3xl p-6 text-center space-y-4 shadow-inner">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
              {step === 'code' ? 'Step 1: Enter Recovery Key' : 'Step 2: Set New PIN'}
            </div>

            {step === 'code' ? (
              <div className="text-sm text-[#9CA3AF] font-mono">
                Code format: <span className="text-amber-400 font-bold">RC-XXXX-XXXX</span>
              </div>
            ) : (
              <>
                <PinDots length={activeLength} maxLength={6} hasError={Boolean(error)} />
                <div className="text-sm font-mono font-bold text-amber-500">
                  {activeLength > 0
                    ? `${activeLength} of 6 digits entered`
                    : 'Tap digits on the right keypad'}
                </div>
              </>
            )}

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium rounded-xl">
                {error}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              ← Back to PIN Entry
            </button>
          </div>
        </div>

        {/* SIDE 2: Form or Keypad */}
        <div className="p-8 sm:p-10 flex flex-col justify-center items-center bg-[#11141A]">
          {step === 'code' ? (
            <form onSubmit={handleNextFromCode} className="w-full max-w-[340px] space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#9CA3AF] mb-2 uppercase tracking-wider">
                  One-Time Recovery Code
                </label>
                <input
                  type="text"
                  autoFocus
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RC-7A4B-9F2E"
                  className="w-full h-15 px-4 rounded-2xl bg-[#0C0E12] border border-[#262B36] font-mono text-center text-xl text-amber-400 font-bold tracking-widest placeholder:text-[#64748B] focus:outline-none focus:border-amber-500 transition-colors select-text"
                />
              </div>
              <button
                type="submit"
                disabled={!recoveryCode.trim()}
                className="w-full h-13 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-sm font-bold text-black transition-all cursor-pointer shadow-lg shadow-amber-950/40"
              >
                Verify Code & Set PIN →
              </button>
            </form>
          ) : (
            <div className="w-full max-w-[340px] space-y-3">
              <div className="text-center lg:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Touch Keypad
                </span>
                <p className="text-sm font-semibold text-[#F3F4F6]">Press digits below</p>
              </div>

              <PinPad
                onDigit={handleDigit}
                onBackspace={handleBackspace}
                onClear={handleClear}
                onSubmit={handlePinSubmit}
                disabled={isSubmitting}
                canSubmit={activeLength >= 4}
                submitLabel={
                  step === 'confirm_pin'
                    ? isSubmitting
                      ? 'Resetting PIN...'
                      : 'Confirm & Reset PIN'
                    : 'Next: Confirm PIN'
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
