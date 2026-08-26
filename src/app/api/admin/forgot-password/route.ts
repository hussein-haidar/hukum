import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: "Email wajib diisi" });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    
    if (!admin) {
      return NextResponse.json({ 
        success: true, 
        message: "Jika email terdaftar, link reset password telah dikirim" 
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        resetToken,
        resetExpires,
      },
    });

    console.log(`Reset token untuk ${email}: ${resetToken}`);

    return NextResponse.json({ 
      success: true, 
      message: "Jika email terdaftar, link reset password telah dikirim" 
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}