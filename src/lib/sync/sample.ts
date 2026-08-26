import { prisma } from "@/lib/prisma";
import { SyncResult } from "./types";

const SAMPLE_DOCUMENTS = [
  {
    sourceId: "uu-1-2023",
    jenis: "UU",
    nomor: "1",
    tahun: "2023",
    judul: "Kitab Undang-Undang Hukum Pidana",
    tentang: "Kitab Undang-Undang Hukum Pidana",
    status: "berlaku",
    instansi: "DPR RI",
  },
  {
    sourceId: "uu-11-2020",
    jenis: "UU",
    nomor: "11",
    tahun: "2020",
    judul: "Undang-Undang Cipta Kerja",
    tentang: "Undang-Undang Cipta Kerja",
    status: "berlaku",
    instansi: "DPR RI",
  },
  {
    sourceId: "uu-13-2003",
    jenis: "UU",
    nomor: "13",
    tahun: "2003",
    judul: "Undang-Undang Ketenagakerjaan",
    tentang: "Ketenagakerjaan",
    status: "berlaku",
    instansi: "DPR RI",
  },
  {
    sourceId: "uu-1-2024",
    jenis: "UU",
    nomor: "1",
    tahun: "2024",
    judul: "Undang-Undang Perlindungan Data Pribadi",
    tentang: "Perlindungan Data Pribadi",
    status: "berlaku",
    instansi: "DPR RI",
  },
  {
    sourceId: "uu-17-2023",
    jenis: "UU",
    nomor: "17",
    tahun: "2023",
    judul: "Undang-Undang Kesehatan",
    tentang: "Kesehatan",
    status: "berlaku",
    instansi: "DPR RI",
  },
  {
    sourceId: "pp-27-2022",
    jenis: "PP",
    nomor: "27",
    tahun: "2022",
    judul: "PP tentang Pengelolaan Limbah B3 dan Bukan B3 dari Kegiatan Usaha dan/atau Kegiatan Tertentu",
    tentang: "Pengelolaan Limbah B3",
    status: "berlaku",
    instansi: "Kementerian LHK",
  },
  {
    sourceId: "perpres-1-2024",
    jenis: "Perpres",
    nomor: "1",
    tahun: "2024",
    judul: "Peraturan Presiden tentang Strategi Nasional Pencegahan Korupsi",
    tentang: "Stranas PK",
    status: "berlaku",
    instansi: "Kementerian Sekretariat Negara",
  },
  {
    sourceId: "perpres-21-2021",
    jenis: "Perpres",
    nomor: "21",
    tahun: "2021",
    judul: "Peraturan Presiden tentang Sistem Perencanaan Pembangunan Nasional",
    tentang: "Sistem Perencanaan Pembangunan Nasional",
    status: "berlaku",
    instansi: "Kementerian PPN/Bappenas",
  },
  {
    sourceId: "permenaker-2-2022",
    jenis: "Permen",
    nomor: "2",
    tahun: "2022",
    judul: "Peraturan Menteri Ketenagakerjaan tentang Tata Cara Pelaksanaan Pemberian dan Pencabutan Izin Cipta Kerja",
    tentang: "Izin Cipta Kerja",
    status: "berlaku",
    instansi: "Kementerian Ketenagakerjaan",
  },
  {
    sourceId: "permen-5-2024",
    jenis: "Permen",
    nomor: "5",
    tahun: "2024",
    judul: "Peraturan Menteri Kesehatan tentang Standar Pelayanan Kefarmasian",
    tentang: "Standar Pelayanan Kefarmasian",
    status: "berlaku",
    instansi: "Kementerian Kesehatan",
  },
  {
    sourceId: "uu-40-2007",
    jenis: "UU",
    nomor: "40",
    tahun: "2007",
    judul: "Undang-Undang Perseroan Terbatas",
    tentang: "Perseroan Terbatas",
    status: "berlaku",
    instansi: "DPR RI",
  },
  {
    sourceId: "uu-23-2014",
    jenis: "UU",
    nomor: "23",
    tahun: "2014",
    judul: "Undang-Undang Pemerintahan Daerah",
    tentang: "Pemerintahan Daerah",
    status: "berlaku",
    instansi: "DPR RI",
  },
  {
    sourceId: "pp-27-2018",
    jenis: "PP",
    nomor: "27",
    tahun: "2018",
    judul: "PP tentang Izin Usaha Perikanan",
    tentang: "Izin Usaha Perikanan",
    status: "berlaku",
    instansi: "Kementerian KKP",
  },
  {
    sourceId: "perpres-10-2021",
    jenis: "Perpres",
    nomor: "10",
    tahun: "2021",
    judul: "Peraturan Presiden tentang Percepatan Program Pemulihan Ekonomi Nasional dalam Rangka Menghadapi Pandemi COVID-19",
    tentang: "PEN COVID-19",
    status: "berlaku",
    instansi: "Kementerian Koordinator Bidang Perekonomian",
  },
  {
    sourceId: "permen-20-2023",
    jenis: "Permen",
    nomor: "20",
    tahun: "2023",
    judul: "Peraturan Menteri Pendidikan tentang Organisasi dan Tata Kerja Kemendikbudristek",
    tentang: "Organisasi Kemendikbudristek",
    status: "berlaku",
    instansi: "Kementerian Pendidikan",
  },
  {
    sourceId: "uu-20-2003",
    jenis: "UU",
    nomor: "20",
    tahun: "2003",
    judul: "Undang-Undang Sistem Pendidikan Nasional",
    tentang: "Sistem Pendidikan Nasional",
    status: "berlaku",
    instansi: "DPR RI",
  },
  {
    sourceId: "uu-36-2014",
    jenis: "UU",
    nomor: "36",
    tahun: "2014",
    judul: "Undang-Undang tentang Warga Negara Indonesia",
    tentang: "Warga Negara Indonesia",
    status: "berlaku",
    instansi: "DPR RI",
  },
  {
    sourceId: "uu-2-2024",
    jenis: "UU",
    nomor: "2",
    tahun: "2024",
    judul: "Undang-Undang tentang PEMANDU JASA KONSTRUKSI",
    tentang: "Pemandu Jasa Konstruksi",
    status: "berlaku",
    instansi: "DPR RI",
  },
  {
    sourceId: "pp-96-2021",
    jenis: "PP",
    nomor: "96",
    tahun: "2021",
    judul: "PP tentang Pelaksanaan Undang-Undang Cipta Kerja di Bidang Ketenagakerjaan",
    tentang: "Pelaksanaan UU Cipta Kerja Bidang Ketenagakerjaan",
    status: "berlaku",
    instansi: "Kementerian Ketenagakerjaan",
  },
  {
    sourceId: "permenko-1-2024",
    jenis: "Permen",
    nomor: "1",
    tahun: "2024",
    judul: "Peraturan Menteri Koordinator Bidang Perekonomian tentang Pedoman Pelaksanaan Program Kredit Usaha Rakyat",
    tentang: "Program KUR",
    status: "berlaku",
    instansi: "Kementerian Koordinator Bidang Perekonomian",
  },
];

