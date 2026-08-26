import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const faqs = await prisma.fAQ.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(faqs);
}

export async function POST(req: Request) {
  const data = await req.json();
  const faq = await prisma.fAQ.create({ data });
  return NextResponse.json(faq);
}
