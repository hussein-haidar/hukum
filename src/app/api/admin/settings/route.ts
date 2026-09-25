import { NextResponse } from "next/server";
import { setSetting, TEMPLATE_SURAT_VISIBLE_KEY } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { templateSuratVisible } = await req.json();
    await setSetting(
      TEMPLATE_SURAT_VISIBLE_KEY,
      templateSuratVisible ? "true" : "false"
    );
    return NextResponse.json({ success: true, templateSuratVisible: !!templateSuratVisible });
  } catch (error: any) {
    console.error("Settings save error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal menyimpan pengaturan" },
      { status: 500 }
    );
  }
}