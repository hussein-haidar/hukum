import { prisma } from "./prisma";

const TOKEN_PREFIX = "hk_user_";

export function createUserToken(userId: number): string {
  const raw = Buffer.from(`${userId}:${Date.now()}`).toString("base64");
  return `${TOKEN_PREFIX}${raw}`;
}

export async function verifyUserToken(token: string | null | undefined) {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;

  try {
    const raw = token.slice(TOKEN_PREFIX.length);
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const userId = parseInt(decoded.split(":")[0], 10);
    if (!userId) return null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
    };
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: Request) {
  const token =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-user-token");
  return verifyUserToken(token);
}