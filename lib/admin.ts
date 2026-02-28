export function assertAdminSecret(secret: string | undefined) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) throw new Error("Missing ADMIN_SECRET on server");

  if (!secret || secret !== expected) {
    return { ok: false as const, error: "Unauthorized" };
  }
  return { ok: true as const };
}