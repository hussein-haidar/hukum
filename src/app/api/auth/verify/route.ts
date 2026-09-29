import { NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const user = await verifyUserToken(token);

    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}