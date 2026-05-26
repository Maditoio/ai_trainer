"use server";

import { desc, eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseOptionsFromFormData,
  resolveCorrectAnswer,
} from "@/lib/admin/question-form";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  depositRequests,
  questions,
  tasks,
  users,
  wallets,
} from "@/lib/db/schema";
import { parseAmount } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function upsertTask(
  formData: FormData,
  taskId?: string,
): Promise<void> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "") || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "multiple_choice") as
    | "image_label"
    | "multiple_choice";
  const status = String(formData.get("status") ?? "draft") as
    | "draft"
    | "active"
    | "archived";
  const minTierId = String(formData.get("minTierId") ?? "") || null;

  if (!title) throw new Error("Title required");

  const values = {
    title,
    description,
    category,
    type,
    status,
    minTierId: minTierId || null,
  };

  if (taskId) {
    await db.update(tasks).set(values).where(eq(tasks.id, taskId));
    revalidatePath("/admin/tasks");
    revalidatePath(`/admin/tasks/${taskId}`);
    return;
  }

  const [created] = await db.insert(tasks).values(values).returning();
  revalidatePath("/admin/tasks");
  redirect(`/admin/tasks/${created.id}?created=1`);
}

export async function createTask(formData: FormData): Promise<void> {
  await upsertTask(formData);
}

export async function deleteTask(taskId: string): Promise<void> {
  await requireAdmin();
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath("/admin/tasks");
  redirect("/admin/tasks");
}

export async function upsertQuestion(
  formData: FormData,
  questionId?: string,
): Promise<void> {
  await requireAdmin();

  const taskId = String(formData.get("taskId") ?? "") || null;
  const isFreeTraining = formData.get("isFreeTraining") === "on";
  const type = String(formData.get("type") ?? "multiple_choice") as
    | "image_label"
    | "multiple_choice";
  const prompt = String(formData.get("prompt") ?? "");
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const imageUrl = String(formData.get("imageUrl") ?? "") || null;
  const correctOptionId = String(formData.get("correctOption") ?? "");

  if (!prompt) throw new Error("Question text is required");

  const options = parseOptionsFromFormData(formData);
  if (options.length < 2) {
    throw new Error("Add at least 2 answer choices");
  }

  if (type === "image_label" && !imageUrl) {
    throw new Error("Upload an image for image labeling tasks");
  }

  const correctAnswer = resolveCorrectAnswer(type, options, correctOptionId);
  const optionsJson = options;

  const values = {
    taskId: isFreeTraining ? null : taskId,
    isFreeTraining,
    type,
    prompt,
    sortOrder,
    correctAnswer,
    optionsJson,
    imageUrl,
  };

  if (questionId) {
    await db.update(questions).set(values).where(eq(questions.id, questionId));
  } else {
    await db.insert(questions).values(values);
  }

  revalidatePath("/admin/tasks");
  if (taskId) revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath("/admin/free-training");
  revalidatePath("/free-training");
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await requireAdmin();
  await db.delete(questions).where(eq(questions.id, questionId));
  revalidatePath("/admin/tasks");
  if (questionId) {
    const q = await db.query.questions.findFirst({
      where: eq(questions.id, questionId),
    });
    if (q?.taskId) revalidatePath(`/admin/tasks/${q.taskId}`);
  }
}

export async function uploadTaskImage(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file" };

  const blob = await put(`tasks/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return { url: blob.url };
}

export async function getAdminUsers() {
  await requireAdmin();
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
  });
  const result = [];
  for (const u of allUsers) {
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, u.id),
    });
    result.push({ ...u, balance: wallet?.balanceUsdt ?? "0" });
  }
  return result;
}

export async function updateUserWithdrawalSettings(
  userId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const feePercent = Number(formData.get("withdrawalFeePercent") ?? 0);
  const minimumWithdrawalAmount = parseAmount(
    String(formData.get("minimumWithdrawalAmount") ?? "0"),
  );

  if (Number.isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
    throw new Error("Withdrawal fee must be between 0 and 100 percent");
  }

  if (parseFloat(minimumWithdrawalAmount) < 0) {
    throw new Error("Minimum withdrawal cannot be negative");
  }

  await db
    .update(users)
    .set({
      withdrawalFeePercent: feePercent.toFixed(4),
      minimumWithdrawalAmount,
    })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
}

export async function getPendingDeposits() {
  await requireAdmin();
  return db.query.depositRequests.findMany({
    where: eq(depositRequests.status, "pending"),
    orderBy: [desc(depositRequests.createdAt)],
  });
}
