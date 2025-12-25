// import sqlite3 from "sqlite3";
// import fs from "fs";
import crypto from "crypto";

const KEY = crypto.createHash("sha256").update("mysecretkey").digest(); // STORE SAFELY

// -------------------------------
// 🔐 Encrypt + Decrypt DB Buffer
// -------------------------------
export function encrypt(buffer: Buffer) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
  return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
}

export function decrypt(buffer: Buffer) {
  const iv = buffer.slice(0, 16);
  const encrypted = buffer.slice(16);
  const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
