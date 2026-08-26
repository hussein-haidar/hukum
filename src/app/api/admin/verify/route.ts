import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false });
    }

    const admin = await prisma.admin.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date(),
        },
      },
    });

    // Cari admin berdasarkan token di localStorage (kita simpan token sederhana)
    // Actually, login API generates token as Buffer.from(`${admin.id}:${Date.now()}`).toString("base64")
    // Kita parse token itu
    let adminId = 0;
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      adminId = parseInt(decoded.split(":")[0]);
    } catch {}

    if (adminId === 0) {
      return NextResponse.json({ success: false });
    }

    const adminData = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, username: true },
    });

    if (!adminData) {
      return NextResponse.json({ success: false });
    }

    return NextResponse.json({ 
      success: true, 
      admin: { id: adminData.id, username: adminData.username } 
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}