import { eq } from "drizzle-orm";
import { db, maintenanceTable, issuesTable, usersTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  ListMaintenanceQueryParams,
  ListMaintenanceResponse,
  CreateMaintenanceParams,
  CreateMaintenanceBody,
  CreateMaintenanceResponse,
} from "@workspace/api-zod";
import { authRequired } from "../middlewares/auth";
import { recordHistory } from "../lib/history";

const router: IRouter = Router();

router.get("/maintenance", authRequired, async (req: Request, res: Response) => {
  const query = ListMaintenanceQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db
    .select({ entry: maintenanceTable, technicianName: usersTable.name })
    .from(maintenanceTable)
    .innerJoin(usersTable, eq(maintenanceTable.technicianId, usersTable.id))
    .where(eq(maintenanceTable.issueId, query.data.issueId));

  const items = rows.map(({ entry, technicianName }) => ({ ...entry, technicianName }));

  res.json(ListMaintenanceResponse.parse({ items }));
});

router.post(
  "/issues/:id/maintenance",
  authRequired,
  async (req: Request, res: Response) => {
    const params = CreateMaintenanceParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = CreateMaintenanceBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const [issue] = await db
      .select()
      .from(issuesTable)
      .where(eq(issuesTable.id, params.data.id));

    if (!issue) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }

    if (req.user!.role === "technician" && issue.assignedTechnicianId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [entry] = await db
      .insert(maintenanceTable)
      .values({
        issueId: issue.id,
        technicianId: req.user!.id,
        notes: body.data.notes,
        cost: body.data.cost ?? null,
        replacementParts: body.data.replacementParts ?? [],
        timeSpentMinutes: body.data.timeSpentMinutes ?? null,
        images: body.data.images ?? [],
      })
      .returning();

    if (!entry) {
      res.status(500).json({ error: "Failed to log maintenance work" });
      return;
    }

    const [technician] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id));

    await recordHistory({
      assetId: issue.assetId,
      issueId: issue.id,
      userId: req.user!.id,
      userName: technician?.name ?? "Technician",
      action: "maintenance_logged",
      status: issue.status,
      notes: body.data.notes,
    });

    res.status(201).json(
      CreateMaintenanceResponse.parse({ ...entry, technicianName: technician?.name ?? "Technician" }),
    );
  },
);

export default router;
