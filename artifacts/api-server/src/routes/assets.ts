import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { db, assetsTable, usersTable, historyTable, issuesTable } from "@workspace/db";

async function getUserName(userId: number): Promise<string> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user?.name ?? "Unknown";
}

function toDateString(value: Date | string | undefined | null): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function normalizeDates<
  T extends {
    purchaseDate?: Date | string | null;
    warrantyExpiry?: Date | string | null;
    lastServiceDate?: Date | string | null;
    nextServiceDate?: Date | string | null;
  },
>(data: T) {
  return {
    ...data,
    purchaseDate: toDateString(data.purchaseDate),
    warrantyExpiry: toDateString(data.warrantyExpiry),
    lastServiceDate: toDateString(data.lastServiceDate),
    nextServiceDate: toDateString(data.nextServiceDate),
  };
}
import { Router, type IRouter, type Request, type Response } from "express";
import {
  ListAssetsQueryParams,
  ListAssetsResponse,
  CreateAssetBody,
  CreateAssetResponse,
  GetAssetParams,
  GetAssetResponse,
  UpdateAssetParams,
  UpdateAssetBody,
  UpdateAssetResponse,
  DeleteAssetParams,
  GetAssetHistoryParams,
  GetAssetHistoryResponse,
} from "@workspace/api-zod";
import { authRequired, requireAdmin } from "../middlewares/auth";
import { recordHistory } from "../lib/history";

const router: IRouter = Router();

function withPublicUrl(asset: typeof assetsTable.$inferSelect & { assignedTechnicianName?: string | null }) {
  return {
    ...asset,
    publicUrl: `/scan/${asset.assetCode}`,
  };
}

router.get("/assets", authRequired, async (req: Request, res: Response) => {
  const query = ListAssetsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, category, status, location, technicianId, page, pageSize } = query.data;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(assetsTable.name, `%${search}%`),
        ilike(assetsTable.assetCode, `%${search}%`),
      ),
    );
  }
  if (category) conditions.push(eq(assetsTable.category, category));
  if (status) conditions.push(eq(assetsTable.status, status as typeof assetsTable.$inferSelect.status));
  if (location) conditions.push(ilike(assetsTable.location, `%${location}%`));
  if (technicianId) conditions.push(eq(assetsTable.assignedTechnicianId, technicianId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ value: total } = { value: 0 }] = await db
    .select({ value: count() })
    .from(assetsTable)
    .where(where);

  const rows = await db
    .select({
      asset: assetsTable,
      technicianName: usersTable.name,
    })
    .from(assetsTable)
    .leftJoin(usersTable, eq(assetsTable.assignedTechnicianId, usersTable.id))
    .where(where)
    .orderBy(assetsTable.createdAt)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const items = rows.map(({ asset, technicianName }) =>
    withPublicUrl({ ...asset, assignedTechnicianName: technicianName ?? null }),
  );

  res.json(ListAssetsResponse.parse({ items, total, page, pageSize }));
});

router.post(
  "/assets",
  authRequired,
  requireAdmin,
  async (req: Request, res: Response) => {
    const parsed = CreateAssetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(assetsTable)
      .where(eq(assetsTable.assetCode, parsed.data.assetCode));
    if (existing) {
      res.status(409).json({ error: "An asset with this code already exists" });
      return;
    }

    const [asset] = await db
      .insert(assetsTable)
      .values(normalizeDates(parsed.data))
      .returning();
    if (!asset) {
      res.status(500).json({ error: "Failed to create asset" });
      return;
    }

    await recordHistory({
      assetId: asset.id,
      userId: req.user!.id,
      userName: await getUserName(req.user!.id),
      action: "asset_created",
      notes: `Asset ${asset.name} (${asset.assetCode}) was created`,
    });

    res.status(201).json(CreateAssetResponse.parse(withPublicUrl(asset)));
  },
);

router.get("/assets/:id", authRequired, async (req: Request, res: Response) => {
  const params = GetAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ asset: assetsTable, technicianName: usersTable.name })
    .from(assetsTable)
    .leftJoin(usersTable, eq(assetsTable.assignedTechnicianId, usersTable.id))
    .where(eq(assetsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.json(
    GetAssetResponse.parse(
      withPublicUrl({ ...row.asset, assignedTechnicianName: row.technicianName ?? null }),
    ),
  );
});

router.patch(
  "/assets/:id",
  authRequired,
  requireAdmin,
  async (req: Request, res: Response) => {
    const params = UpdateAssetParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateAssetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [asset] = await db
      .update(assetsTable)
      .set(normalizeDates(parsed.data))
      .where(eq(assetsTable.id, params.data.id))
      .returning();

    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    let technicianName: string | null = null;
    if (asset.assignedTechnicianId) {
      const [tech] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, asset.assignedTechnicianId));
      technicianName = tech?.name ?? null;
    }

    await recordHistory({
      assetId: asset.id,
      userId: req.user!.id,
      userName: await getUserName(req.user!.id),
      action: "asset_updated",
      status: asset.status,
    });

    res.json(UpdateAssetResponse.parse(withPublicUrl({ ...asset, assignedTechnicianName: technicianName })));
  },
);

router.delete(
  "/assets/:id",
  authRequired,
  requireAdmin,
  async (req: Request, res: Response) => {
    const params = DeleteAssetParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [asset] = await db
      .delete(assetsTable)
      .where(eq(assetsTable.id, params.data.id))
      .returning();

    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    res.status(204).send();
  },
);

router.get(
  "/assets/:id/history",
  authRequired,
  async (req: Request, res: Response) => {
    const params = GetAssetHistoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [{ value: total } = { value: 0 }] = await db
      .select({ value: count() })
      .from(historyTable)
      .where(eq(historyTable.assetId, params.data.id));

    const rows = await db
      .select({
        entry: historyTable,
        assetName: assetsTable.name,
        issueNumber: issuesTable.issueNumber,
      })
      .from(historyTable)
      .innerJoin(assetsTable, eq(historyTable.assetId, assetsTable.id))
      .leftJoin(issuesTable, eq(historyTable.issueId, issuesTable.id))
      .where(eq(historyTable.assetId, params.data.id))
      .orderBy(sql`${historyTable.createdAt} desc`);

    const items = rows.map(({ entry, assetName, issueNumber }) => ({
      ...entry,
      assetName,
      issueNumber: issueNumber ?? null,
    }));

    res.json(
      GetAssetHistoryResponse.parse({
        items,
        total,
        page: 1,
        pageSize: items.length || 1,
      }),
    );
  },
);

export default router;
