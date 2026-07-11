import { eq, sql } from "drizzle-orm";
import { db, assetsTable, issuesTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetPublicAssetParams,
  GetPublicAssetResponse,
  CreatePublicIssueBody,
  CreatePublicIssueResponse,
} from "@workspace/api-zod";
import { recordHistory } from "../lib/history";

const router: IRouter = Router();

function generateIssueNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ISS-${stamp}-${rand}`;
}

router.get(
  "/public/assets/:assetCode",
  async (req: Request, res: Response) => {
    const params = GetPublicAssetParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [asset] = await db
      .select()
      .from(assetsTable)
      .where(eq(assetsTable.assetCode, params.data.assetCode));

    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    const historyRows = await db.execute(sql`
      select action, status, created_at as "createdAt"
      from history
      where asset_id = ${asset.id}
      order by created_at desc
      limit 10
    `);

    const recentActivity = (historyRows.rows as { action: string; status: string | null; createdAt: string }[]).map(
      (row) => ({
        date: row.createdAt,
        action: row.action,
        status: row.status,
      }),
    );

    res.json(
      GetPublicAssetResponse.parse({
        id: asset.id,
        name: asset.name,
        assetCode: asset.assetCode,
        category: asset.category,
        location: asset.location,
        status: asset.status,
        lastServiceDate: asset.lastServiceDate,
        nextServiceDate: asset.nextServiceDate,
        recentActivity,
      }),
    );
  },
);

router.post("/public/issues", async (req: Request, res: Response) => {
  const parsed = CreatePublicIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { assetCode, ...rest } = parsed.data;

  const [asset] = await db
    .select()
    .from(assetsTable)
    .where(eq(assetsTable.assetCode, assetCode));

  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  const issueNumber = generateIssueNumber();

  const [issue] = await db
    .insert(issuesTable)
    .values({
      issueNumber,
      assetId: asset.id,
      reporterName: rest.reporterName,
      reporterEmail: rest.reporterEmail,
      reporterPhone: rest.reporterPhone ?? null,
      title: rest.title,
      description: rest.description,
      priority: rest.priority,
      category: rest.category,
      imageUrls: rest.imageUrls ?? [],
      aiTitle: rest.aiTitle ?? null,
      aiCategory: rest.aiCategory ?? null,
      aiPriority: rest.aiPriority ?? null,
      aiPossibleCauses: rest.aiPossibleCauses ?? [],
      aiDiagnosticChecks: rest.aiDiagnosticChecks ?? [],
      aiSafetyNotes: rest.aiSafetyNotes ?? null,
      aiRecurringWarning: rest.aiRecurringWarning ?? null,
    })
    .returning();

  if (!issue) {
    res.status(500).json({ error: "Failed to submit report" });
    return;
  }

  await recordHistory({
    assetId: asset.id,
    issueId: issue.id,
    userName: rest.reporterName,
    action: "issue_reported",
    status: issue.status,
    notes: issue.title,
  });

  res.status(201).json(
    CreatePublicIssueResponse.parse({
      issueNumber: issue.issueNumber,
      status: issue.status,
    }),
  );
});

export default router;
