import jwt from "jsonwebtoken";
import { UserProfile } from "../types/user";
import { Entitlements, Plan } from "./license";

const JWT_SECRET = "your-super-secret-for-license-keys-that-is-very-long";

const planFeatures: Record<Exclude<Plan, "expired" | "trial">, string[]> = {
  starter: [
    "DASHBOARD_SERVICES",
    "QUICK_BILLING",
    "INVENTORY_MANAGEMENT",
    "DAILY_SALES_SUMMARY",
    "MANUAL_BACKUP",
    "INVOICE_LISTING",
    "OFFLINE_DATA",
    "BASIC_PRINTER_SUPPORT",
  ],
  standard: [
    "SETTING_CHANGES",
    "CLOUD_SYNC",
    "GST_INVOICING",
    "BARCODE_SUPPORT",
    "LOW_STOCK_ALERTS",
    "MULTI_DEVICE",
    "INVOICE_CUSTOMIZATION",
    "AUTO_BACKUP",
  ],
  pro: [
    "MULTI_BRANCH",
    "STAFF_ROLES",
    "ANALYTICS",
    "CUSTOMER_SUPPLIER_MODULES",
    "WHATSAPP_SHARE",
    "ACTIVITY_LOGS",
  ],
};

// Function to get all features for a given plan (including lower tiers)
function getFeaturesForPlan(plan: Plan): string[] {
  if (plan === "starter") {
    return planFeatures.starter;
  }
  if (plan === "standard") {
    return [...planFeatures.starter, ...planFeatures.standard];
  }
  if (plan === "pro") {
    return [
      ...planFeatures.starter,
      ...planFeatures.standard,
      ...planFeatures.pro,
    ];
  }
  return [];
}

/**
 * Checks the user's current status and returns their entitlements.
 */
export function checkUserEntitlements(user: UserProfile): Entitlements {
  if (user.isTrial) {
    const trialEndDate = new Date(user.trialEndsAt);
    if (trialEndDate > new Date()) {
      // Active trial gives only the Starter plan features
      return {
        plan: "trial",
        features: [...planFeatures.starter],
        isTrial: true,
        trialEndsAt: user.trialEndsAt,
        licenseKey: null,
      };
    }
  }

  if (user.licenseKey) {
    const license = validateLicense(user.licenseKey);
    if (license.valid) {
      const plan = license.plan as Plan;
      // For subscription plans, check expiry
      if (plan === "standard" || plan === "pro") {
        if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
          return {
            plan: "expired",
            features: [],
            isTrial: false,
            trialEndsAt: null,
            licenseKey: user.licenseKey,
          };
        }
      }
      return {
        plan,
        features: getFeaturesForPlan(plan),
        isTrial: false,
        trialEndsAt: null,
        licenseKey: user.licenseKey,
      };
    }
  }

  // No trial, no license, or invalid license
  return {
    plan: "expired",
    features: [],
    isTrial: false,
    trialEndsAt: user.trialEndsAt, // Keep trial end date to show "Trial Expired"
    licenseKey: user.licenseKey,
  };
}

/**
 * Validates a license key.
 */
export function validateLicense(licenseKey: string): {
  valid: boolean;
  plan?: string;
  expiresAt?: string;
} {
  try {
    const decoded = jwt.verify(licenseKey, JWT_SECRET) as {
      plan: string;
      expiresAt?: string;
    };
    return { valid: true, ...decoded };
  } catch (error) {
    console.error("License validation failed:", error.message);
    return { valid: false };
  }
}
