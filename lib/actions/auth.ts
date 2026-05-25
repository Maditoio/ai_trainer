"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { freeTrainingProgress, users } from "@/lib/db/schema";
import {
  getDefaultTierId,
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

  if (!email || password.length < 6) {
    throw new Error("Valid email and password (min 6 chars) required");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    throw new Error("Email already registered");
  }

  const defaultTierId = await getDefaultTierId();
  const passwordHash = await hashPassword(password);
  const referrer = referralCode
    ? await db.query.users.findFirst({
        where: eq(users.referralCode, referralCode),
      })
    : null;

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      currentTierId: defaultTierId,
      referredByUserId: referrer?.id ?? null,
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
    redirectTo: user.role === "admin" ? "/admin" : "/dashboard",
  });
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: user?.role === "admin" ? "/admin" : "/dashboard",
  });
}
