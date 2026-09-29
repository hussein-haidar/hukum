import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/user-auth";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function GET(
  req: Request,
  { params }: { params: { historyId: string } }
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const id = parseInt(params.historyId, 10);
  if (!id) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const history = await prisma.chatHistory.findFirst({
    where: { id, userId: user.id },
  });

  if (!history) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const messages = Array.isArray(history.messages)
    ? (history.messages as unknown as ChatMessage[])
    : [];

  return NextResponse.json({
    success: true,
    history: {
      id: history.id,
      title: history.title,
      messages: messages.map((m, i) => ({
        id: i,
        role: m.role,
        content: m.content,
      })),
    },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { historyId: string } }
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const id = parseInt(params.historyId, 10);
  if (!id) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const history = await prisma.chatHistory.findFirst({
    where: { id, userId: user.id },
  });

  if (!history) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  await prisma.chatHistory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}