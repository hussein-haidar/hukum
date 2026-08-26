import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, message: "Semua field wajib diisi" });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: "Password minimal 6 karakter" });
    }

    const existingUser = await prisma.admin.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "Username sudah digunakan" });
    }

    const existingEmail = await prisma.admin.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ success: false, message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true, message: "Pendaftaran berhasil" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}