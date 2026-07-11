import { db, historyTable } from "@workspace/db";

export async function recordHistory(entry: {
  assetId: number;
  issueId?: number | null;
  userId?: number | null;
  userName: string;
  action: string;
  status?: string | null;
  notes?: string | null;
}): Promise<void> {
  await db.insert(historyTable).values({
    assetId: entry.assetId,
    issueId: entry.issueId ?? null,
    userId: entry.userId ?? null,
    userName: entry.userName,
    action: entry.action,
    status: entry.status ?? null,
    notes: entry.notes ?? null,
  });
}
