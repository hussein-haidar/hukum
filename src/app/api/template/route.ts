import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.templateSurat.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const data = await req.json();
  const template = await prisma.templateSurat.create({ data });
  return NextResponse.json(template);
}
