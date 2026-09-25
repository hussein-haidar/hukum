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

  if (matchCount < 2) return false;
  if (msgWords.length === 0 || questionWords.length === 0) return false;

  const msgCoverage = matchCount / msgWords.length;
  const questionCoverage = matchCount / questionWords.length;

  return msgCoverage >= 0.7 && questionCoverage >= 0.7;
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

  const SEARCH_STOPWORDS = [
    "berapa", "lama", "masa", "kapan", "apakah", "bagaimana", "gimana", "apa",
    "yang", "dan", "untuk", "dengan", "di", "ke", "dari", "oleh", "adalah",
    "ini", "itu", "saya", "anda", "kalau", "jika", "sudah", "masih", "tidak",
    "bisa", "dapat", "ingin", "cara", "karena", "agar", "supaya", "sebuah",
    "tersebut", "apabila", "sama", "bila", "juga", "sangat", "sering", "perlu",
    "tolong", "jelaskan", "dijelaskan", "mengenai", "tentang", "berapakah",
  ];

  const keywords: string[] = [];

  for (const [abbr, expansions] of Object.entries(ABBREVIATIONS)) {
    const pattern = new RegExp(`(^|[^a-z0-9])${abbr}([^a-z0-9]|$)`);
    if (pattern.test(lowerMsg)) {
      keywords.push(...expansions);
    }
  }

  const words = lowerMsg
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w: string) => w.length > 3 && !SEARCH_STOPWORDS.includes(w));

  keywords.push(...words);

  return Array.from(new Set(keywords)).join(" ");
}

function cleanMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/[*_]/g, "")
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]+/g, " ")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-")
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\r?\n\s*\r?\n/g, "\n\n")
    .trim();
}

const ACADEMIC_KEYWORDS = [
  "artikel",
  "jurnal",
  "karya tulis",
  "kajian",
  "penelitian",
  "kliping",
  "majalah",
  "koran",
  "buku",
  "makalah",
  "naskah akademik",
  "pengkajian",
  "himpunan",
  "analisis dan evaluasi",
  "ilmiah",
];

function isAcademicJenis(jenis: string): boolean {
  const lower = (jenis || "").toLowerCase();
  return ACADEMIC_KEYWORDS.some((k) => lower.includes(k));
}

function isFatwaJenis(jenis: string): boolean {
  return (jenis || "").toLowerCase().includes("fatwa");
}

function formatDocNumber(d: { jenis: string; nomor: string; tahun: string }): string {
  return d.nomor.trim()
    ? `${d.jenis} No. ${d.nomor}/${d.tahun}`
    : `${d.jenis} Tahun ${d.tahun}`;
}

function docNote(d: any): string {
  if (isFatwaJenis(d.jenis)) {
    return " (Fatwa MUI - pendapat ulama, bukan peraturan negara yang mengikat)";
  }
  if (isAcademicJenis(d.jenis)) {
    return " (artikel/naskah akademis - pandangan, bukan peraturan yang mengikat)";
  }
  return "";
}

function formatSources(docs: any[]): string {
  return docs
    .map((d, i) => {
      let line = `${i + 1}. ${formatDocNumber(d)} - ${d.judul}`;
      const note = docNote(d);
      if (note) line += note;
      if (d.tentang) line += `\n   Tentang: ${d.tentang}`;
      line += `\n   Status: ${d.status}`;
      if (d.urlSumber) line += `\n   Sumber: ${d.urlSumber}`;
      return line;
    })
    .join("\n");
}

const REGULATION_TYPES = [
  "undang-undang",
  "uud",
  "perppu",
  "peraturan",
  "instruksi presiden",
  "keputusan presiden",
  "keputusan menteri",
  "keputusan bersama menteri",
  "peraturan pemerintah pengganti undang-undang",
  "putusan mahkamah konstitusi",
  "putusan pengadilan",
  "surat edaran",
  "rancangan peraturan perundang-undangan",
  "instrumen hukum internasional",
];

