import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const faq = await prisma.fAQ.update({ where: { id: parseInt(params.id) }, data });
  return NextResponse.json(faq);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.fAQ.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ success: true });
}
