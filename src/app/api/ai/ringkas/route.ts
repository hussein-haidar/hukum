import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || !apiKey.startsWith("gsk_")) {
      return NextResponse.json({
        summary:
          "Ringkasan dummy: AI belum dikonfigurasi. Silakan set GROQ_API_KEY di environment variables.",
      });
    }

    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey });

    const prompt = `Ringkas dokumen hukum berikut dalam bahasa Indonesia sederhana untuk masyarakat umum.
Buat ringkasan dalam 3-5 poin utama, gunakan bahasa yang mudah dipahami.

Dokumen:
${text}`;

    const result = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-20b",
    });

    return NextResponse.json({ summary: result.choices[0]?.message?.content || "Gagal merangkum." });
  } catch (error) {
    console.error("Ringkas error:", error);
    return NextResponse.json(
      { summary: "Gagal merangkum dokumen. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
