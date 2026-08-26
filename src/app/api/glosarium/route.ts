import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const glossaries = await prisma.glosarium.findMany({ orderBy: { term: "asc" } });
  return NextResponse.json(glossaries);
}

export async function POST(req: Request) {
  const data = await req.json();
  const glossary = await prisma.glosarium.create({ data });
  return NextResponse.json(glossary);
}
