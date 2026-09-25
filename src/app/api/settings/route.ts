import { NextResponse } from "next/server";
import { isTemplateSuratVisible } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const templateSuratVisible = await isTemplateSuratVisible();
  return NextResponse.json({ templateSuratVisible });
}