import { config } from "dotenv";

config({ path: ".env.local" });
config();
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  freeTrainingProgress,
  questions,
  tiers,
  users,
  wallets,
} from "../lib/db/schema";

async function seed() {
  const { getDatabaseUrl } = await import("../lib/db/url");
  getDatabaseUrl();

  const { ensureSchema } = await import("../lib/db/ensure-schema");
  await ensureSchema();

  const existingTiers = await db.query.tiers.findMany();
  let starterTierId = existingTiers.find((t) => t.isDefault)?.id;

  if (existingTiers.length === 0) {
    const [starter] = await db
      .insert(tiers)
      .values({
        name: "Starter",
        dailyQuestionLimit: 1,
        usdtPerQuestion: "1.00000000",
        upgradePriceUsdt: "0",
        sortOrder: 0,
        isDefault: true,
      })
      .returning();
    starterTierId = starter.id;

    await db.insert(tiers).values([
      {
        name: "Bronze",
        dailyQuestionLimit: 10,
        usdtPerQuestion: "0.05000000",
        upgradePriceUsdt: "5.00000000",
        sortOrder: 1,
        isDefault: false,
      },
      {
        name: "Silver",
        dailyQuestionLimit: 25,
        usdtPerQuestion: "0.10000000",
        upgradePriceUsdt: "15.00000000",
        sortOrder: 2,
        isDefault: false,
      },
    ]);
    console.log("Created tiers");
  }

  const adminEmail = (
    process.env.ADMIN_EMAIL ?? "admin@modelmind.local"
  ).toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123456";

  let admin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    [admin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        name: "Admin",
        role: "admin",
        currentTierId: starterTierId,
      })
      .returning();
    await db.insert(wallets).values({ userId: admin.id, balanceUsdt: "0" });
    await db
      .insert(freeTrainingProgress)
      .values({ userId: admin.id, questionsAnswered: 0 });
    console.log(`Admin user: ${adminEmail} / ${adminPassword}`);
  }

  const freeCount = await db.query.questions.findMany({
    where: eq(questions.isFreeTraining, true),
  });

  if (freeCount.length === 0) {
    await db.insert(questions).values([
      {
        isFreeTraining: true,
        type: "multiple_choice",
        prompt: "Which animal is known for building dams?",
        sortOrder: 0,
        optionsJson: [
          { id: "a", label: "Beaver" },
          { id: "b", label: "Eagle" },
          { id: "c", label: "Wolf" },
        ],
        correctAnswer: "a",
      },
      {
        isFreeTraining: true,
        type: "multiple_choice",
        prompt: "What color is the sky on a clear day?",
        sortOrder: 1,
        optionsJson: [
          { id: "a", label: "Blue" },
          { id: "b", label: "Green" },
          { id: "c", label: "Red" },
        ],
        correctAnswer: "a",
      },
      {
        isFreeTraining: true,
        type: "multiple_choice",
        prompt: "How many continents are there on Earth?",
        sortOrder: 2,
        optionsJson: [
          { id: "a", label: "7" },
          { id: "b", label: "5" },
          { id: "c", label: "12" },
        ],
        correctAnswer: "a",
      },
    ]);
    console.log("Created 3 free training questions");
  }

  console.log("Seed complete");
  process.exit(0);
}

seed().catch((err) => {
  const cause = err instanceof Error && "cause" in err ? err.cause : err;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String(cause.code)
      : "";

  if (code === "42P01") {
    console.error(
      "\nDatabase tables are missing. Run:\n  npm run db:migrate\n  npm run db:seed\n\nOr reset everything:\n  npm run db:fresh\n",
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
