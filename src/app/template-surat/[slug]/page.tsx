import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isTemplateSuratVisible } from "@/lib/settings";
import TemplateSuratDetail from "@/components/TemplateSuratDetail";

export const dynamic = "force-dynamic";

export default async function TemplateSuratDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  if (!(await isTemplateSuratVisible())) notFound();

  const template = await prisma.templateSurat.findUnique({
    where: { slug: params.slug },
  });
  if (!template) notFound();

  return <TemplateSuratDetail template={template} />;
}