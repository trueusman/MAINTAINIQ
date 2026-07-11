import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  RegisterBody,
  RegisterResponse,
  LoginBody,
  LoginResponse,
  GetCurrentUserResponse,
  UpdateCurrentUserBody,
  UpdateCurrentUserResponse,
  ChangePasswordBody,
} from "@workspace/api-zod";
import { signAuthToken } from "../lib/auth";
import { authRequired } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req: Request, res: Response) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, role, phone } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role, phone: phone ?? null })
    .returning();

  if (!user) {
    res.status(500).json({ error: "Failed to create account" });
    return;
  }

  const token = signAuthToken({ id: user.id, role: user.role as "admin" | "technician" });

  res.status(201).json(RegisterResponse.parse({ token, user }));
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user || !user.active) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signAuthToken({ id: user.id, role: user.role as "admin" | "technician" });

  res.json(LoginResponse.parse({ token, user }));
});

router.get(
  "/auth/me",
  authRequired,
  async (req: Request, res: Response) => {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(GetCurrentUserResponse.parse(user));
  },
);

router.patch(
  "/auth/me",
  authRequired,
  async (req: Request, res: Response) => {
    const parsed = UpdateCurrentUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [user] = await db
      .update(usersTable)
      .set(parsed.data)
      .where(eq(usersTable.id, req.user!.id))
      .returning();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(UpdateCurrentUserResponse.parse(user));
  },
);

router.post(
  "/auth/change-password",
  authRequired,
  async (req: Request, res: Response) => {
    const parsed = ChangePasswordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, req.user!.id));

    res.status(204).send();
  },
);

export default router;
