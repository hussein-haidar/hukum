import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/user-auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const histories = await prisma.chatHistory.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      messages: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    histories: histories.map((h) => ({
      id: h.id,
      title: h.title,
      messageCount: Array.isArray(h.messages) ? h.messages.length : 0,
      updatedAt: h.updatedAt,
    })),
  });
}