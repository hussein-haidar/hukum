import { prisma } from "@/lib/prisma";
import GlosariumContent from "@/components/GlosariumContent";

export const dynamic = "force-dynamic";

export default async function GlosariumPage() {
  const glossaries = await prisma.glosarium.findMany({
    orderBy: { term: "asc" },
  });

  return <GlosariumContent glossaries={glossaries} />;
}