export interface UserProfile {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  businessCategory: string;

  role: "owner" | "admin" | "cashier" | "viewer";
  isActive: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
  isEmailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  isFirstLogin: boolean;
  plan: string;
  licenseKey: string | null;
  createdAt: string;
}