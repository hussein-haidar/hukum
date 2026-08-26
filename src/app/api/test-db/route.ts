import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const adminCount = await prisma.admin.count();
    
    return NextResponse.json({ 
      ok: true, 
      adminCount,
      dbUrl: process.env.DATABASE_URL ? "set" : "missing"
    });
  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: error?.message,
      stack: error?.stack?.substring(0, 500)
    });
  }
}
