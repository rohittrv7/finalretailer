import bcrypt from "bcryptjs";
import keytar from "keytar";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "../database/db";
import { UserProfile } from "../types/user";

// SERVICE NAMES
const SERVICE = "MyPOSApp";
const TOKEN_KEY = "auth-token";
const USER_KEY = "current-user";

// Sabse pehla check → keytar mein user hai?
export const checkSetupComplete = async (): Promise<boolean> => {
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
  if (
    !data.businessName ||
    !data.ownerName ||
    !data.phone ||
    !data.email ||
    !data.password ||
    !data.businessCategory
  ) {
    return { success: false, error: "All required fields are mandatory" };
  }

  const db = await getDB();
  const hashedPassword = bcrypt.hashSync(data.password, 12);
  const userId = uuidv4();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 1); // 7-day trial

  try {
    db.exec("BEGIN TRANSACTION");

    // 1. Insert into users table (same as before)
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
      hashedPassword,
      data.businessCategory,
      trialEnd.toISOString()
    );

    // 2. Insert into store_settings — sirf basic info, baaki sab NULL
    // id,
    db.prepare(
      `
      INSERT INTO storeSettings (userId, storeName, ownerName, phone, email)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      userId, // IMPORTANT: use userId as store id
      data.businessName.trim(),
      data.ownerName.trim(),
      data.phone.trim(),
      data.email.toLowerCase().trim()
    );

    db.exec("COMMIT");

    // Profile for local storage
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
      licenseKey: null,
      createdAt: new Date().toISOString(),
    };

    const token = uuidv4();
    await keytar.setPassword(SERVICE, TOKEN_KEY, token);
    await keytar.setPassword(SERVICE, USER_KEY, JSON.stringify(profile));

    return { success: true, user: profile };
  } catch (err: any) {
    try {
      db.exec("ROLLBACK");
    } catch (_) {
      // ignore
    }

    if (err.message?.includes("UNIQUE")) {
      const field = err.message.includes("email")
        ? "Email"
        : err.message.includes("phone")
        ? "Phone"
        : "This";
      return { success: false, error: `${field} already registered` };
    }
    return { success: false, error: "Setup failed. Please try again." };
  }
};

// 3. Get current user (super fast)
export const getUser = async (): Promise<UserProfile | null> => {
  const json = await keytar.getPassword(SERVICE, USER_KEY);
  // await keytar.deletePassword(SERVICE, TOKEN_KEY);
  // await keytar.deletePassword(SERVICE, USER_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const updateUser = async (
  updatedProfile: Partial<UserProfile>
): Promise<void> => {
  const currentUser = await getUser();
  if (!currentUser) {
    throw new Error("Cannot update non-existent user.");
  }

  const newProfile = { ...currentUser, ...updatedProfile };

  const db = getDB();

  // Update the database
  await new Promise<void>((resolve, reject) => {
    db.run(
      `UPDATE users SET 
        licenseKey = ?, 
        isTrial = ? 
       WHERE id = ?`,
      [newProfile.licenseKey, newProfile.isTrial ? 1 : 0, newProfile.id],
      (err) => {
        if (err) return reject(new Error("Failed to update user in database."));
        resolve();
      }
    );
  });

  // Update the secure store
  await keytar.setPassword(SERVICE, USER_KEY, JSON.stringify(newProfile));
};

// 4. Optional: Force logout (very rare)
export const forceLogout = async () => {
  await keytar.deletePassword(SERVICE, TOKEN_KEY);
  await keytar.deletePassword(SERVICE, USER_KEY);
};