function isRegulation(jenis: string): boolean {
  const lower = (jenis || "").toLowerCase();
  return REGULATION_TYPES.some((t) => lower.startsWith(t));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasWholeWord(text: string, word: string): boolean {
  return new RegExp(`(^|[^a-z0-9A-Z])${escapeRegExp(word.toLowerCase())}([^a-z0-9A-Z]|$)`).test(
    text.toLowerCase()
  );
}

function scoreDocument(doc: any, words: string[]): number {
  const lowerJudul = doc.judul.toLowerCase();
  const lowerTentang = (doc.tentang || "").toLowerCase();
  const lowerJenis = doc.jenis.toLowerCase();
  let score = 0;
  let hits = 0;
  for (const w of words) {
    const low = w.toLowerCase();
    if (hasWholeWord(lowerJudul, low)) {
      score += 3;
      hits += 1;
    }
    if (hasWholeWord(lowerTentang, low)) {
      score += 2;
      hits += 1;
    }
    if (hasWholeWord(lowerJenis, low)) {
      score += 1;
      hits += 1;
    }
  }
  if (hits === 0) return -100;
  if (isAcademicJenis(lowerJenis)) score -= 20;
  else if (isRegulation(lowerJenis)) score += 4;
  else if (isFatwaJenis(lowerJenis)) score += 1;
  else score -= 3;
  return score;
}

function hierarchyWeight(jenis: string): number {
  const lower = (jenis || "").toLowerCase();
  if (/^(undang-undang|uud|perppu)/.test(lower)) return 3;
  if (/^peraturan pemerintah/.test(lower)) return 2;
  if (isRegulation(lower)) return 1;
  return 0;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || message.trim().length < 3) {
      return NextResponse.json({ answer: "Silakan masukkan pertanyaan yang valid." });
    }

    const [faqs, glossaries] = await Promise.all([
      prisma.fAQ.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.glosarium.findMany({ orderBy: { term: "asc" } }),
    ]);

    const localMatch = faqs.find((f) => matchesLocal(f, message));

    if (localMatch) {
      return NextResponse.json({
        answer: cleanMarkdown(
          localMatch.answer +
            "\n\nJawaban ini berdasarkan database FAQ. Untuk kasus spesifik, silakan konsultasi dengan advokat."
        ),
      });
    }

    const glossaryMatch = glossaries.find((g) =>
      message.toLowerCase().includes(g.term.toLowerCase())
    );

    if (glossaryMatch) {
      return NextResponse.json({
        answer: cleanMarkdown(
          `${glossaryMatch.term} adalah: ${glossaryMatch.definition}\n\nUntuk informasi lebih lanjut, silakan konsultasi dengan advokat atau penasihat hukum.`
        ),
      });
    }

    let sourceDocs: any[] = [];
    let legalContext = "";
    try {
      const searchTerms = searchLegalDocuments(message);
      if (searchTerms) {
        const words = searchTerms.split(" ");

        const orConditions = words.flatMap((word) => [
          { judul: { contains: word, mode: "insensitive" as const } },
          { tentang: { contains: word, mode: "insensitive" as const } },
          { jenis: { contains: word, mode: "insensitive" as const } },
        ]);

        const docs = await prisma.legalDocument.findMany({
          where: {
            OR: orConditions.slice(0, 20),
          },
          orderBy: { tahun: "desc" },
        });

        const scored = docs.map((d) => ({ doc: d, score: scoreDocument(d, words) }));

        // Prioritas tinggi: peraturan yang berlaku (+ fatwa sebagai pelengkap).
        const mainDocs = scored
          .filter((s) => s.score >= 2 && !isAcademicJenis(s.doc.jenis))
          .sort((a, b) => {
            const hb = hierarchyWeight(b.doc.jenis) - hierarchyWeight(a.doc.jenis);
            if (hb !== 0) return hb;
            return b.score - a.score;
          })
          .slice(0, 5);

        // Cadangan: artikel/naskah akademis, hanya bila tidak ada peraturan.
        const academicDocs = scored
          .filter((s) => s.score >= 2 && isAcademicJenis(s.doc.jenis))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        const topDocs = mainDocs.length > 0 ? mainDocs : academicDocs;

        if (topDocs.length > 0) {
          sourceDocs = topDocs.map((s) => s.doc);
          legalContext =
            "\n\nData Peraturan Relevan (referensi):\n" +
            topDocs
              .map(
                (s, i) =>
                  `${i + 1}. ${formatDocNumber(s.doc)}${docNote(s.doc)}\n   Judul: ${s.doc.judul}\n   Tentang: ${s.doc.tentang || "-"}\n   Status: ${s.doc.status}`
              )
              .join("\n");
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

Instruksi:
1. Jawab pertanyaan pengguna secara langsung, jelas, dan spesifik sesuai topik yang ditanyakan.
2. Gunakan pengetahuan umum hukum Indonesia yang kamu miliki; data FAQ dan peraturan di bawah hanya referensi tambahan.
3. Bedakan dengan tegas antara:
   - PERATURAN yang berlaku dan mengikat (UU, PP, Perpres, Perda, dst.).
   - PENDAPAT/pandangan yang TIDAK mengikat: Fatwa MUI, artikel, jurnal, naskah akademik, dan tulisan akademis lainnya. Jika data referensi di bawah bertanda "(Fatwa MUI...)" atau "(artikel/naskah akademis...)", sebut hanya sebagai pendapat, JANGAN pernah menyajikannya sebagai aturan resmi yang berlaku.
4. Sebutkan nomor undang-undang atau pasal HANYA jika benar dan sesuai data di bawah; jika tidak yakin, jangan mengarang nomor pasal atau nomor UU - cukup jelaskan prinsip hukumnya secara umum.
5. FATAL JIKA MELANGGAR (PERCERAIAN/TALAK): Dalam hukum Indonesia, perceraian - termasuk talak oleh suami - HANYA sah apabila dinyatakan dan diputuskan di dalam sidang pengadilan yang berwenang. Pengadilan Agama untuk pasangan muslim (suami mengucapkan talak di hadapan sidang, sesuai UU No. 1 Tahun 1974 tentang Perkawinan jo. KHI), dan Pengadilan Negeri untuk pasangan non-muslim. JANGAN PERNAH menyatakan bahwa perceraian atau talak dapat dilakukan tanpa sidang pengadilan. Perceraian tanpa putusan pengadilan tidak diakui sah secara hukum di Indonesia.
6. JANGAN membuat daftar peraturan/sumber di akhir jawaban, karena daftar sumber akan ditambahkan otomatis oleh sistem.
7. Jika kasus membutuhkan analisis mendalam, berikan penjelasan umum dulu lalu sarankan konsultasi advokat.
8. Gunakan bahasa Indonesia yang sederhana dan mudah dipahami, tanpa simbol markdown (jangan gunakan **, *, #, dst).
9. Gunakan huruf dan tanda baca standar (ASCII): tanda hubung biasa "-", tanda kutip biasa '"' dan "'", angka dan spasi normal. JANGAN gunakan en-dash, em-dash, tanda kutip keriting, atau karakter Unicode khusus lainnya.
10. Akhiri dengan disclaimer: "Jawaban AI bersifat informatif dan bukan pengganti konsultasi hukum profesional."

Data FAQ:
${faqContext}

Glosarium Hukum:
${glossaryContext}
${legalContext}

Pertanyaan pengguna: ${message}

Jawaban:`;

        const result = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "openai/gpt-oss-20b",
        });

        const rawAnswer = result.choices[0]?.message?.content || "Maaf, tidak ada jawaban dari AI.";

        let answer = rawAnswer;
        if (sourceDocs.length > 0) {
          answer += `\n\nSumber Dokumen Terkait:\n${formatSources(sourceDocs)}`;
        }

        return NextResponse.json({ answer: cleanMarkdown(answer) });
      } catch (aiError: any) {
        console.error("Groq AI error:", aiError.message);
      }
    }

    let fallbackAnswer = "";
    if (sourceDocs.length > 0) {
      fallbackAnswer = `Peraturan terkait yang kami temukan di database:\n${formatSources(sourceDocs)}`;
    } else {
      fallbackAnswer =
        "Maaf, layanan AI sedang tidak tersedia saat ini dan tidak ditemukan peraturan spesifik di database kami terkait pertanyaan Anda.";
    }

    fallbackAnswer += `\n\nSaran:
1. Kunjungi https://peraturan.go.id untuk database peraturan nasional
2. Kunjungi https://jdihn.go.id untuk JDIH Nasional
3. Hubungi LBH (Lembaga Bantuan Hukum) terdekat untuk konsultasi gratis
4. Konsultasi dengan advokat/penasihat hukum untuk kasus spesifik

Jawaban ini bersifat informatif dan bukan pengganti konsultasi hukum profesional.`;

    return NextResponse.json({ answer: cleanMarkdown(fallbackAnswer) });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({
      answer: "Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti."
    });
  }
}