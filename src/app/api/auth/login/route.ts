import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createUserToken } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const trimmedEmail = (email || "").trim().toLowerCase();

    if (!trimmedEmail || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: trimmedEmail } });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token: createUserToken(user.id),
      user: { id: user.id, name: user.name, email: user.email, picture: user.picture },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}