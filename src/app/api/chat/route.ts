import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/apikey";

function matchesLocal(faq: any, message: string): boolean {
  const lowerMsg = message.toLowerCase();
  const lowerQuestion = faq.question.toLowerCase();

  const stopwords = ["yang", "dan", "untuk", "dengan", "di", "ke", "dari", "oleh", "adalah", "ini", "itu", "apa", "bagaimana", "gimana"];

  const msgWords = lowerMsg.split(/\s+/).filter((w: string) => !stopwords.includes(w) && w.length > 3);
  const questionWords = lowerQuestion.split(/\s+/).filter((w: string) => !stopwords.includes(w) && w.length > 3);

  const matchCount = msgWords.filter((w: string) => questionWords.includes(w)).length;

  return matchCount >= 2;
}

function searchLegalDocuments(message: string): string {
  const lowerMsg = message.toLowerCase();

  const ABBREVIATIONS: Record<string, string[]> = {
    "kuhp": ["kitab undang-undang hukum pidana", "hukum pidana"],
    "kuhperdata": ["kitab undang-undang hukum perdata", "hukum perdata"],
    "uuciptakerja": ["cipta kerja", "omnibus law"],
    "uu ketenagakerjaan": ["ketenagakerjaan", "ketenagakerjaan"],
    "perpres": ["peraturan presiden"],
    "permen": ["peraturan menteri"],
    "pp": ["peraturan pemerintah"],
    "uu": ["undang-undang"],
    "mk": ["mahkamah konstitusi"],
    "ma": ["mahkamah agung"],
    "kpk": ["komisi pemberantasan korupsi"],
    "bpjs": ["badan penyelenggara jaminan sosial"],
    "pajak": ["perpajakan", "pajak"],
    "phk": ["pemutusan hubungan kerja"],
    "uptp": ["usaha penukaran valuta asing"],
    "sim": ["surat izin mengemudi"],
  };

  const keywords: string[] = [];

  for (const [abbr, expansions] of Object.entries(ABBREVIATIONS)) {
    if (lowerMsg.includes(abbr)) {
      keywords.push(...expansions);
    }
  }

  const words = lowerMsg
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w: string) => w.length > 2);

  keywords.push(...words);

  return Array.from(new Set(keywords)).join(" ");
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || message.trim().length < 3) {
      return NextResponse.json({ answer: "Silakan masukkan pertanyaan yang valid." });
    }

    const [faqs, glossaries] = await Promise.all([
      prisma.fAQ.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
      prisma.glosarium.findMany({ take: 10 }),
    ]);

    const localMatch = faqs.find((f) => matchesLocal(f, message));

    if (localMatch) {
      return NextResponse.json({
        answer: localMatch.answer + "\n\n---\n*Jawaban ini berdasarkan database FAQ. Untuk kasus spesifik, silakan konsultasi dengan advokat.*"
      });
    }

    const glossaryMatch = glossaries.find((g) =>
      message.toLowerCase().includes(g.term.toLowerCase())
    );

    if (glossaryMatch) {
      return NextResponse.json({
        answer: `**${glossaryMatch.term}** adalah: ${glossaryMatch.definition}\n\n---\n*Untuk informasi lebih lanjut, silakan konsultasi dengan advokat atau penasihat hukum.*`
      });
    }

    let legalContext = "";
    try {
      const searchTerms = searchLegalDocuments(message);
      if (searchTerms) {
        const words = searchTerms.split(" ");

        const orConditions = words.flatMap((word) => [
          { judul: { contains: word } },
          { tentang: { contains: word } },
          { jenis: { contains: word } },
        ]);

        const docs = await prisma.legalDocument.findMany({
          where: {
            OR: orConditions.slice(0, 20),
          },
          orderBy: { tahun: "desc" },
        });

        const scored = docs.map((d) => {
          const lowerJudul = d.judul.toLowerCase();
          const lowerTentang = (d.tentang || "").toLowerCase();
          const lowerJenis = d.jenis.toLowerCase();
          let score = 0;
          for (const w of words) {
            if (lowerJudul.includes(w)) score += 3;
            if (lowerTentang.includes(w)) score += 2;
            if (lowerJenis.includes(w)) score += 1;
          }
          return { doc: d, score };
        });

        const topDocs = scored
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        if (topDocs.length > 0) {
          legalContext = "\n\n**Peraturan Perundang-undangan Terkait:**\n" +
            topDocs.map((s, i) =>
              `${i + 1}. **${s.doc.jenis} No. ${s.doc.nomor}/${s.doc.tahun}**\n` +
              `   Judul: ${s.doc.judul}\n` +
              `   Tentang: ${s.doc.tentang || "-"}\n` +
              `   Status: ${s.doc.status}\n` +
              `   Sumber: ${s.doc.urlSumber || "-"}`
            ).join("\n\n");
        }
      }
    } catch (err) {
      console.error("Legal search error:", err);
    }

    const apiKey = await getApiKey();
    if (apiKey && apiKey.startsWith("gsk_")) {
      try {
        const Groq = (await import("groq-sdk")).default;
        const groq = new Groq({ apiKey });

        const faqContext = faqs
          .map((f, i) => `${i + 1}. ${f.question}\n   ${f.answer}`)
          .join("\n\n");

        const glossaryContext = glossaries
          .map((g) => `${g.term}: ${g.definition}`)
          .join("\n");

        const prompt = `Kamu adalah asisten hukum Indonesia bernama HukumKu AI yang ahli di bidang hukum Indonesia.

**Instruksi:**
1. Jawab pertanyaan pengguna secara langsung, jelas, dan spesifik sesuai topik yang ditanyakan
2. JIKA ada data peraturan di bawah ini yang relevan, gunakan sebagai dasar jawaban dan sebutkan nomor serta judul peraturannya
3. JIKA tidak ada data peraturan yang relevan di database, tetap JAWAB pertanyaan berdasarkan pengetahuan umum hukum Indonesia yang kamu miliki. Jangan menolak menjawab.
4. Berikan penjelasan yang praktis dan bisa dipahami oleh orang awam
5. Jika pertanyaan sangat spesifik dan membutuhkan analisis mendalam, jawab dulu dengan pengetahuan umum lalu sarankan konsultasi advokat untuk kasus spesifik
6. Gunakan bahasa Indonesia yang sederhana dan mudah dipahami
7. Selalu akhiri dengan disclaimer: "Jawaban AI bersifat informatif dan bukan pengganti konsultasi hukum profesional."

**Data FAQ:**
${faqContext}

**Glosarium Hukum:**
${glossaryContext}
${legalContext}

**Pertanyaan pengguna:** ${message}

**Jawaban:**`;

        const result = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "openai/gpt-oss-20b",
        });

        const answer = result.choices[0]?.message?.content || "Maaf, tidak ada jawaban dari AI."

        return NextResponse.json({ answer });
      } catch (aiError: any) {
        console.error("Groq AI error:", aiError.message);
      }
    }

    let fallbackAnswer = "";

    try {
      const searchTerms = searchLegalDocuments(message);
      if (searchTerms) {
        const words = searchTerms.split(" ");
        const orConditions = words.flatMap((word) => [
          { judul: { contains: word } },
          { tentang: { contains: word } },
        ]);

        const docs = await prisma.legalDocument.findMany({
          where: { OR: orConditions.slice(0, 20) },
          orderBy: { tahun: "desc" },
        });

        const scored = docs.map((d) => {
          const lowerJudul = d.judul.toLowerCase();
          const lowerTentang = (d.tentang || "").toLowerCase();
          let score = 0;
          for (const w of words) {
            if (lowerJudul.includes(w)) score += 3;
            if (lowerTentang.includes(w)) score += 2;
          }
          return { doc: d, score };
        });

        const topDocs = scored
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        if (topDocs.length > 0) {
          fallbackAnswer += "**Peraturan yang mungkin terkait:**\n";
          fallbackAnswer += topDocs.map((s) =>
            `- **${s.doc.jenis} No. ${s.doc.nomor}/${s.doc.tahun}** tentang ${s.doc.tentang || s.doc.judul}\n  Status: ${s.doc.status}${s.doc.urlSumber ? `\n  Sumber: ${s.doc.urlSumber}` : ""}`
          ).join("\n\n");
          fallbackAnswer += "\n\n";
        }
      }
    } catch (err) {
      console.error("Legal search fallback error:", err);
    }

    if (!fallbackAnswer) {
      fallbackAnswer = `Maaf, layanan AI sedang tidak tersedia saat ini dan tidak ditemukan peraturan spesifik di database kami terkait pertanyaan Anda.\n\n`;
    }

    fallbackAnswer += `**Saran:**
1. Kunjungi [https://peraturan.go.id](https://peraturan.go.id) untuk database peraturan nasional
2. Kunjungi [https://jdihn.go.id](https://jdihn.go.id) untuk JDIH Nasional
3. Hubungi LBH (Lembaga Bantuan Hukum) terdekat untuk konsultasi gratis
4. Konsultasi dengan advokat/penasihat hukum untuk kasus spesifik

---\n*Jawaban ini bersifat informatif dan bukan pengganti konsultasi hukum profesional.*`;

    return NextResponse.json({ answer: fallbackAnswer });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({
      answer: "Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti."
    });
  }
}
