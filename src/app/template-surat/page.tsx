import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isTemplateSuratVisible } from "@/lib/settings";
import TemplateSuratList from "@/components/TemplateSuratList";

export const dynamic = "force-dynamic";

export default async function TemplateSuratPage() {
  if (!(await isTemplateSuratVisible())) notFound();

  const templates = await prisma.templateSurat.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <TemplateSuratList templates={templates} />;
}