import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { settingsRepository } from './index'

const PIN_HASH_KEY = 'auth_pin_hash'
const RECOVERY_HASH_KEY = 'auth_recovery_code_hash'

// In-memory rate limiting, lockout state, and session unlock state (persists across renderer reloads)
let failedAttempts = 0
let lockoutUntil = 0
let isSessionUnlocked = false

export function isPinConfigured(): boolean {
  const hash = settingsRepository.get(PIN_HASH_KEY)
  return Boolean(hash && hash.length > 0)
}

export function generateRecoveryCode(): string {
  // Generate random 8-character uppercase hex code formatted as RC-XXXX-XXXX
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `RC-${random.slice(0, 4)}-${random.slice(4)}`
}

function normalizeRecoveryCode(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

export interface SetupPinResult {
  success: boolean
  recoveryCode?: string
  error?: string
}

export interface VerifyPinResult {
  success: boolean
  error?: string
  remainingAttempts?: number
  lockedSeconds?: number
}

export interface ResetPinResult {
  success: boolean
  newRecoveryCode?: string
  error?: string
}

export const authService = {
  isConfigured(): boolean {
    return isPinConfigured()
  },

  isSessionUnlocked(): boolean {
    return isSessionUnlocked
  },

  setSessionUnlocked(unlocked: boolean): void {
    isSessionUnlocked = unlocked
  },

  lockSession(): void {
    isSessionUnlocked = false
  },

  getLockStatus(): { isLocked: boolean; remainingSeconds: number } {
    const now = Date.now()
    if (lockoutUntil > now) {
      return { isLocked: true, remainingSeconds: Math.ceil((lockoutUntil - now) / 1000) }
    }
    return { isLocked: false, remainingSeconds: 0 }
  },

  async setupPin(pin: string): Promise<SetupPinResult> {
    if (!/^\d{4,6}$/.test(pin)) {
      return { success: false, error: 'PIN must be between 4 and 6 digits' }
    }

    const pinHash = await bcrypt.hash(pin, 10)
    const recoveryCode = generateRecoveryCode()
    const recoveryHash = await bcrypt.hash(normalizeRecoveryCode(recoveryCode), 10)

    settingsRepository.set(PIN_HASH_KEY, pinHash)
    settingsRepository.set(RECOVERY_HASH_KEY, recoveryHash)

    // Reset lock counters and mark session unlocked
    failedAttempts = 0
    lockoutUntil = 0
    isSessionUnlocked = true

    return {
      success: true,
      recoveryCode,
    }
  },

  async verifyPin(pin: string): Promise<VerifyPinResult> {
    const now = Date.now()
    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000)
      return {
        success: false,
        error: `Too many wrong attempts. Locked for ${remainingSeconds}s`,
        lockedSeconds: remainingSeconds,
      }
    }

    const pinHash = settingsRepository.get(PIN_HASH_KEY)
    if (!pinHash) {
      return { success: false, error: 'No PIN has been configured yet' }
    }

    const isValid = await bcrypt.compare(pin, pinHash)

    if (isValid) {
      failedAttempts = 0
      lockoutUntil = 0
      isSessionUnlocked = true
      return { success: true }
    }

    failedAttempts += 1

    if (failedAttempts >= 3) {
      // 10-second lockout
      lockoutUntil = Date.now() + 10000
      failedAttempts = 0
      return {
        success: false,
        error: 'Too many incorrect attempts. Please wait 10 seconds before trying again.',
        lockedSeconds: 10,
      }
    }

    const remainingAttempts = 3 - failedAttempts
    return {
      success: false,
      error: `Incorrect PIN. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
      remainingAttempts,
    }
  },

  async resetWithRecovery(recoveryCode: string, newPin: string): Promise<ResetPinResult> {
    if (!/^\d{4,6}$/.test(newPin)) {
      return { success: false, error: 'New PIN must be between 4 and 6 digits' }
    }

    const recoveryHash = settingsRepository.get(RECOVERY_HASH_KEY)
    if (!recoveryHash) {
      return { success: false, error: 'No recovery code found in settings' }
    }

    const normalizedInput = normalizeRecoveryCode(recoveryCode)
    const isValid = await bcrypt.compare(normalizedInput, recoveryHash)

    if (!isValid) {
      return { success: false, error: 'Invalid recovery code. Please check and try again.' }
    }

    // Generate new recovery code
    const newRecoveryCode = generateRecoveryCode()
    const newPinHash = await bcrypt.hash(newPin, 10)
    const newRecoveryHash = await bcrypt.hash(normalizeRecoveryCode(newRecoveryCode), 10)

    settingsRepository.set(PIN_HASH_KEY, newPinHash)
    settingsRepository.set(RECOVERY_HASH_KEY, newRecoveryHash)

    failedAttempts = 0
    lockoutUntil = 0
    isSessionUnlocked = true

    return {
      success: true,
      newRecoveryCode,
    }
  },

  async changePin(oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    if (!/^\d{4,6}$/.test(newPin)) {
      return { success: false, error: 'New PIN must be between 4 and 6 digits' }
    }

    const pinHash = settingsRepository.get(PIN_HASH_KEY)
    if (!pinHash) {
      return { success: false, error: 'No PIN is currently set' }
    }

    const isOldValid = await bcrypt.compare(oldPin, pinHash)
    if (!isOldValid) {
      return { success: false, error: 'Current PIN is incorrect' }
    }

    const newPinHash = await bcrypt.hash(newPin, 10)
    settingsRepository.set(PIN_HASH_KEY, newPinHash)

    return { success: true }
  },
}
