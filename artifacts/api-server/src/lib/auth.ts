import jwt from "jsonwebtoken";

const rawSecret = process.env["SESSION_SECRET"];

if (!rawSecret) {
  throw new Error(
    "SESSION_SECRET environment variable is required but was not provided.",
  );
}

const JWT_SECRET: string = rawSecret;

export interface AuthTokenPayload {
  id: number;
  role: "admin" | "technician";
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "id" in decoded &&
      "role" in decoded
    ) {
      return {
        id: Number((decoded as Record<string, unknown>)["id"]),
        role: (decoded as Record<string, unknown>)["role"] as
          | "admin"
          | "technician",
      };
    }
    return null;
  } catch {
    return null;
  }
}
