import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { db, issuesTable, assetsTable, usersTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  ListIssuesQueryParams,
  ListIssuesResponse,
  GetIssueParams,
  GetIssueResponse,
  AssignIssueParams,
  AssignIssueBody,
  AssignIssueResponse,
  UpdateIssueStatusParams,
  UpdateIssueStatusBody,
  UpdateIssueStatusResponse,
  GetIssueHistoryParams,
  GetIssueHistoryResponse,
} from "@workspace/api-zod";
import { authRequired, requireAdmin } from "../middlewares/auth";
import { recordHistory } from "../lib/history";

const router: IRouter = Router();

const VALID_TRANSITIONS: Record<string, string[]> = {
  reported: ["assigned"],
  assigned: ["inspection_started"],
  inspection_started: ["maintenance_in_progress", "waiting_for_parts"],
  maintenance_in_progress: ["waiting_for_parts", "resolved"],
  waiting_for_parts: ["maintenance_in_progress", "resolved"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["assigned"],
};

async function fetchIssueRow(id: number) {
  const [row] = await db
    .select({
      issue: issuesTable,
      assetName: assetsTable.name,
      assetCode: assetsTable.assetCode,
      technicianName: usersTable.name,
    })
    .from(issuesTable)
    .innerJoin(assetsTable, eq(issuesTable.assetId, assetsTable.id))
    .leftJoin(usersTable, eq(issuesTable.assignedTechnicianId, usersTable.id))
    .where(eq(issuesTable.id, id));

  if (!row) return null;

  return {
    ...row.issue,
    assetName: row.assetName,
    assetCode: row.assetCode,
    assignedTechnicianName: row.technicianName ?? null,
  };
}

router.get("/issues", authRequired, async (req: Request, res: Response) => {
  const query = ListIssuesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, status, priority, category, assetId, technicianId, page, pageSize } =
    query.data;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(issuesTable.title, `%${search}%`),
        ilike(issuesTable.issueNumber, `%${search}%`),
        ilike(issuesTable.reporterName, `%${search}%`),
      ),
    );
  }
  if (status) conditions.push(eq(issuesTable.status, status as typeof issuesTable.$inferSelect.status));
  if (priority) conditions.push(eq(issuesTable.priority, priority as typeof issuesTable.$inferSelect.priority));
  if (category) conditions.push(eq(issuesTable.category, category));
  if (assetId) conditions.push(eq(issuesTable.assetId, assetId));

  if (req.user!.role === "technician") {
    conditions.push(eq(issuesTable.assignedTechnicianId, req.user!.id));
  } else if (technicianId) {
    conditions.push(eq(issuesTable.assignedTechnicianId, technicianId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ value: total } = { value: 0 }] = await db
    .select({ value: count() })
    .from(issuesTable)
    .where(where);

  const rows = await db
    .select({
      issue: issuesTable,
      assetName: assetsTable.name,
      assetCode: assetsTable.assetCode,
      technicianName: usersTable.name,
    })
    .from(issuesTable)
    .innerJoin(assetsTable, eq(issuesTable.assetId, assetsTable.id))
    .leftJoin(usersTable, eq(issuesTable.assignedTechnicianId, usersTable.id))
    .where(where)
    .orderBy(sql`${issuesTable.createdAt} desc`)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const items = rows.map((row) => ({
    ...row.issue,
    assetName: row.assetName,
    assetCode: row.assetCode,
    assignedTechnicianName: row.technicianName ?? null,
  }));

  res.json(ListIssuesResponse.parse({ items, total, page, pageSize }));
});

router.get("/issues/:id", authRequired, async (req: Request, res: Response) => {
  const params = GetIssueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const issue = await fetchIssueRow(params.data.id);
  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  if (req.user!.role === "technician" && issue.assignedTechnicianId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(GetIssueResponse.parse(issue));
});

router.post(
  "/issues/:id/assign",
  authRequired,
  requireAdmin,
  async (req: Request, res: Response) => {
    const params = AssignIssueParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = AssignIssueBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const [technician] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, body.data.technicianId));

    if (!technician || technician.role !== "technician") {
      res.status(400).json({ error: "Invalid technician" });
      return;
    }

    const [current] = await db
      .select()
      .from(issuesTable)
      .where(eq(issuesTable.id, params.data.id));

    if (!current) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }

    const nextStatus = current.status === "reported" || current.status === "reopened"
      ? "assigned"
      : current.status;

    await db
      .update(issuesTable)
      .set({ assignedTechnicianId: technician.id, status: nextStatus })
      .where(eq(issuesTable.id, params.data.id));

    await recordHistory({
      assetId: current.assetId,
      issueId: current.id,
      userId: req.user!.id,
      userName: "Admin",
      action: "issue_assigned",
      status: nextStatus,
      notes: `Assigned to ${technician.name}`,
    });

    const issue = await fetchIssueRow(params.data.id);
    res.json(AssignIssueResponse.parse(issue));
  },
);

router.post(
  "/issues/:id/status",
  authRequired,
  async (req: Request, res: Response) => {
    const params = UpdateIssueStatusParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = UpdateIssueStatusBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const [current] = await db
      .select()
      .from(issuesTable)
      .where(eq(issuesTable.id, params.data.id));

    if (!current) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }

    if (req.user!.role === "technician" && current.assignedTechnicianId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const allowedNext = VALID_TRANSITIONS[current.status] ?? [];
    if (!allowedNext.includes(body.data.status)) {
      res.status(400).json({
        error: `Cannot transition issue from '${current.status}' to '${body.data.status}'`,
      });
      return;
    }

    await db
      .update(issuesTable)
      .set({ status: body.data.status })
      .where(eq(issuesTable.id, params.data.id));

    await recordHistory({
      assetId: current.assetId,
      issueId: current.id,
      userId: req.user!.id,
      userName: req.user!.role === "admin" ? "Admin" : "Technician",
      action: "status_changed",
      status: body.data.status,
      notes: body.data.notes ?? null,
    });

    const issue = await fetchIssueRow(params.data.id);
    res.json(UpdateIssueStatusResponse.parse(issue));
  },
);

router.get(
  "/issues/:id/history",
  authRequired,
  async (req: Request, res: Response) => {
    const params = GetIssueHistoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const { historyTable } = await import("@workspace/db");

    const [{ value: total } = { value: 0 }] = await db
      .select({ value: count() })
      .from(historyTable)
      .where(eq(historyTable.issueId, params.data.id));

    const rows = await db
      .select({
        entry: historyTable,
        assetName: assetsTable.name,
      })
      .from(historyTable)
      .innerJoin(assetsTable, eq(historyTable.assetId, assetsTable.id))
      .where(eq(historyTable.issueId, params.data.id))
      .orderBy(sql`${historyTable.createdAt} desc`);

    const items = rows.map(({ entry, assetName }) => ({
      ...entry,
      assetName,
      issueNumber: null,
    }));

    res.json(GetIssueHistoryResponse.parse({ items, total, page: 1, pageSize: items.length || 1 }));
  },
);

export default router;
