'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Printer, 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  Settings2, 
  ChevronLeft,
  Building2,
  GraduationCap,
  Sparkles,
  Users,
  Calendar,
  Layers
} from 'lucide-react';
import KartuPesertaItem, { SiswaKartuData } from './KartuPesertaItem';
import KartuJadwalItem from './KartuJadwalItem';

interface KelasOption {
  id: number;
  nama: string;
}

interface RuanganOption {
  id: number;
  nama: string;
}

interface PengaturanData {
  namaSekolah: string;
  namaSistem: string;
  logoUrl?: string | null;
  tahunAjaran: string;
  semester: string;
  alamat?: string | null;
}

interface KartuUjianClientProps {
  siswas: SiswaKartuData[];
  kelass: KelasOption[];
  ruangans: RuanganOption[];
  pengaturan: PengaturanData;
}

export default function KartuUjianClient({
  siswas,
  kelass,
  ruangans,
  pengaturan,
}: KartuUjianClientProps) {
  // Filter States
  const [selectedKelasId, setSelectedKelasId] = useState<string>('all');
  const [selectedRuanganId, setSelectedRuanganId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mode Cetak: 'duplex' (Bolak-balik Depan & Belakang), 'front' (Depan saja), 'back' (Belakang saja)
  const [printSideMode, setPrintSideMode] = useState<'duplex' | 'front' | 'back'>('duplex');

  // Ukuran Kertas: 'Legal' (8.5 x 14 in / 216 x 356 mm), 'F4' (Folio 330 x 215 mm), atau 'A4' (297 x 210 mm)
  const [paperSize, setPaperSize] = useState<'Legal' | 'F4' | 'A4'>('Legal');

  // Skala Kartu: 'safe' (138 x 88 mm - Pas & Anti-Terpotong), 'medium' (148 x 94 mm)
  const [cardScale, setCardScale] = useState<'safe' | 'medium'>('safe');

  // Orientasi Kertas: 'landscape' (default) atau 'portrait'
  const [pageOrientation, setPageOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Setting Cetak States
  const [titimangsaKota, setTitimangsaKota] = useState<string>('Cimaung');
  const [tanggalTitimangsa, setTanggalTitimangsa] = useState<string>(() => {
    const d = new Date();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  });
  const [namaKepalaSekolah, setNamaKepalaSekolah] = useState<string>('Hendri Purnama, S.Pd.I');
  const [passwordMode, setPasswordMode] = useState<string>('real');
  const [customPassword, setCustomPassword] = useState<string>('');

  // Selected Student IDs for printing
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    return new Set(siswas.map((s) => s.id));
  });

  // Filtered Students
  const filteredSiswas = useMemo(() => {
    return siswas.filter((s) => {
      const matchKelas =
        selectedKelasId === 'all' || s.kelas?.id.toString() === selectedKelasId;
      const matchRuangan =
        selectedRuanganId === 'all' ||
        (selectedRuanganId === 'none'
          ? !s.ruangan
          : s.ruangan?.id.toString() === selectedRuanganId);
      const matchSearch =
        !searchQuery ||
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKelas && matchRuangan && matchSearch;
    });
  }, [siswas, selectedKelasId, selectedRuanganId, searchQuery]);

  // Students to print (only selected from filtered list)
  const studentsToPrint = useMemo(() => {
    return filteredSiswas.filter((s) => selectedIds.has(s.id));
  }, [filteredSiswas, selectedIds]);

  // Group into chunks of 4 cards
  const studentChunks = useMemo(() => {
    const chunks: SiswaKartuData[][] = [];
    for (let i = 0; i < studentsToPrint.length; i += 4) {
      chunks.push(studentsToPrint.slice(i, i + 4));
    }
    return chunks;
  }, [studentsToPrint]);

  // Select all / Deselect all
  const handleToggleSelectAll = () => {
    if (studentsToPrint.length === filteredSiswas.length && filteredSiswas.length > 0) {
      const next = new Set(selectedIds);
      filteredSiswas.forEach((s) => next.delete(s.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredSiswas.forEach((s) => next.add(s.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSingle = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Determine password string to pass
  const computedPasswordDisplay = useMemo(() => {
    if (passwordMode === 'real') return 'REAL';
    if (passwordMode === 'nis') return 'NIS';
    if (passwordMode === 'monitor') return '[Tampil di Monitor]';
    if (passwordMode === 'proktor') return 'Hubungi Proktor';
    if (passwordMode === 'custom') return customPassword || 'Sesuai Akun';
    return 'Sesuai Akun Siswa';
  }, [passwordMode, customPassword]);

  const handlePrint = () => {
    window.print();
  };

  // Total printable physical A4 sheets
  const totalPhysicalSheets = studentChunks.length;

  return (
    <div className="space-y-6">
      {/* PRINT-ONLY CSS RULES */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${
              paperSize === 'Legal'
                ? pageOrientation === 'landscape'
                  ? 'legal landscape'
                  : 'legal portrait'
                : paperSize === 'F4'
                ? pageOrientation === 'landscape'
                  ? '330mm 215mm'
                  : '215mm 330mm'
                : pageOrientation === 'landscape'
                ? '297mm 210mm'
                : '210mm 297mm'
            };
            margin: 8mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Sembunyikan seluruh shell admin */
          header, aside, .no-print, nav {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Lembar Cetak: 4 kartu per lembar (2 kolom x 2 baris) */
          .print-a4-sheet {
            display: grid !important;
            grid-template-columns: ${
              pageOrientation === 'landscape'
                ? cardScale === 'safe'
                  ? '138mm 138mm'
                  : '148mm 148mm'
                : '1fr 1fr'
            } !important;
            grid-template-rows: ${
              pageOrientation === 'landscape'
                ? cardScale === 'safe'
                  ? '88mm 88mm'
                  : '94mm 94mm'
                : cardScale === 'safe'
                ? '138mm 138mm'
                : '148mm 148mm'
            } !important;
            gap: 4mm !important;
            width: ${
              pageOrientation === 'landscape'
                ? cardScale === 'safe'
                  ? '280mm'
                  : '300mm'
                : '100%'
            } !important;
            height: ${
              pageOrientation === 'landscape'
                ? cardScale === 'safe'
                  ? '180mm'
                  : '192mm'
                : cardScale === 'safe'
                ? '280mm'
                : '300mm'
            } !important;
            max-height: ${
              pageOrientation === 'landscape'
                ? cardScale === 'safe'
                  ? '180mm'
                  : '192mm'
                : cardScale === 'safe'
                ? '280mm'
                : '300mm'
            } !important;
            page-break-after: always !important;
            break-after: page !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }
          .print-card-box {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            width: ${
              pageOrientation === 'landscape'
                ? cardScale === 'safe'
                  ? '138mm'
                  : '148mm'
                : '100%'
            } !important;
            height: ${
              pageOrientation === 'landscape'
                ? cardScale === 'safe'
                  ? '88mm'
                  : '94mm'
                : cardScale === 'safe'
                ? '138mm'
                : '148mm'
            } !important;
            max-width: ${
              pageOrientation === 'landscape'
                ? cardScale === 'safe'
                  ? '138mm'
                  : '148mm'
                : '100%'
            } !important;
            max-height: ${
              pageOrientation === 'landscape'
                ? cardScale === 'safe'
                  ? '88mm'
                  : '94mm'
                : cardScale === 'safe'
                ? '138mm'
                : '148mm'
            } !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      {/* HEADER & ACTIONS (NO PRINT) */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-crypto-card border border-crypto-border rounded-2xl p-6 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/master/siswa"
              className="text-gray-400 hover:text-white transition flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Data Siswa
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-crypto-accent font-medium text-sm">Cetak Kartu Ujian</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
            <Printer className="w-7 h-7 text-crypto-accent" />
            Cetak Kartu Peserta Ujian (CBT) Bolak-Balik
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Format Kertas {
              paperSize === 'Legal'
                ? 'Legal (8½ × 14 in / 21.6 × 35.6 cm)'
                : paperSize === 'F4'
                ? 'F4 / Folio (33 × 21.5 cm)'
                : 'A4 (29.7 × 21 cm)'
            }: Sisi depan memuat identitas & akun siswa, sisi belakang memuat jadwal ujian CBT dengan presisi 1:1.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePrint}
            disabled={studentsToPrint.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            <Printer className="w-5 h-5" />
            Cetak Sekarang ({studentsToPrint.length} Siswa / {totalPhysicalSheets} Lembar {paperSize})
          </button>
        </div>
      </div>

      {/* FILTER & PENGATURAN KARTU TOOLBAR (NO PRINT) */}
      <div className="no-print bg-crypto-card border border-crypto-border rounded-2xl p-5 space-y-4 shadow-lg">
        {/* TABS MODE CETAK & ORIENTASI */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-crypto-border pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Layers className="w-4 h-4 text-crypto-accent" /> Sisi Kertas:
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-crypto-border rounded-xl">
              <button
                onClick={() => setPrintSideMode('duplex')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  printSideMode === 'duplex'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Bolak-Balik (Duplex)
              </button>
              <button
                onClick={() => setPrintSideMode('front')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  printSideMode === 'front'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Hanya Sisi Depan
              </button>
              <button
                onClick={() => setPrintSideMode('back')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  printSideMode === 'back'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Hanya Sisi Belakang
              </button>
            </div>
          </div>

          {/* PILIHAN UKURAN KERTAS & ORIENTASI */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Ukuran Kertas */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                Ukuran Kertas:
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-crypto-border rounded-xl">
                <button
                  onClick={() => setPaperSize('Legal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    paperSize === 'Legal'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📄 Legal (8½ × 14 in)
                </button>
                <button
                  onClick={() => setPaperSize('F4')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    paperSize === 'F4'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📄 F4 / Folio (33 × 21.5 cm)
                </button>
                <button
                  onClick={() => setPaperSize('A4')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    paperSize === 'A4'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📄 A4 (29.7 × 21 cm)
                </button>
              </div>
            </div>

            {/* Orientasi */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                Orientasi:
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-crypto-border rounded-xl">
                <button
                  onClick={() => setPageOrientation('landscape')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    pageOrientation === 'landscape'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🖥️ Landscape
                </button>
                <button
                  onClick={() => setPageOrientation('portrait')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    pageOrientation === 'portrait'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📄 Portrait
                </button>
              </div>
            </div>

            {/* Skala Ukuran Kartu */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                Ukuran Kartu:
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-crypto-border rounded-xl">
                <button
                  onClick={() => setCardScale('safe')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    cardScale === 'safe'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🛡️ Pas & Aman (138 × 88 mm)
                </button>
                <button
                  onClick={() => setCardScale('medium')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    cardScale === 'medium'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📐 Sedang (148 × 94 mm)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter Kelas */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-crypto-accent" /> Pilih Kelas
            </label>
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
              className="w-full bg-crypto-bg border border-crypto-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-crypto-accent transition"
            >
              <option value="all">Semua Kelas ({kelass.length} Kelas)</option>
              {kelass.map((k) => (
                <option key={k.id} value={k.id.toString()}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Ruangan */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-crypto-accent" /> Pilih Ruangan
            </label>
            <select
              value={selectedRuanganId}
              onChange={(e) => setSelectedRuanganId(e.target.value)}
              className="w-full bg-crypto-bg border border-crypto-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-crypto-accent transition"
            >
              <option value="all">Semua Ruangan</option>
              {ruangans.map((r) => (
                <option key={r.id} value={r.id.toString()}>
                  {r.nama}
                </option>
              ))}
              <option value="none">Belum Masuk Ruangan</option>
            </select>
          </div>

          {/* Pencarian Nama / NIS */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-crypto-accent" /> Cari Nama / NIS
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik NIS atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-crypto-bg border border-crypto-border rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-crypto-accent transition"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Keterangan Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-crypto-accent" /> Format Password Depan
            </label>
            <select
              value={passwordMode}
              onChange={(e) => setPasswordMode(e.target.value)}
              className="w-full bg-crypto-bg border border-crypto-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-crypto-accent transition"
            >
              <option value="real">🔑 Password Asli Akun Siswa (Opsi A)</option>
              <option value="nis">Sama dengan NIS Siswa</option>
              <option value="default">Teks: Sesuai Akun Siswa</option>
              <option value="monitor">[Tampil di Monitor]</option>
              <option value="proktor">Hubungi Proktor</option>
              <option value="custom">Teks Kustom...</option>
            </select>
          </div>
        </div>

        {/* Baris Kustomisasi Titimangsa & Kepala Sekolah */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-crypto-border/50">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Titimangsa Kota
            </label>
            <input
              type="text"
              value={titimangsaKota}
              onChange={(e) => setTitimangsaKota(e.target.value)}
              placeholder="Contoh: Cimaung"
              className="w-full bg-crypto-bg border border-crypto-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-crypto-accent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Tanggal Titimangsa
            </label>
            <input
              type="text"
              value={tanggalTitimangsa}
              onChange={(e) => setTanggalTitimangsa(e.target.value)}
              placeholder="Contoh: 14 September 2026"
              className="w-full bg-crypto-bg border border-crypto-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-crypto-accent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Nama Kepala Sekolah
            </label>
            <input
              type="text"
              value={namaKepalaSekolah}
              onChange={(e) => setNamaKepalaSekolah(e.target.value)}
              placeholder="Contoh: Hendri Purnama, S.Pd.I"
              className="w-full bg-crypto-bg border border-crypto-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-crypto-accent transition"
            />
          </div>
        </div>

        {/* STATUS SELEKSI SISWA */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-crypto-border text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-crypto-bg hover:bg-white/5 border border-crypto-border rounded-lg text-gray-300 font-medium transition cursor-pointer"
            >
              {studentsToPrint.length === filteredSiswas.length && filteredSiswas.length > 0 ? (
                <>
                  <CheckSquare className="w-4 h-4 text-crypto-accent" />
                  Batal Pilih Semua
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-gray-400" />
                  Pilih Semua Siswa Terfilter ({filteredSiswas.length})
                </>
              )}
            </button>
            <span className="text-gray-400">
              <span className="text-white font-bold">{studentsToPrint.length}</span> dari{' '}
              <span className="text-white font-bold">{filteredSiswas.length}</span> siswa terfilter dipilih untuk dicetak.
            </span>
          </div>

          <div className="text-crypto-accent font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {printSideMode === 'duplex' ? (
              <span>
                Format Bolak-Balik: {totalPhysicalSheets} Lembar Kertas {paperSize} ({totalPhysicalSheets * 2} Halaman Cetak)
              </span>
            ) : (
              <span>
                Format 1 Sisi: {totalPhysicalSheets} Lembar Kertas {paperSize}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* HASIL KOSONG */}
      {filteredSiswas.length === 0 && (
        <div className="no-print bg-crypto-card border border-crypto-border rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Tidak Ada Data Siswa</h3>
          <p className="text-gray-400 text-sm">
            Tidak ditemukan siswa yang cocok dengan filter atau kata kunci pencarian Anda.
          </p>
        </div>
      )}

      {/* PREVIEW CONTAINER PER LEMBAR CETAK */}
      {studentChunks.map((chunk, chunkIdx) => {
        // Pad chunk to 4 cards for duplex geometric alignment
        // Front layout: [Card 0, Card 1]
        //               [Card 2, Card 3]
        // Back layout (flipped horizontally): [Card 1, Card 0]
        //                                     [Card 3, Card 2]
        const paddedChunk = [chunk[0] || null, chunk[1] || null, chunk[2] || null, chunk[3] || null];
        const backChunk = [paddedChunk[1], paddedChunk[0], paddedChunk[3], paddedChunk[2]];

        return (
          <div key={chunkIdx} className="space-y-4">
            {/* SISI DEPAN (KARTU IDENTITAS SISWA) */}
            {(printSideMode === 'duplex' || printSideMode === 'front') && (
              <div className="space-y-2">
                <div className="no-print flex items-center justify-between px-3 py-1.5 bg-blue-950/60 border border-blue-800/60 rounded-xl text-xs text-blue-200">
                  <span className="font-bold flex items-center gap-2">
                    📄 Lembar {paperSize} ke-{chunkIdx + 1} • SISI DEPAN (Kartu Identitas Siswa)
                  </span>
                  <span className="text-blue-300/80">
                    {chunk.length} Kartu Terisi • 4 Kartu per Lembar {paperSize}
                  </span>
                </div>

                <div className="print-a4-sheet grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-dashed border-slate-700/80 print:bg-white print:border-none print:p-0 print:rounded-none">
                  {paddedChunk.map((siswa, idx) => (
                    <div key={siswa ? siswa.id : `empty-front-${idx}`} className="print-card-box relative group h-[320px] w-full">
                      {siswa ? (
                        <>
                          {/* CHECKBOX INDIVIDUAL DI MONITOR (NO PRINT) */}
                          <div className="no-print absolute top-2 right-2 z-10">
                            <button
                              onClick={() => handleToggleSingle(siswa.id)}
                              className="p-1 bg-white/90 hover:bg-white rounded-md shadow text-slate-800 transition cursor-pointer"
                              title={selectedIds.has(siswa.id) ? 'Hapus dari cetak' : 'Pilih untuk cetak'}
                            >
                              {selectedIds.has(siswa.id) ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>

                          <KartuPesertaItem
                            siswa={siswa}
                            namaSekolah={pengaturan.namaSekolah}
                            logoUrl={pengaturan.logoUrl}
                            tahunAjaran={pengaturan.tahunAjaran}
                            semester={pengaturan.semester}
                            titimangsaKota={titimangsaKota}
                            tanggalTitimangsa={tanggalTitimangsa}
                            namaKepalaSekolah={namaKepalaSekolah}
                            passwordDisplay={computedPasswordDisplay}
                          />
                        </>
                      ) : (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl h-full flex items-center justify-center text-slate-300 text-xs italic">
                          ( Ruang Kosong Kartu )
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SISI BELAKANG (JADWAL UJIAN RESMI) */}
            {(printSideMode === 'duplex' || printSideMode === 'back') && (
              <div className="space-y-2">
                <div className="no-print flex items-center justify-between px-3 py-1.5 bg-indigo-950/60 border border-indigo-800/60 rounded-xl text-xs text-indigo-200">
                  <span className="font-bold flex items-center gap-2">
                    🔄 Lembar {paperSize} ke-{chunkIdx + 1} • SISI BELAKANG (Jadwal Pelaksanaan Ujian CBT)
                  </span>
                  <span className="text-indigo-300/80">
                    Posisi diselaraskan presisi 1:1 untuk cetak bolak-balik (Duplex)
                  </span>
                </div>

                <div className="print-a4-sheet grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-dashed border-slate-700/80 print:bg-white print:border-none print:p-0 print:rounded-none">
                  {backChunk.map((siswa, idx) => (
                    <div key={siswa ? `back-${siswa.id}` : `empty-back-${idx}`} className="print-card-box relative h-[320px] w-full">
                      {siswa ? (
                        <KartuJadwalItem
                          siswa={siswa}
                          namaSekolah={pengaturan.namaSekolah}
                          logoUrl={pengaturan.logoUrl}
                          tahunAjaran={pengaturan.tahunAjaran}
                          semester={pengaturan.semester}
                          titimangsaKota={titimangsaKota}
                          tanggalTitimangsa={tanggalTitimangsa}
                        />
                      ) : (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl h-full flex items-center justify-center text-slate-300 text-xs italic">
                          ( Ruang Kosong Jadwal )
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
