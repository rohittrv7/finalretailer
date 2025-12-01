import bcrypt from "bcryptjs";
import keytar from "keytar";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "../database/db";

// SERVICE NAMES
const SERVICE = "MyPOSApp";
const TOKEN_KEY = "auth-token";
const USER_KEY = "current-user";

export interface UserProfile {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  businessCategory: string;
  role: "owner";
  isActive: boolean;
  isTrial: boolean;
  trialEndsAt: string;
  isEmailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  isFirstLogin: boolean;
  plan: string;
  createdAt: string;
}

// Sabse pehla check → keytar mein user hai?
export const isSetupComplete = async (): Promise<boolean> => {
  const userData = await keytar.getPassword(SERVICE, USER_KEY);
  return userData !== null;
};

// 1. Check if first time
export const isFirstTimeSetup = async (): Promise<boolean> => {
  const db = await getDB();
  const row = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  return row.count === 0;
};

// 2. Setup business (only once)
export const setupBusiness = async (data: {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  password: string;
  businessCategory: string;
}) => {
  if (!data.businessName || !data.ownerName || !data.email || !data.password) {
    return { success: false, error: "All fields required" };
  }
  const db = await getDB();

  const hashed = bcrypt.hashSync(data.password, 12);
  const userId = uuidv4();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  try {
    db.prepare(
      `
      INSERT INTO users (
        id, businessName, ownerName, phone, email, password, businessCategory,
        role, isActive, isTrial, trialEndsAt, isFirstLogin, plan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'owner', 1, 1, ?, 1, 'trial')
    `
    ).run(
      userId,
      data.businessName.trim(),
      data.ownerName.trim(),
      data.phone.trim(),
      data.email.toLowerCase().trim(),
      hashed,
      data.businessCategory,
      trialEnd.toISOString()
    );

    const profile: UserProfile = {
      id: userId,
      businessName: data.businessName,
      ownerName: data.ownerName,
      phone: data.phone,
      email: data.email.toLowerCase(),
      businessCategory: data.businessCategory,
      role: "owner",
      isActive: true,
      isTrial: true,
      trialEndsAt: trialEnd.toISOString(),
      isEmailVerified: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      isFirstLogin: true,
      plan: "trial",
      createdAt: new Date().toISOString(),
    };

    const token = uuidv4();
    keytar.setPassword(SERVICE, TOKEN_KEY, token);
    keytar.setPassword(SERVICE, USER_KEY, JSON.stringify(profile));

    return { success: true, user: profile };
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      return { success: false, error: "Email already registered" };
    }
    return { success: false, error: "Setup failed. Try again." };
  }
};

// 3. Get current user (super fast)
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const json = await keytar.getPassword(SERVICE, USER_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// 4. Optional: Force logout (very rare)
export const forceLogout = async () => {
  await keytar.deletePassword(SERVICE, TOKEN_KEY);
  await keytar.deletePassword(SERVICE, USER_KEY);
};
