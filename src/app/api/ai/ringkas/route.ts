import { NextResponse } from "next/server";
import { getApiKey } from "@/lib/apikey";

export const dynamic = "force-dynamic";

interface Body {
  text?: string;
  mode?: "ringkas" | "form-fill";
  placeholders?: string[];
}

function extractJson(raw: string): Record<string, string> | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const objectMatch = candidate.match(/\{[\s\S]*\}/);
  if (!objectMatch) return null;
  try {
    const parsed = JSON.parse(objectMatch[0]);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    const text = body.text?.trim() || "";
    const mode = body.mode || "ringkas";

    if (!text) {
      return NextResponse.json({ summary: "Teks tidak boleh kosong." }, { status: 400 });
    }

    const apiKey = await getApiKey();
    if (!apiKey || !apiKey.startsWith("gsk_")) {
      return NextResponse.json({
        summary: "AI belum dikonfigurasi. Silakan set GROQ_API_KEY di environment variables.",
      });
    }

    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey });

    let prompt: string;

    if (mode === "form-fill") {
      const placeholders = (body.placeholders || []).join(", ");
      prompt = `Anda adalah asisten hukum yang membantu mengisi formulir surat hukum.

Berikut adalah permintaan pengguna:\n${text}

Berikan nilai untuk kolom-kolom berikut, jika ada dalam permintaan pengguna:
${placeholders}

INSTRUKSI:
- Kembalikan HANYA objek JSON tanpa teks lain, tanpa penjelasan.
- Format: {"NAMA_KOLOM": "nilai"}
- Gunakan hanya kunci yang nama kolomnya diberikan di atas.
- Jika cerita pengguna menyebut angka uang, tulis angka biasa tanpa titik (contoh 5000000).
- Jika cerita pengguna menyebut tanggal, tulis dalam format tanggal Indonesia (contoh 15 Mei 2026).
- Jika tidak ada nilai yang cocok, kembalikan {}.
`;
    } else {
      prompt = `Ringkas dokumen hukum berikut dalam bahasa Indonesia sederhana untuk masyarakat umum.
Buat ringkasan dalam 3-5 poin utama.
PENTING: Jangan gunakan simbol asterisk (*), pagar (#), atau markdown apapun. Tulis setiap poin dengan diawali angka "1. ", "2. " dan seterusnya. Gunakan kalimat lengkap dan spasi antar poin.

Dokumen:
${text}`;
    }

    const result = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-20b",
    });

    const raw = result.choices[0]?.message?.content || "";

    if (mode === "form-fill") {
      const fields = extractJson(raw);
      return NextResponse.json({
        fields,
        summary: raw,
      });
    }

    return NextResponse.json({ summary: raw });
  } catch (error) {
    console.error("Ringkas error:", error);
    return NextResponse.json(
      { summary: "Gagal memproses permintaan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}