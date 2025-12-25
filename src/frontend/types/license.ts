export type Plan = "trial" | "starter" | "standard" | "pro" | "expired";

export interface Entitlements {
  plan: Plan;
  features: string[];
  isTrial: boolean;
  trialEndsAt: string | null;
  licenseKey: string | null;
}