import { prisma } from "./prisma";

export async function getApiKey(): Promise<string | null> {
  const config = await prisma.systemConfig.findUnique({ where: { key: "groq_api_key" } });
  return config?.value || null;
}

export async function setApiKey(key: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: "groq_api_key" },
    update: { value: key },
    create: { key: "groq_api_key", value: key },
  });
}
