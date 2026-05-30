import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, withdrawalRequests } from "@/lib/db/schema";
import { formatAppDateTime, formatUsdt } from "@/lib/utils";

function csvCell(value: string | number | Date | null | undefined) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await db.query.withdrawalRequests.findMany({
    where: eq(withdrawalRequests.status, "pending"),
    orderBy: [desc(withdrawalRequests.createdAt)],
  });

  const rows = await Promise.all(
    pending.map(async (request) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, request.userId),
      });

      return [
        user?.email ?? "",
        formatUsdt(request.netAmount),
        formatUsdt(request.amount),
        formatUsdt(request.feeAmount),
        request.polygonAddress,
        formatAppDateTime(request.createdAt),
      ];
    }),
  );

  const csv = [
    [
      "user_email",
      "amount_to_pay_after_fees_usdt",
      "requested_amount_usdt",
      "fee_usdt",
      "wallet_address",
      "request_date",
    ],
    ...rows,
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  if (pending.length > 0) {
    await Promise.all(
      pending.map((request) =>
        db
          .update(withdrawalRequests)
          .set({
            status: "processed",
            reviewedAt: new Date(),
            adminNote: "Exported to CSV for external payout processing",
          })
          .where(eq(withdrawalRequests.id, request.id)),
      ),
    );
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pending-withdrawals-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
