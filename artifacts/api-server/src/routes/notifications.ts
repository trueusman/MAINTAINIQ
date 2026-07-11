import { count, eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  ListNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";
import { authRequired } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/notifications", authRequired, async (req: Request, res: Response) => {
  const items = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id));

  const [{ value: total } = { value: 0 }] = await db
    .select({ value: count() })
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id));

  res.json(ListNotificationsResponse.parse({ items, total }));
});

router.post(
  "/notifications/:id/read",
  authRequired,
  async (req: Request, res: Response) => {
    const params = MarkNotificationReadParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [notification] = await db
      .update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.id, params.data.id))
      .returning();

    if (!notification || notification.userId !== req.user!.id) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.json(MarkNotificationReadResponse.parse(notification));
  },
);

export default router;
