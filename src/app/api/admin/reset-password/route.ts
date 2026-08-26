import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ success: false, message: "Token dan password wajib diisi" });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: "Password minimal 6 karakter" });
    }

    const admin = await prisma.admin.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!admin) {
      return NextResponse.json({ success: false, message: "Token tidak valid atau sudah expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
      },
    });

    return NextResponse.json({ success: true, message: "Password berhasil direset" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}