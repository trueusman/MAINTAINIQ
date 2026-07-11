import type { Request, Response, NextFunction } from "express";
import { verifyAuthToken, type AuthTokenPayload } from "../lib/auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function authRequired(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const token = header.slice("Bearer ".length);
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  req.user = payload;
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
