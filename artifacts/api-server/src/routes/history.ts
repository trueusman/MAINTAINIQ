import { and, count, eq, sql } from "drizzle-orm";
import { db, historyTable, assetsTable, issuesTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import { ListHistoryQueryParams, ListHistoryResponse } from "@workspace/api-zod";
import { authRequired, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get(
  "/history",
  authRequired,
  requireAdmin,
  async (req: Request, res: Response) => {
    const query = ListHistoryQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    const { assetId, issueId, page, pageSize } = query.data;

    const conditions = [];
    if (assetId) conditions.push(eq(historyTable.assetId, assetId));
    if (issueId) conditions.push(eq(historyTable.issueId, issueId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ value: total } = { value: 0 }] = await db
      .select({ value: count() })
      .from(historyTable)
      .where(where);

    const rows = await db
      .select({
        entry: historyTable,
        assetName: assetsTable.name,
        issueNumber: issuesTable.issueNumber,
      })
      .from(historyTable)
      .innerJoin(assetsTable, eq(historyTable.assetId, assetsTable.id))
      .leftJoin(issuesTable, eq(historyTable.issueId, issuesTable.id))
      .where(where)
      .orderBy(sql`${historyTable.createdAt} desc`)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items = rows.map(({ entry, assetName, issueNumber }) => ({
      ...entry,
      assetName,
      issueNumber: issueNumber ?? null,
    }));

    res.json(ListHistoryResponse.parse({ items, total, page, pageSize }));
  },
);

export default router;
