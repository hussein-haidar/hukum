"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function KalkulatorPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("pesangon");

  const tabs = [
    { id: "pesangon", key: "kalkulator.tab.pesangon" },
    { id: "lembur", key: "kalkulator.tab.lembur" },
    { id: "cicilan", key: "kalkulator.tab.cicilan" },
    { id: "denda", key: "kalkulator.tab.denda" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2 dark:text-gray-100">{t("kalkulator.title")}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{t("kalkulator.subtitle")}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {t(tab.key)}
          </button>
        ))}
      </div>

      {activeTab === "pesangon" && <PesangonCalc />}
      {activeTab === "lembur" && <LemburCalc />}
      {activeTab === "cicilan" && <CicilanCalc />}
      {activeTab === "denda" && <DendaCalc />}
    </div>
  );
}

function PesangonCalc() {
  const { t } = useI18n();
  const [gaji, setGaji] = useState("");
  const [masaKerja, setMasaKerja] = useState("");
  const [alasan, setAlasan] = useState("phk-biasa");
  const [hasil, setHasil] = useState<number | null>(null);

  const hitung = () => {
    const g = parseFloat(gaji) || 0;
    const mk = parseInt(masaKerja) || 0;
    let multiplier = mk < 1 ? 1 : mk < 2 ? 1.5 : mk < 3 ? 2 : mk < 4 ? 2.5 : mk < 5 ? 3 : mk < 6 ? 3.5 : mk < 7 ? 4 : mk < 8 ? 4.5 : mk < 9 ? 5 : mk < 10 ? 5.5 : 6;
    if (alasan === "phk-mendadak") multiplier += 1;
    const pesangon = g * multiplier;
    const penghargaan = mk < 5 ? 0 : (mk - 4) * g * 0.1;
    const penggantian = g * 0.75;
    setHasil(pesangon + penghargaan + penggantian);
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-semibold dark:text-gray-100">{t("kalkulator.pesangon.title")}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("kalkulator.pesangon.sub")}</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("kalkulator.gaji")}</label>
        <input type="number" value={gaji} onChange={(e) => setGaji(e.target.value)} className="input-field" placeholder="Contoh: 5000000" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("kalkulator.masaKerja")}</label>
        <input type="number" value={masaKerja} onChange={(e) => setMasaKerja(e.target.value)} className="input-field" placeholder="Contoh: 5" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("kalkulator.alasanPhk")}</label>
        <select value={alasan} onChange={(e) => setAlasan(e.target.value)} className="input-field">
          <option value="phk-biasa">{t("kalkulator.phkBiasa")}</option>
          <option value="phk-mendadak">{t("kalkulator.phkMendadak")}</option>
        </select>
      </div>
      <button onClick={hitung} className="btn-primary">{t("kalkulator.hitung")}</button>
      {hasil !== null && (
        <div className="bg-purple-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">{t("kalkulator.estimasiPesangon")}</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">Rp {hasil.toLocaleString("id-ID")}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("kalkulator.pesangon.note")}</p>
        </div>
      )}
    </div>
  );
}

function LemburCalc() {
  const { t } = useI18n();
  const [gaji, setGaji] = useState("");
  const [jamLembur, setJamLembur] = useState("");
  const [hasil, setHasil] = useState<number | null>(null);

  const hitung = () => {
    const g = parseFloat(gaji) || 0;
    const j = parseInt(jamLembur) || 0;
    const upahPerJam = g / 173;
    const total = j * upahPerJam * 1.5;
    setHasil(total);
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-semibold dark:text-gray-100">{t("kalkulator.lembur.title")}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("kalkulator.lembur.sub")}</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("kalkulator.gaji")}</label>
        <input type="number" value={gaji} onChange={(e) => setGaji(e.target.value)} className="input-field" placeholder="Contoh: 5000000" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("kalkulator.jamLembur")}</label>
        <input type="number" value={jamLembur} onChange={(e) => setJamLembur(e.target.value)} className="input-field" placeholder="Contoh: 10" />
      </div>
      <button onClick={hitung} className="btn-primary">{t("kalkulator.hitung")}</button>
      {hasil !== null && (
        <div className="bg-purple-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">{t("kalkulator.totalLembur")}</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">Rp {hasil.toLocaleString("id-ID")}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("kalkulator.lembur.note")}</p>
        </div>
      )}
    </div>
  );
}

