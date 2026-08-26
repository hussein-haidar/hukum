import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: (globalThis as any).GROQ_API_KEY || process.env.GROQ_API_KEY });

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

    if (groq.apiKey && groq.apiKey.startsWith("gsk_")) {
      try {
        const faqContext = faqs
          .map((f, i) => `${i + 1}. ${f.question}\n   ${f.answer}`)
          .join("\n\n");

        const glossaryContext = glossaries
          .map((g) => `${g.term}: ${g.definition}`)
          .join("\n");

        const prompt = `Kamu adalah asisten hukum Indonesia bernama HukumKu AI.

**Instruksi:**
1. Jawab berdasarkan data peraturan di bawah ini JIKA pertanyaan relevan
2. Sebutkan nomor dan judul peraturan yang digunakan sebagai dasar jawaban
3. Jika tidak ada data peraturan yang relevan, katakan: "Maaf, informasi ini tidak ada di database kami" dan sarankan konsultasi Advokat
4. Gunakan bahasa Indonesia yang sederhana dan mudah dipahami
5. Akhiri selalu dengan disclaimer: "Jawaban AI bersifat informatif dan bukan pengganti konsultasi hukum profesional."

**FAQ:**
${faqContext}

**Glosarium:**
${glossaryContext}
${legalContext}

**Pertanyaan pengguna:** ${message}

**Jawaban:`;

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

    let fallbackAnswer = `Terima kasih atas pertanyaan Anda tentang "${message}".`;

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
          fallbackAnswer += "\n\n**Peraturan yang mungkin terkait:**\n";
          fallbackAnswer += topDocs.map((s) =>
            `- ${s.doc.jenis} No. ${s.doc.nomor}/${s.doc.tahun} tentang ${s.doc.tentang || s.doc.judul} (${s.doc.urlSumber || "Lihat di JDIHN"})`
          ).join("\n");
        }
      }
    } catch (err) {
      console.error("Legal search fallback error:", err);
    }

    fallbackAnswer += `

**Saran kami:**
1. Konsultasi dengan advokat/penasihat hukum
2. Kunjungi pengadilan negeri/agama setempat
3. Hubungi LBH (Lembaga Bantuan Hukum) terdekat
4. Akses https://jdihn.go.id untuk database peraturan lengkap

---\n*Jawaban ini bersifat umum dan bukan pengganti konsultasi hukum profesional.*`;

    return NextResponse.json({ answer: fallbackAnswer });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({
      answer: "Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti."
    });
  }
}
