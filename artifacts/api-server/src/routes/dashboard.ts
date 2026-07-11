import { and, count, eq, sql } from "drizzle-orm";
import { db, assetsTable, issuesTable, usersTable, historyTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetDashboardOverviewResponse,
  GetDashboardChartsResponse,
  GetRecentActivitiesQueryParams,
  GetRecentActivitiesResponse,
} from "@workspace/api-zod";
import { authRequired, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get(
  "/dashboard/overview",
  authRequired,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const assetCounts = await db.execute(sql`
      select status, count(*)::int as count from assets group by status
    `);
    const issueCounts = await db.execute(sql`
      select status, count(*)::int as count from issues group by status
    `);
    const [criticalRow] = (
      await db.execute(sql`
        select count(*)::int as count from issues
        where priority = 'critical' and status not in ('resolved', 'closed')
      `)
    ).rows as { count: number }[];

    const assetMap = Object.fromEntries(
      (assetCounts.rows as { status: string; count: number }[]).map((r) => [r.status, r.count]),
    );
    const issueMap = Object.fromEntries(
      (issueCounts.rows as { status: string; count: number }[]).map((r) => [r.status, r.count]),
    );

    const totalAssets = Object.values(assetMap).reduce((a, b) => a + b, 0);
    const totalIssues = Object.values(issueMap).reduce((a, b) => a + b, 0);
    const resolvedIssues = (issueMap["resolved"] ?? 0) + (issueMap["closed"] ?? 0);

    res.json(
      GetDashboardOverviewResponse.parse({
        totalAssets,
        operationalAssets: assetMap["operational"] ?? 0,
        underMaintenanceAssets: assetMap["under_maintenance"] ?? 0,
        outOfServiceAssets: assetMap["out_of_service"] ?? 0,
        retiredAssets: assetMap["retired"] ?? 0,
        totalIssues,
        resolvedIssues,
        pendingIssues: totalIssues - resolvedIssues,
        criticalIssues: criticalRow?.count ?? 0,
      }),
    );
  },
);

router.get(
  "/dashboard/charts",
  authRequired,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const issueCategories = (
      await db.execute(sql`
        select category, count(*)::int as count from issues group by category order by count desc
      `)
    ).rows as { category: string; count: number }[];

    const assetStatus = (
      await db.execute(sql`
        select status, count(*)::int as count from assets group by status
      `)
    ).rows as { status: string; count: number }[];

    const technicianPerformance = (
      await db.execute(sql`
        select u.id as "technicianId", u.name as "technicianName",
          count(i.id)::int as "resolvedCount",
          coalesce(avg(extract(epoch from (i.updated_at - i.created_at)) / 3600), 0)::float as "avgResolutionHours"
        from users u
        left join issues i on i.assigned_technician_id = u.id and i.status in ('resolved', 'closed')
        where u.role = 'technician'
        group by u.id, u.name
      `)
    ).rows as { technicianId: number; technicianName: string; resolvedCount: number; avgResolutionHours: number }[];

    const monthlyRepairs = (
      await db.execute(sql`
        select to_char(created_at, 'YYYY-MM') as month, count(*)::int as count
        from maintenance
        group by month
        order by month
      `)
    ).rows as { month: string; count: number }[];

    res.json(
      GetDashboardChartsResponse.parse({
        issueCategories,
        assetStatus,
        technicianPerformance,
        monthlyRepairs,
      }),
    );
  },
);

router.get(
  "/dashboard/recent-activities",
  authRequired,
  async (req: Request, res: Response) => {
    const query = GetRecentActivitiesQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    const conditions = [];
    if (req.user!.role === "technician") {
      conditions.push(eq(historyTable.userId, req.user!.id));
    }
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
      .limit(query.data.limit);

    const items = rows.map(({ entry, assetName, issueNumber }) => ({
      ...entry,
      assetName,
      issueNumber: issueNumber ?? null,
    }));

    res.json(
      GetRecentActivitiesResponse.parse({
        items,
        total,
        page: 1,
        pageSize: query.data.limit,
      }),
    );
  },
);

export default router;
