import { relations } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const taskTypeEnum = pgEnum("task_type", [
  "image_label",
  "multiple_choice",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "draft",
  "active",
  "archived",
]);
export const depositStatusEnum = pgEnum("deposit_status", [
  "pending",
  "approved",
  "rejected",
]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "correct",
  "incorrect",
  "pending_review",
]);
export const ledgerTypeEnum = pgEnum("ledger_type", [
  "deposit",
  "tier_upgrade",
  "task_reward",
  "free_training_bonus",
  "adjustment",
  "withdrawal",
  "crypto_deposit",
  "referral_commission",
]);

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "approved",
  "rejected",
  "completed",
]);

export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey(),
  withdrawalFeePercent: numeric("withdrawal_fee_percent", {
    precision: 8,
    scale: 4,
  })
    .notNull()
    .default("0"),
  minimumWithdrawalAmount: numeric("minimum_withdrawal_amount", {
    precision: 18,
    scale: 8,
  })
    .notNull()
    .default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tiers = pgTable("tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  dailyQuestionLimit: integer("daily_question_limit").notNull(),
  usdtPerQuestion: numeric("usdt_per_question", {
    precision: 18,
    scale: 8,
  }).notNull(),
  upgradePriceUsdt: numeric("upgrade_price_usdt", {
    precision: 18,
    scale: 8,
  })
    .notNull()
    .default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
  requiredReferralCount: integer("required_referral_count").notNull().default(0),
  requiredReferralTierId: uuid("required_referral_tier_id").references(
    (): AnyPgColumn => tiers.id,
  ),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: userRoleEnum("role").notNull().default("user"),
  currentTierId: uuid("current_tier_id").references(() => tiers.id),
  referralCode: text("referral_code").unique(),
  referredByUserId: uuid("referred_by_user_id").references(
    (): AnyPgColumn => users.id,
  ),
  phoneCountryCode: text("phone_country_code"),
  phoneCountryName: text("phone_country_name"),
  phoneNumber: text("phone_number"),
  freeTrainingCompletedAt: timestamp("free_training_completed_at", {
    withTimezone: true,
  }),
  referralCommissionPaidAt: timestamp("referral_commission_paid_at", {
    withTimezone: true,
  }),
  withdrawalFeePercent: numeric("withdrawal_fee_percent", {
    precision: 8,
    scale: 4,
  })
    .notNull()
    .default("0"),
  minimumWithdrawalAmount: numeric("minimum_withdrawal_amount", {
    precision: 18,
    scale: 8,
  })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  balanceUsdt: numeric("balance_usdt", { precision: 18, scale: 8 })
    .notNull()
    .default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: ledgerTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 8 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const depositRequests = pgTable("deposit_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 18, scale: 8 }).notNull(),
  referenceNote: text("reference_note"),
  status: depositStatusEnum("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  type: taskTypeEnum("type").notNull(),
  status: taskStatusEnum("status").notNull().default("draft"),
  minTierId: uuid("min_tier_id").references(() => tiers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  type: taskTypeEnum("type").notNull(),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url"),
  optionsJson: jsonb("options_json"),
  correctAnswer: text("correct_answer"),
  isFreeTraining: boolean("is_free_training").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  answerJson: jsonb("answer_json").notNull(),
  status: submissionStatusEnum("status").notNull(),
  rewardUsdt: numeric("reward_usdt", { precision: 18, scale: 8 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dailyUsage = pgTable(
  "daily_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    usageDate: date("usage_date").notNull(),
    questionCount: integer("question_count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("daily_usage_user_date_idx").on(table.userId, table.usageDate),
  ],
);

export const cryptoDeposits = pgTable(
  "crypto_deposits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nowpaymentsPaymentId: text("nowpayments_payment_id").notNull().unique(),
    payAddress: text("pay_address").notNull(),
    payCurrency: text("pay_currency").notNull(),
    priceAmount: numeric("price_amount", { precision: 18, scale: 8 }).notNull(),
    actuallyPaid: numeric("actually_paid", { precision: 18, scale: 8 }),
    paymentStatus: text("payment_status").notNull().default("waiting"),
    creditedAt: timestamp("credited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 18, scale: 8 }).notNull(),
  feePercent: numeric("fee_percent", { precision: 8, scale: 4 })
    .notNull()
    .default("0"),
  feeAmount: numeric("fee_amount", { precision: 18, scale: 8 })
    .notNull()
    .default("0"),
  netAmount: numeric("net_amount", { precision: 18, scale: 8 })
    .notNull()
    .default("0"),
  polygonAddress: text("polygon_address").notNull(),
  status: withdrawalStatusEnum("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const freeTrainingProgress = pgTable("free_training_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  lastAnsweredDate: date("last_answered_date"),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  currentTier: one(tiers, {
    fields: [users.currentTierId],
    references: [tiers.id],
  }),
  referrer: one(users, {
    fields: [users.referredByUserId],
    references: [users.id],
    relationName: "referrals",
  }),
  referrals: many(users, { relationName: "referrals" }),
}));

export const tiersRelations = relations(tiers, ({ many }) => ({
  users: many(users),
}));

export const tasksRelations = relations(tasks, ({ many, one }) => ({
  questions: many(questions),
  minTier: one(tiers, {
    fields: [tasks.minTierId],
    references: [tiers.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  task: one(tasks, {
    fields: [questions.taskId],
    references: [tasks.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Tier = typeof tiers.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Question = typeof questions.$inferSelect;
