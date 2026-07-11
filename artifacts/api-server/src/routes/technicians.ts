import bcrypt from "bcryptjs";
import { eq, and, count } from "drizzle-orm";
import { db, usersTable, issuesTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  ListTechniciansResponse,
  CreateTechnicianBody,
  CreateTechnicianResponse,
  GetTechnicianParams,
  GetTechnicianResponse,
  UpdateTechnicianParams,
  UpdateTechnicianBody,
  UpdateTechnicianResponse,
} from "@workspace/api-zod";
import { authRequired, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

async function withCounts(techs: (typeof usersTable.$inferSelect)[]) {
  const results = [];
  for (const tech of techs) {
    const [assigned] = await db
      .select({ value: count() })
      .from(issuesTable)
      .where(eq(issuesTable.assignedTechnicianId, tech.id));
    const [resolved] = await db
      .select({ value: count() })
      .from(issuesTable)
      .where(
        and(
          eq(issuesTable.assignedTechnicianId, tech.id),
          eq(issuesTable.status, "resolved"),
        ),
      );
    results.push({
      ...tech,
      assignedIssuesCount: assigned?.value ?? 0,
      resolvedIssuesCount: resolved?.value ?? 0,
    });
  }
  return results;
}

router.get(
  "/technicians",
  authRequired,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const techs = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "technician"));

    const items = await withCounts(techs);

    res.json(ListTechniciansResponse.parse({ items }));
  },
);

router.post(
  "/technicians",
  authRequired,
  requireAdmin,
  async (req: Request, res: Response) => {
    const parsed = CreateTechnicianBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { name, email, password, phone } = parsed.data;

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [tech] = await db
      .insert(usersTable)
      .values({ name, email, passwordHash, role: "technician", phone: phone ?? null })
      .returning();

    if (!tech) {
      res.status(500).json({ error: "Failed to create technician" });
      return;
    }

    res.status(201).json(
      CreateTechnicianResponse.parse({
        ...tech,
        assignedIssuesCount: 0,
        resolvedIssuesCount: 0,
      }),
    );
  },
);

router.get(
  "/technicians/:id",
  authRequired,
  requireAdmin,
  async (req: Request, res: Response) => {
    const params = GetTechnicianParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [tech] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, params.data.id));

    if (!tech) {
      res.status(404).json({ error: "Technician not found" });
      return;
    }

    const [withCount] = await withCounts([tech]);

    res.json(GetTechnicianResponse.parse(withCount));
  },
);

router.patch(
  "/technicians/:id",
  authRequired,
  requireAdmin,
  async (req: Request, res: Response) => {
    const params = UpdateTechnicianParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateTechnicianBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [tech] = await db
      .update(usersTable)
      .set(parsed.data)
      .where(eq(usersTable.id, params.data.id))
      .returning();

    if (!tech) {
      res.status(404).json({ error: "Technician not found" });
      return;
    }

    const [withCount] = await withCounts([tech]);

    res.json(UpdateTechnicianResponse.parse(withCount));
  },
);

export default router;
