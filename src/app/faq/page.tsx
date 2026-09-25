import { prisma } from "@/lib/prisma";
import FaqContent from "@/components/FaqContent";

export const dynamic = "force-dynamic";

export default async function FAQPage() {
  const faqs = await prisma.fAQ.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <FaqContent faqs={faqs} />;
}