export async function syncSampleData(): Promise<SyncResult> {
  const startTime = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;

  for (const doc of SAMPLE_DOCUMENTS) {
    try {
      const existing = await prisma.legalDocument.findUnique({
        where: {
          source_sourceId: {
            source: "sample",
            sourceId: doc.sourceId,
          },
        },
      });

      if (existing) {
        await prisma.legalDocument.update({
          where: { id: existing.id },
          data: {
            judul: doc.judul,
            status: doc.status,
            syncedAt: new Date(),
          },
        });
        documentsUpdated++;
      } else {
        await prisma.legalDocument.create({
          data: {
            source: "sample",
            sourceId: doc.sourceId,
            jenis: doc.jenis,
            nomor: doc.nomor,
            tahun: doc.tahun,
            judul: doc.judul,
            tentang: doc.tentang,
            status: doc.status,
            instansi: doc.instansi,
            urlSumber: `https://peraturan.bpk.go.id`,
          },
        });
        documentsNew++;
      }
    } catch (err) {
      documentsFailed++;
    }
  }

  const duration = Date.now() - startTime;

  await prisma.syncLog.create({
    data: {
      source: "sample",
      status: "success",
      documentsNew,
      documentsUpdated,
      documentsFailed,
      duration,
      message: `Loaded ${SAMPLE_DOCUMENTS.length} sample documents (UU, PP, Perpres, Permen)`,
      finishedAt: new Date(),
    },
  });

  return {
    source: "sample",
    status: "success",
    documentsNew,
    documentsUpdated,
    documentsFailed,
    duration,
  };
}
