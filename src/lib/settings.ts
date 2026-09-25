import { prisma } from "@/lib/prisma";

export const TEMPLATE_SURAT_VISIBLE_KEY = "template-surat-visible";

export async function getSetting(key: string, fallback = ""): Promise<string> {
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key } });
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function isTemplateSuratVisible(): Promise<boolean> {
  const value = await getSetting(TEMPLATE_SURAT_VISIBLE_KEY, "false");
  return value === "true";
}