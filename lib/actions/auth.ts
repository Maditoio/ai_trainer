"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { freeTrainingProgress, users } from "@/lib/db/schema";
import {
  hashPassword,
  signIn,
} from "@/lib/auth";
import { ensureReferralCode } from "@/lib/referrals";
import { ensureWallet } from "@/lib/wallet/ledger";

export async function registerAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "") || null;
  const referralCode = String(formData.get("referralCode") ?? "").trim();
  const phoneCountry = String(formData.get("phoneCountry") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const [phoneCountryCode, phoneCountryName] = phoneCountry.split("|");

  if (!email || password.length < 6) {
    throw new Error("Valid email and password (min 6 chars) required");
  }
  if (!referralCode) {
    throw new Error("A referral ID is required to register");
  }
  if (!phoneCountryCode || !phoneCountryName || !phoneNumber) {
    throw new Error("Phone country and phone number are required");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(password);
  const referrer = await db.query.users.findFirst({
    where: eq(users.referralCode, referralCode),
  });
  if (!referrer) {
    throw new Error("Enter a valid referral ID");
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      referredByUserId: referrer.id,
      phoneCountryCode,
      phoneCountryName,
      phoneNumber,
      role:
        process.env.ADMIN_EMAIL?.toLowerCase() === email ? "admin" : "user",
    })
    .returning();

  await ensureReferralCode(user.id, user.email);
  await ensureWallet(user.id);
  await db.insert(freeTrainingProgress).values({ userId: user.id });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}
