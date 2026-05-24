"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { freeTrainingProgress, users } from "@/lib/db/schema";
import {
  getDefaultTierId,
  hashPassword,
  signIn,
} from "@/lib/auth";
import { ensureWallet } from "@/lib/wallet/ledger";

export async function registerAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "") || null;

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

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      currentTierId: defaultTierId,
      role:
        process.env.ADMIN_EMAIL?.toLowerCase() === email ? "admin" : "user",
    })
    .returning();

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

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}
