import { eq } from "drizzle-orm";
import { db, assetsTable, issuesTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import { TriageIssueBody, TriageIssueResponse } from "@workspace/api-zod";
import { triageIssueWithAi } from "../lib/ai";

const router: IRouter = Router();

router.post("/ai/triage", async (req: Request, res: Response) => {
  const parsed = TriageIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { assetCode, title, description, category, priority } = parsed.data;

  const [asset] = await db
    .select()
    .from(assetsTable)
    .where(eq(assetsTable.assetCode, assetCode));

  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  const result = await triageIssueWithAi({
    assetName: asset.name,
    assetCategory: asset.category,
    title,
    description,
    category,
    priority,
  });

  const priorIssues = await db
    .select()
    .from(issuesTable)
    .where(eq(issuesTable.assetId, asset.id));

  const recurringWarning =
    priorIssues.filter(
      (i) => i.category.toLowerCase() === category.toLowerCase(),
    ).length >= 2
      ? `This asset has had ${priorIssues.length} prior reports, including similar ${category} issues. Consider a full inspection.`
      : null;

  res.json(
    TriageIssueResponse.parse({
      ...result,
      recurringWarning,
    }),
  );
});

export default router;
