import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const glossary = await prisma.glosarium.update({ where: { id: parseInt(params.id) }, data });
  return NextResponse.json(glossary);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.glosarium.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ success: true });
}