function CicilanCalc() {
  const { t } = useI18n();
  const [pinjaman, setPinjaman] = useState("");
  const [sukuBunga, setSukuBunga] = useState("");
  const [tenor, setTenor] = useState("");
  const [hasil, setHasil] = useState<{angsuran: number; total: number; bunga: number} | null>(null);

  const hitung = () => {
    const p = parseFloat(pinjaman) || 0;
    const r = (parseFloat(sukuBunga) || 0) / 100 / 12;
    const n = parseInt(tenor) || 0;
    if (p === 0 || r === 0 || n === 0) return;
    const angsuran = p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = angsuran * n;
    const bunga = total - p;
    setHasil({ angsuran, total, bunga });
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-semibold dark:text-gray-100">{t("kalkulator.cicilan.title")}</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("kalkulator.pinjaman")}</label>
        <input type="number" value={pinjaman} onChange={(e) => setPinjaman(e.target.value)} className="input-field" placeholder="Contoh: 100000000" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("kalkulator.bunga")}</label>
        <input type="number" value={sukuBunga} onChange={(e) => setSukuBunga(e.target.value)} className="input-field" placeholder="Contoh: 10" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("kalkulator.tenor")}</label>
        <input type="number" value={tenor} onChange={(e) => setTenor(e.target.value)} className="input-field" placeholder="Contoh: 60" />
      </div>
      <button onClick={hitung} className="btn-primary">{t("kalkulator.hitung")}</button>
      {hasil && (
        <div className="bg-purple-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">{t("kalkulator.angsuran")}</span><span className="font-bold dark:text-gray-100">Rp {hasil.angsuran.toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">{t("kalkulator.totalBayar")}</span><span className="font-bold dark:text-gray-100">Rp {hasil.total.toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">{t("kalkulator.totalBunga")}</span><span className="font-bold text-red-600 dark:text-red-400">Rp {hasil.bunga.toLocaleString("id-ID")}</span></div>
        </div>
      )}
    </div>
  );
}

function DendaCalc() {
  const { t } = useI18n();
  const [jenisDenda, setJenisDenda] = useState("tidak-hadir");
  const [keterangan, setKeterangan] = useState("");
  const [hasil, setHasil] = useState<{denda: number; deskripsi: string} | null>(null);

  const hitung = () => {
    const dendaMap: Record<string, { denda: number; deskripsi: string }> = {
      "tidak-hadir": { denda: 250000, deskripsi: "Denda tidak hadir di sidang (Pasal 174 KUHAP)" },
      "telat-lapor": { denda: 500000, deskripsi: "Denda terlambat melapor (Pasal 14 KUHP)" },
      "stnk-mat": { denda: 250000, deskripsi: "Denda STNK mati/denda pajak kendaraan" },
      "sim-mat": { denda: 500000, deskripsi: "Denda SIM expired/masa berlaku habis" },
      "tidak-pakai-helm": { denda: 250000, deskripsi: "Denda tidak menggunakan helm SNI" },
      "knalpot-racing": { denda: 500000, deskripsi: "Denda knalpot tidak sesuai standar" },
    };
    setHasil(dendaMap[jenisDenda] || null);
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-semibold dark:text-gray-100">{t("kalkulator.denda.title")}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("kalkulator.denda.sub")}</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("kalkulator.jenisDenda")}</label>
        <select value={jenisDenda} onChange={(e) => setJenisDenda(e.target.value)} className="input-field">
          <option value="tidak-hadir">Tidak Hadir di Sidang</option>
          <option value="telat-lapor">Terlambat Melapor</option>
          <option value="stnk-mat">STNK Mati/Pajak Kendaraan</option>
          <option value="sim-mat">SIM Masa Berlaku Habis</option>
          <option value="tidak-pakai-helm">Tidak Pakai Helm SNI</option>
          <option value="knalpot-racing">Knalpot Racing/Modifikasi</option>
        </select>
      </div>
      <button onClick={hitung} className="btn-primary">{t("kalkulator.cekDenda")}</button>
      {hasil && (
        <div className="bg-purple-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{hasil.deskripsi}</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">Rp {hasil.denda.toLocaleString("id-ID")}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("kalkulator.denda.note")}</p>
        </div>
      )}
    </div>
  );
}
