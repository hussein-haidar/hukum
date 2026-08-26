import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json({ success: false, message: "Username atau password salah" });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ success: false, message: "Username atau password salah" });
    }

    const token = Buffer.from(`${admin.id}:${Date.now()}`).toString("base64");

    return NextResponse.json({ success: true, token, username: admin.username });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
