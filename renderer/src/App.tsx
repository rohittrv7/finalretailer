import { useState, useEffect } from 'react'
import { PinPad } from './components/PinPad'
import { PinDots } from './components/PinDots'
import { RecoveryCodeModal } from './components/RecoveryCodeModal'
import { ForgotPinView } from './components/ForgotPinView'
import { Dashboard } from './components/Dashboard'

type SetupStep = 'enter' | 'confirm'

export function App() {
  const [loading, setLoading] = useState<boolean>(true)
  const [isPinConfigured, setIsPinConfigured] = useState<boolean>(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  // PIN Entry state
  const [enteredPin, setEnteredPin] = useState<string>('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)

  // Rate-limiting / lockout state
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0)

  // Setup state
  const [setupStep, setSetupStep] = useState<SetupStep>('enter')
  const [initialPin, setInitialPin] = useState<string>('')
  const [confirmPin, setConfirmPin] = useState<string>('')
  const [setupError, setSetupError] = useState<string | null>(null)

  // Recovery Code Modal state
  const [recoveryModalCode, setRecoveryModalCode] = useState<string | null>(null)

  // Forgot PIN view state
  const [showForgotPin, setShowForgotPin] = useState<boolean>(false)

  // Check initial configuration, session unlock status, and lock status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (window.electronAPI?.auth) {
          const configured = await window.electronAPI.auth.isConfigured()
          setIsPinConfigured(configured)

          // If PIN is configured, check if this session was already unlocked in the main process
          if (configured) {
            const isUnlocked = await window.electronAPI.auth.isSessionUnlocked()
            if (isUnlocked) {
              setIsAuthenticated(true)
            }
          }

          const lockStatus = await window.electronAPI.auth.getLockStatus()
          if (lockStatus?.isLocked && lockStatus.remainingSeconds > 0) {
            setLockoutSeconds(lockStatus.remainingSeconds)
          }
        }
      } catch (err) {
        console.error('Error checking auth configuration', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setPinError(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [lockoutSeconds])


  // --- Handlers for Enter PIN (Subsequent Launches) ---
  const handleDigit = (d: string) => {
    if (lockoutSeconds > 0 || isVerifying) return
    setPinError(null)
    if (enteredPin.length < 6) {
      setEnteredPin((prev) => prev + d)
    }
  }

  const handleBackspace = () => {
    if (lockoutSeconds > 0 || isVerifying) return
    setPinError(null)
    setEnteredPin((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    if (lockoutSeconds > 0 || isVerifying) return
    setPinError(null)
    setEnteredPin('')
  }

  const handleVerify = async () => {
    if (enteredPin.length < 4 || lockoutSeconds > 0 || isVerifying) return

    setIsVerifying(true)
    setPinError(null)

    try {
      const res = await window.electronAPI?.auth.verifyPin(enteredPin)
      if (res?.success) {
        setIsAuthenticated(true)
        setEnteredPin('')
        setPinError(null)
      } else {
        setEnteredPin('')
        if (res?.lockedSeconds && res.lockedSeconds > 0) {
          setLockoutSeconds(res.lockedSeconds)
          setPinError(`Terminal locked due to 3 failed attempts. Please wait ${res.lockedSeconds}s.`)
        } else {
          setPinError(res?.error || 'Incorrect PIN')
        }
      }
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  // --- Handlers for Setup PIN (First Launch) ---
  const handleSetupDigit = (d: string) => {
    setSetupError(null)
    if (setupStep === 'enter') {
      if (initialPin.length < 6) setInitialPin((prev) => prev + d)
    } else {
      if (confirmPin.length < 6) setConfirmPin((prev) => prev + d)
    }
  }

  const handleSetupBackspace = () => {
    setSetupError(null)
    if (setupStep === 'enter') setInitialPin((prev) => prev.slice(0, -1))
    else setConfirmPin((prev) => prev.slice(0, -1))
  }

  const handleSetupClear = () => {
    setSetupError(null)
    if (setupStep === 'enter') setInitialPin('')
    else setConfirmPin('')
  }

  const handleSetupNext = async () => {
    setSetupError(null)

    if (setupStep === 'enter') {
      if (initialPin.length < 4) {
        setSetupError('PIN must be 4 to 6 digits')
        return
      }
      setSetupStep('confirm')
    } else {
      if (confirmPin !== initialPin) {
        setSetupError('PIN confirmation does not match. Please re-enter.')
        setConfirmPin('')
        return
      }

      try {
        const res = await window.electronAPI?.auth.setupPin(initialPin)
        if (res?.success && res.recoveryCode) {
          setRecoveryModalCode(res.recoveryCode)
        } else {
          setSetupError(res?.error || 'Failed to configure PIN')
        }
      } catch (err: unknown) {
        setSetupError(err instanceof Error ? err.message : 'Setup error')
      }
    }
  }

  // --- Loading Spinner View ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[#0C0E12] text-[#F3F4F6] select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-xs text-[#9CA3AF] font-semibold tracking-wide uppercase">
            Loading Retailer POS...
          </p>
        </div>
      </div>
    )
  }

  const handleLockTerminal = async () => {
    if (window.electronAPI?.auth?.lockSession) {
      await window.electronAPI.auth.lockSession()
    }
    setIsAuthenticated(false)
  }

  // --- Authenticated Dashboard ---
  if (isAuthenticated) {
    return <Dashboard onLock={handleLockTerminal} />
  }

  // --- Forgot PIN Flow ---
  if (showForgotPin) {
    return (
      <>
        <ForgotPinView
          onBack={() => setShowForgotPin(false)}
          onSuccess={(newCode) => {
            setShowForgotPin(false)
            setRecoveryModalCode(newCode)
          }}
        />
        <RecoveryCodeModal
          isOpen={Boolean(recoveryModalCode)}
          recoveryCode={recoveryModalCode || ''}
          title="New Recovery Code Generated"
          subtitle="Your PIN has been reset. Save your new recovery code safely in case you forget it again."
          onConfirm={() => {
            setRecoveryModalCode(null)
            setIsAuthenticated(true)
          }}
        />
      </>
    )
  }

  // --- Common Header Bar for Pre-Auth Screens ---
  const PreAuthTopBar = () => (
    <div className="w-full h-16 px-6 lg:px-10 flex items-center justify-between z-10 border-b border-[#262B36] bg-[#15181E] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-black shadow-md shadow-amber-950/40">
          R
        </div>
        <div>
          <span className="text-sm font-bold text-[#F3F4F6] tracking-tight">Retailer POS</span>
          <span className="text-[10px] text-[#9CA3AF] block -mt-0.5">Counter Terminal #01</span>
        </div>
      </div>
    </div>
  )

  // --- First Time Launch: Setup PIN (Split Layout) ---
  if (!isPinConfigured) {
    const activeLength = setupStep === 'enter' ? initialPin.length : confirmPin.length
    const canProceed = activeLength >= 4

    return (
      <div className="min-h-screen w-full bg-[#0C0E12] text-[#F3F4F6] flex flex-col select-none relative overflow-x-hidden">
        <PreAuthTopBar />

        {/* Two-Side Split Screen Container */}
        <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center z-10">
          <div className="w-full bg-[#15181E] border border-[#262B36] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            {/* SIDE 1 (LEFT): PIN Display & Status Panel */}
            <div className="p-8 sm:p-10 flex flex-col justify-between bg-[#15181E] border-b lg:border-b-0 lg:border-r border-[#262B36] space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <span>●</span> First Launch Setup
                </div>
                <h1 className="text-3xl font-black text-[#F3F4F6] tracking-tight">
                  Set Up Security PIN
                </h1>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">
                  {setupStep === 'enter'
                    ? 'Enter a 4 to 6 digit security PIN on the keypad.'
                    : 'Re-enter your PIN on the keypad to confirm.'}
                </p>
              </div>

              {/* Large PIN Display Box (Shows digits entering live) */}
              <div className="bg-[#0C0E12] border border-[#262B36] rounded-3xl p-6 text-center space-y-4 shadow-inner">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                  {setupStep === 'enter' ? 'Step 1/2: Choose PIN' : 'Step 2/2: Confirm PIN'}
                </div>

                <PinDots length={activeLength} maxLength={6} hasError={Boolean(setupError)} />

                <div className="text-sm font-mono font-bold text-amber-500">
                  {activeLength > 0 ? `${activeLength} of 6 digits entered` : 'Waiting for keypad input...'}
                </div>

                {setupError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium rounded-xl">
                    {setupError}
                  </div>
                )}
              </div>

              <div className="text-xs text-[#64748B]">
                Tip: You can use the touch keypad on the right or type directly using your keyboard numpad.
              </div>
            </div>

            {/* SIDE 2 (RIGHT): Touch Keypad Input Panel */}
            <div className="p-8 sm:p-10 flex flex-col justify-center items-center bg-[#11141A]">
              <div className="w-full max-w-[340px] space-y-3">
                <div className="text-center lg:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                    Touch Keypad
                  </span>
                  <p className="text-sm font-semibold text-[#F3F4F6]">Enter digits below</p>
                </div>

                <PinPad
                  onDigit={handleSetupDigit}
                  onBackspace={handleSetupBackspace}
                  onClear={handleSetupClear}
                  onSubmit={handleSetupNext}
                  canSubmit={canProceed}
                  submitLabel={setupStep === 'enter' ? 'Next: Confirm PIN' : 'Save PIN & Continue'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* One-time recovery code modal upon completing setup */}
        <RecoveryCodeModal
          isOpen={Boolean(recoveryModalCode)}
          recoveryCode={recoveryModalCode || ''}
          onConfirm={() => {
            setRecoveryModalCode(null)
            setIsPinConfigured(true)
            setIsAuthenticated(true)
          }}
        />
      </div>
    )
  }

  // --- Subsequent Launches: Enter PIN (Two-Sided Split Layout) ---
  const isLocked = lockoutSeconds > 0

  return (
    <div className="min-h-screen w-full bg-[#0C0E12] text-[#F3F4F6] flex flex-col select-none relative overflow-x-hidden">
      <PreAuthTopBar />

      {/* Two-Sided Split Screen Layout: Left = PIN Display, Right = Touch Keypad */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center z-10">
        <div className="w-full bg-[#15181E] border border-[#262B36] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          {/* SIDE 1 (LEFT): PIN Display & Terminal Status Panel */}
          <div className="p-8 sm:p-10 flex flex-col justify-between bg-[#15181E] border-b lg:border-b-0 lg:border-r border-[#262B36] space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <span>🔒</span> Terminal Locked
              </div>
              <h1 className="text-3xl font-black text-[#F3F4F6] tracking-tight">
                Unlock POS Terminal
              </h1>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                Enter your 4 to 6 digit security PIN on the keypad to begin billing and operations.
              </p>
            </div>

            {/* Live PIN Display Box (Digits fill here as you press on the other side) */}
            <div className="bg-[#0C0E12] border border-[#262B36] rounded-3xl p-6 text-center space-y-4 shadow-inner">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                PIN Entry Status
              </div>

              {/* Masked PIN Dots */}
              <PinDots length={enteredPin.length} maxLength={6} hasError={Boolean(pinError) || isLocked} />

              {/* Status or Digit Count */}
              {isLocked ? (
                <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-3.5">
                  <p className="text-xs font-bold text-red-400">
                    Terminal locked due to 3 failed attempts
                  </p>
                  <p className="text-base font-mono font-black text-red-300 mt-1">
                    Wait: {lockoutSeconds}s
                  </p>
                </div>
              ) : pinError ? (
                <p className="text-xs text-red-400 font-bold animate-shake">{pinError}</p>
              ) : (
                <div className="text-sm font-mono font-bold text-amber-500">
                  {enteredPin.length > 0
                    ? `${enteredPin.length} of 6 digits entered`
                    : 'Tap digits on the right keypad'}
                </div>
              )}
            </div>

            {/* Forgot PIN Recovery Link */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#64748B]">Need help?</span>
              <button
                type="button"
                onClick={() => setShowForgotPin(true)}
                className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline transition-colors cursor-pointer"
              >
                Forgot PIN? Reset with Recovery Code →
              </button>
            </div>
          </div>

          {/* SIDE 2 (RIGHT): Touch Keypad (User inputs here) */}
          <div className="p-8 sm:p-10 flex flex-col justify-center items-center bg-[#11141A]">
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
                onSubmit={handleVerify}
                disabled={isLocked || isVerifying}
                canSubmit={enteredPin.length >= 4}
                submitLabel={isVerifying ? 'Verifying...' : 'Unlock Terminal'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
