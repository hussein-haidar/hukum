import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createUserToken } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedName = (name || "").trim();

    if (!trimmedEmail || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: "Format email tidak valid" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: trimmedName || trimmedEmail.split("@")[0],
        email: trimmedEmail,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      token: createUserToken(user.id),
      user: { id: user.id, name: user.name, email: user.email, picture: user.picture },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}