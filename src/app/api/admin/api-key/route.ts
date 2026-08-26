import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { apiKey: rawKey, action } = await req.json();
    const apiKey = (rawKey || "").trim().replace(/[^\x00-\x7F]/g, "");

    if (!apiKey) {
      return NextResponse.json({ success: false, message: "API Key wajib diisi" });
    }

    if (action === "save") {
      // Simpan ke environment - dalam aplikasi produksi, disarankan disimpan ke database
      // Untuk demo, kita setting ke globalThis agar tersimpan sesi ini
      ;(globalThis as any).GROQ_API_KEY = apiKey;

      // Validasi basic format (gsk_ prefix)
      if (!apiKey.startsWith("gsk_")) {
        return NextResponse.json({ 
          success: false, 
          message: "Format API Key tidak valid. Harus dimulai dengan 'gsk_'"
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: "API Key berhasil disimpan dan divisifikasi"
      });
    }

    if (action === "test") {
      // Test koneksi dengan memanggil Groq API
      const groq = new (await import("groq-sdk")).Groq({ apiKey });

      try {
        const result = await groq.models.list();
        return NextResponse.json({ 
          success: true, 
          message: "API Key valid!",
          model: result.data[0]?.id || "unknown"
        });
      } catch (apiError: any) {
        // API key format valid tapi gagal authenticate/quota
        return NextResponse.json({ 
          success: false, 
          message: "API Key format benar tapi gagal terautentikasi: " + (apiError.message?.substring(0, 100) || "Error")
        });
      }
    }

    return NextResponse.json({ success: false, message: "Aksi tidak dikenal" });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan: " + (error instanceof Error ? error.message : "Unknown") }, { status: 500 });
  }
}