import { NextResponse } from "next/server";
import { getApiKey, setApiKey } from "@/lib/apikey";

export async function GET() {
  const key = await getApiKey();
  return NextResponse.json({ success: true, hasKey: !!key, masked: key ? key.slice(0, 7) + "..." + key.slice(-4) : null });
}

export async function POST(req: Request) {
  try {
    const { apiKey: rawKey, action } = await req.json();
    const apiKey = (rawKey || "").trim().replace(/[^\x00-\x7F]/g, "");

    if (action === "test") {
      if (!apiKey) {
        const existing = await getApiKey();
        if (!existing) {
          return NextResponse.json({ success: false, message: "API Key belum disimpan" });
        }
        const Groq = (await import("groq-sdk")).default;
        const groq = new Groq({ apiKey: existing });
        try {
          const result = await groq.models.list();
          return NextResponse.json({ success: true, message: "API Key valid!", model: result.data[0]?.id || "unknown" });
        } catch (apiError: any) {
          return NextResponse.json({ success: false, message: "API Key gagal terautentikasi: " + (apiError.message?.substring(0, 100) || "Error") });
        }
      }

      if (!apiKey.startsWith("gsk_")) {
        return NextResponse.json({ success: false, message: "Format API Key tidak valid. Harus dimulai dengan 'gsk_'" });
      }

      const Groq = (await import("groq-sdk")).default;
      const groq = new Groq({ apiKey });
      try {
        const result = await groq.models.list();
        return NextResponse.json({ success: true, message: "API Key valid!", model: result.data[0]?.id || "unknown" });
      } catch (apiError: any) {
        return NextResponse.json({ success: false, message: "API Key gagal terautentikasi: " + (apiError.message?.substring(0, 100) || "Error") });
      }
    }

    if (action === "save") {
      if (!apiKey) {
        return NextResponse.json({ success: false, message: "API Key wajib diisi" });
      }
      if (!apiKey.startsWith("gsk_")) {
        return NextResponse.json({ success: false, message: "Format API Key tidak valid. Harus dimulai dengan 'gsk_'" });
      }
      await setApiKey(apiKey);
      return NextResponse.json({ success: true, message: "API Key berhasil disimpan ke database" });
    }

    return NextResponse.json({ success: false, message: "Aksi tidak dikenal" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan: " + (error instanceof Error ? error.message : "Unknown") }, { status: 500 });
  }
}
