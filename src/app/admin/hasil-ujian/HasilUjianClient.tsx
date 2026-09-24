'use client';

import { useState, useEffect, useRef } from 'react';
import { getHasilUjianDetail } from '@/app/actions/hasilUjian';
import * as XLSX from 'xlsx';
import {
  BarChart3, Users, TrendingUp, TrendingDown,
  Award, Printer, Download, ChevronDown,
  ArrowLeft, CheckCircle2, XCircle, BookOpen,
  Loader2, GraduationCap, Trophy, Search, Check
} from 'lucide-react';

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

function AnimatedCounter({ value, decimals = 0, suffix = '', prefix = '' }: {
  value: number; decimals?: number; suffix?: string; prefix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const end = value;
    const duration = 1500;
    const startTime = performance.now();
    let rafId: number;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(eased * end);
      if (progress < 1) rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>;
}

function CircularProgress({ percentage, size = 140, strokeWidth = 10, label }: {
  percentage: number; size?: number; strokeWidth?: number; label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference);
    }, 200);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  const getColor = () => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#22c55e';
    if (percentage >= 40) return '#eab308';
    return '#ef4444';
  };
  const color = getColor();

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-[1500ms] ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">
          <AnimatedCounter value={percentage} decimals={1} suffix="%" />
        </span>
        {label && <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</span>}
      </div>
    </div>
  );
}

function DistributionChart({ distribusi }: { distribusi: { range: string; count: number; color: string }[] }) {
  const maxCount = Math.max(...distribusi.map(d => d.count), 1);
  const total = distribusi.reduce((sum, d) => sum + d.count, 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-end justify-center gap-4 sm:gap-6" style={{ height: '220px' }}>
      {distribusi.map((d, i) => {
        const heightPct = mounted ? Math.max((d.count / maxCount) * 100, d.count > 0 ? 5 : 2) : 0;
        const pctOfTotal = total > 0 ? ((d.count / total) * 100).toFixed(0) : '0';

        return (
          <div key={i} className="flex-1 max-w-[100px] flex flex-col items-center gap-1.5 h-full justify-end">
            <div className="text-center">
              <span className="text-lg font-bold text-white block">{d.count}</span>
              <span className="text-[10px] text-gray-500">({pctOfTotal}%)</span>
            </div>
            <div
              className="w-full rounded-t-xl transition-all duration-1000 ease-out relative group cursor-default"
              style={{
                height: `${heightPct}%`,
                backgroundColor: d.color,
                boxShadow: `0 0 20px ${d.color}30`,
                transformOrigin: 'bottom',
              }}
            >
              <div className="absolute inset-0 rounded-t-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">{d.range}</span>
          </div>
        );
      })}
    </div>
  );
}

function JadwalDropdown({
  jadwals,
  selectedId,
  onSelect,
}: {
  jadwals: any[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedJadwal = jadwals.find(j => j.id === selectedId);

  const filteredJadwals = jadwals.filter(j =>
    j.nama.toLowerCase().includes(search.toLowerCase()) ||
    j.mapel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-crypto-card border border-crypto-border text-white text-sm rounded-xl px-4 py-2.5 cursor-pointer hover:bg-crypto-card-hover transition-all focus:outline-none focus:ring-2 focus:ring-crypto-accent/50 max-w-[280px] sm:max-w-xs md:max-w-sm truncate shadow-sm"
      >
        <span className="truncate font-medium">
          {selectedJadwal ? `${selectedJadwal.nama} — ${selectedJadwal.mapel}` : '📊 Semua Jadwal Ujian'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-crypto-accent' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl jadwal-dropdown-menu border shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
          <div className="p-2.5 border-b border-crypto-border/50">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari jadwal / mapel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/20 jadwal-search-input border border-crypto-border/50 rounded-lg outline-none focus:border-crypto-accent text-white placeholder-gray-500 transition-colors"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors jadwal-dropdown-item ${
                selectedId === null ? 'bg-crypto-accent/20 text-crypto-accent font-semibold active' : 'text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📊</span>
                <div>
                  <p className="font-semibold text-sm">Semua Jadwal Ujian</p>
                  <p className="text-[11px] text-gray-400">Tinjauan Agregat Seluruh Sekolah</p>
                </div>
              </div>
              {selectedId === null && <Check className="w-4 h-4 text-crypto-accent shrink-0" />}
            </button>

            {filteredJadwals.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                Tidak ada jadwal ujian yang cocok
              </div>
            ) : (
              filteredJadwals.map((j) => {
                const isSelected = selectedId === j.id;
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      onSelect(j.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors jadwal-dropdown-item ${
                      isSelected ? 'bg-crypto-accent/20 text-crypto-accent font-semibold active' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-sm truncate text-white">{j.nama}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                        <span className="text-crypto-accent font-medium">{j.mapel}</span>
                        <span>&bull;</span>
                        <span className="truncate">{j.kelas?.join(', ')}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-crypto-accent shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RankingTableTingkat({
  title,
  tingkatLabel,
  badgeColor,
  pesertaList,
  kkm,
}: {
  title: string;
  tingkatLabel: string;
  badgeColor: string;
  pesertaList: any[];
  kkm: number;
}) {
  return (
    <div className="bg-crypto-card rounded-2xl border border-crypto-border overflow-hidden print:shadow-none print:border-black print:rounded-none print:bg-white flex flex-col shadow-sm">
      <div className="px-6 py-4 border-b border-crypto-border flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-crypto-accent/15 border border-crypto-accent/30 flex items-center justify-center text-crypto-accent font-bold text-sm">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{title}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                {tingkatLabel}
              </span>
            </div>
            <p className="text-xs text-gray-500">Nilai rata-rata dari seluruh ujian yang diselesaikan</p>
          </div>
        </div>
        <span className="text-xs text-gray-400 font-medium">Top 10</span>
      </div>

      <div className="hidden print:block p-2 border-b border-black font-bold text-xs uppercase bg-gray-100">
        Top 10 Peringkat {tingkatLabel} (Berdasarkan Nilai Rata-Rata Ujian)
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse print:text-sm">
          <thead>
            <tr className="bg-black/40 border-b border-crypto-border text-xs print:bg-white print:border-black print:text-black">
              <th className="px-4 py-3 font-semibold text-gray-400 w-12 text-center print:border print:border-black">No</th>
              <th className="px-4 py-3 font-semibold text-gray-400 print:border print:border-black">NIS &amp; Nama Siswa</th>
              <th className="px-4 py-3 font-semibold text-gray-400 print:border print:border-black">Kelas</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-center print:border print:border-black">Ujian</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-center print:border print:border-black">Rata-Rata</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-center print:border print:border-black">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-crypto-border/50 print:divide-black text-sm">
            {pesertaList.map((p: any) => (
              <tr key={`${p.nis}-${p.peringkat}`} className="hover:bg-crypto-card-hover transition-colors print:hover:bg-white print:text-black">
                <td className="px-4 py-2.5 text-center print:border print:border-black">
                  {p.peringkat <= 3 ? (
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      p.peringkat === 1 ? 'bg-yellow-500/25 text-yellow-300 border border-yellow-500/40 shadow-sm shadow-yellow-500/30' :
                      p.peringkat === 2 ? 'bg-slate-300/25 text-slate-200 border border-slate-300/40' :
                      'bg-amber-700/25 text-amber-400 border border-amber-700/40'
                    }`}>
                      {p.peringkat}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs font-medium">{p.peringkat}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 print:border print:border-black">
                  <p className="font-semibold text-white text-xs sm:text-sm line-clamp-1">{p.nama}</p>
                  <p className="text-[11px] text-gray-400 font-mono">{p.nis}</p>
                </td>
                <td className="px-4 py-2.5 print:border print:border-black">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 font-medium">
                    {p.kelas}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center print:border print:border-black">
                  <span className="text-xs text-gray-400 font-medium">{p.jumlahUjian} mapel</span>
                </td>
                <td className="px-4 py-2.5 text-center print:border print:border-black">
                  <span className={`text-base font-bold print:text-black ${
                    p.rataRata >= 90 ? 'text-emerald-400' :
                    p.rataRata >= kkm ? 'text-green-400' :
                    p.rataRata >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {p.rataRata.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center print:border print:border-black">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    p.status === 'LULUS'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 border-red-500/30'
                  }`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {pesertaList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                  Belum ada data untuk tingkat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function HasilUjianClient({ overviewData }: { overviewData: any }) {
  const [selectedJadwalId, setSelectedJadwalId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAllRanking, setShowAllRanking] = useState(false);

  const { pengaturan, jadwalSummary, kkm } = overviewData;

  // Fetch detail data ketika user memilih jadwal tertentu
  useEffect(() => {
    if (selectedJadwalId) {
      setLoadingDetail(true);
      setShowAllRanking(false);
      getHasilUjianDetail(selectedJadwalId).then(res => {
        setDetailData(res);
        setLoadingDetail(false);
      });
    } else {
      setDetailData(null);
      setShowAllRanking(false);
    }
  }, [selectedJadwalId]);

  const isOverview = selectedJadwalId === null;
  const data = isOverview ? overviewData : detailData;

  // ── Export Excel ──
  const handleExportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    if (isOverview) {
      if (overviewData.topRankingX && overviewData.topRankingX.length > 0) {
        const wsRankingX = XLSX.utils.json_to_sheet(overviewData.topRankingX.map((p: any) => ({
          'Peringkat': p.peringkat,
          'NIS': p.nis,
          'Nama': p.nama,
          'Tingkat': 'X',
          'Kelas': p.kelas,
          'Jumlah Ujian': p.jumlahUjian,
          'Nilai Rata-Rata': p.rataRata,
          'Total Nilai': p.totalNilai,
          'Status': p.status,
        })));
        XLSX.utils.book_append_sheet(wb, wsRankingX, 'Top 10 Tingkat X');
      }

      if (overviewData.topRankingXI && overviewData.topRankingXI.length > 0) {
        const wsRankingXI = XLSX.utils.json_to_sheet(overviewData.topRankingXI.map((p: any) => ({
          'Peringkat': p.peringkat,
          'NIS': p.nis,
          'Nama': p.nama,
          'Tingkat': 'XI',
          'Kelas': p.kelas,
          'Jumlah Ujian': p.jumlahUjian,
          'Nilai Rata-Rata': p.rataRata,
          'Total Nilai': p.totalNilai,
          'Status': p.status,
        })));
        XLSX.utils.book_append_sheet(wb, wsRankingXI, 'Top 10 Tingkat XI');
      }

      const wsJadwal = XLSX.utils.json_to_sheet(jadwalSummary.map((j: any) => ({
        'Nama Ujian': j.nama,
        'Mata Pelajaran': j.mapel,
        'Kelas': j.kelas.join(', '),
        'Peserta': j.totalPeserta,
        'Rata-Rata': j.rataRata.toFixed(1),
        '% Lulus': j.persentaseLulus.toFixed(1) + '%',
      })));
      XLSX.utils.book_append_sheet(wb, wsJadwal, 'Per Jadwal');

      XLSX.writeFile(wb, 'Hasil_Ujian_Keseluruhan.xlsx');
    } else {
      const wsPeserta = XLSX.utils.json_to_sheet(data.peserta.map((p: any) => ({
        'Peringkat': p.peringkat, 'NIS': p.nis, 'Nama': p.nama,
        'Kelas': p.kelas, 'Nilai': p.nilaiAkhir, 'Status': p.status,
        'Pelanggaran': p.pelanggaran,
      })));
      XLSX.utils.book_append_sheet(wb, wsPeserta, 'Daftar Nilai');

      // Statistik sheet
      const wsStats = XLSX.utils.json_to_sheet([{
        'Total Peserta': data.totalSelesai,
        'Mean': data.mean.toFixed(1),
        'Median': data.median.toFixed(1),
        'Modus': data.modus,
        'Std. Deviasi': data.stdDev.toFixed(2),
        'Nilai Tertinggi': data.nilaiTertinggi,
        'Nilai Terendah': data.nilaiTerendah,
        'Lulus': data.jumlahLulus,
        'Tidak Lulus': data.jumlahTidakLulus,
        '% Lulus': data.persentaseLulus.toFixed(1) + '%',
      }]);
      XLSX.utils.book_append_sheet(wb, wsStats, 'Statistik');

      XLSX.writeFile(wb, `Hasil_Ujian_${data.jadwal.nama}.xlsx`);
    }
  };

  const handlePrint = () => window.print();

  // ── Loading State ──
  if (!data && loadingDetail) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-crypto-accent animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Memuat data hasil ujian...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">

      {/* ═══════════════════════════════════════════════════════
          PRINT: KOP SURAT
          ═══════════════════════════════════════════════════════ */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase">LAPORAN HASIL &amp; EVALUASI UJIAN</h1>
        <h2 className="text-lg font-bold">{pengaturan?.namaSekolah || 'Nama Sekolah'}</h2>
        <div className="mt-4 text-left grid grid-cols-2 text-sm gap-2">
          <div>
            <p><strong>Tahun Ajaran:</strong> {pengaturan?.tahunAjaran || '2024/2025'}</p>
            <p><strong>Semester:</strong> {pengaturan?.semester || 'Ganjil'}</p>
            {!isOverview && data.jadwal && (
              <>
                <p><strong>Ujian:</strong> {data.jadwal.nama}</p>
                <p><strong>Mata Pelajaran:</strong> {data.jadwal.mapel}</p>
              </>
            )}
          </div>
          <div className="text-right">
            <p><strong>KKM:</strong> {kkm}</p>
            <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* PRINT: Ringkasan Statistik */}
      <div className="hidden print:block mb-4">
        <table className="w-full border-collapse text-sm mb-4">
          <tbody>
            <tr>
              <td className="border border-black p-2 font-semibold w-1/4">{isOverview ? 'Total Siswa' : 'Total Peserta'}</td>
              <td className="border border-black p-2">
                {isOverview ? `${data.totalSiswa} Siswa (${data.totalSesiUjian} Sesi Ujian)` : `${data.totalSelesai} Siswa`}
              </td>
              <td className="border border-black p-2 font-semibold w-1/4">Rata-Rata</td>
              <td className="border border-black p-2">{(isOverview ? data.rataRata : data.mean).toFixed(1)}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-semibold">Lulus (≥{kkm})</td>
              <td className="border border-black p-2">{data.jumlahLulus} ({data.persentaseLulus.toFixed(1)}%)</td>
              <td className="border border-black p-2 font-semibold">Tidak Lulus</td>
              <td className="border border-black p-2">{data.jumlahTidakLulus}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-semibold">Nilai Tertinggi</td>
              <td className="border border-black p-2">{data.nilaiTertinggi}</td>
              <td className="border border-black p-2 font-semibold">Nilai Terendah</td>
              <td className="border border-black p-2">{data.nilaiTerendah}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════
          HEADER + FILTER + ACTIONS
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            {!isOverview && (
              <button
                onClick={() => setSelectedJadwalId(null)}
                className="text-gray-400 hover:text-white bg-crypto-card p-1.5 rounded-lg border border-crypto-border hover:bg-crypto-card-hover transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-crypto-accent" />
                Hasil &amp; Evaluasi Ujian
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {pengaturan?.namaSekolah || 'Sekolah'} &bull; T.A {pengaturan?.tahunAjaran || '2024/2025'} Semester {pengaturan?.semester || 'Ganjil'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter Dropdown */}
          <JadwalDropdown
            jadwals={jadwalSummary}
            selectedId={selectedJadwalId}
            onSelect={(id) => setSelectedJadwalId(id)}
          />

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-crypto-accent/15 border border-crypto-accent/25 text-crypto-accent rounded-xl hover:bg-crypto-accent hover:text-white text-sm font-medium transition-all"
          >
            <Printer className="w-4 h-4" /> Cetak
          </button>
        </div>
      </div>

      {/* Loading overlay saat ganti jadwal */}
      {loadingDetail && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-crypto-accent animate-spin" />
          <span className="ml-3 text-gray-400">Memuat detail jadwal...</span>
        </div>
      )}

      {!loadingDetail && (
        <>
          {/* ═══════════════════════════════════════════════════════
              HERO STAT CARDS
              ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            {/* Total Siswa / Peserta */}
            <div className="bg-crypto-card rounded-2xl border border-crypto-border p-5 hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  {isOverview ? 'Total Siswa' : 'Total Peserta'}
                </span>
              </div>
              <p className="text-4xl font-bold text-white">
                <AnimatedCounter value={isOverview ? data.totalSiswa : data.totalSelesai} />
              </p>
              {isOverview ? (
                <p className="text-xs text-gray-400 mt-1">
                  <span className="text-crypto-accent font-semibold">{data.totalSesiUjian?.toLocaleString('id-ID')}</span> total sesi ujian diselesaikan
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">dari {data.totalPeserta} terdaftar</p>
              )}
            </div>

            {/* Rata-Rata */}
            <div className="bg-crypto-card rounded-2xl border border-crypto-border p-5 hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Rata-Rata</span>
              </div>
              <p className="text-4xl font-bold text-white">
                <AnimatedCounter value={isOverview ? data.rataRata : data.mean} decimals={1} />
              </p>
              <p className="text-xs text-gray-500 mt-1">KKM: {kkm}</p>
            </div>

            {/* Persentase Lulus */}
            <div className="bg-crypto-card rounded-2xl border border-crypto-border p-5 hover:-translate-y-1 transition-all flex items-center gap-4">
              <CircularProgress percentage={data.persentaseLulus} size={100} strokeWidth={8} label="Lulus" />
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                  Kelulusan {isOverview ? '(Sesi)' : ''}
                </p>
                <p className="text-lg font-bold text-emerald-400">
                  {data.jumlahLulus} <span className="text-xs text-gray-500 font-normal">{isOverview ? 'sesi lulus' : 'lulus'}</span>
                </p>
                <p className="text-lg font-bold text-red-400">
                  {data.jumlahTidakLulus} <span className="text-xs text-gray-500 font-normal">{isOverview ? 'sesi belum' : 'belum'}</span>
                </p>
              </div>
            </div>

            {/* Nilai Tertinggi / Terendah */}
            <div className="bg-crypto-card rounded-2xl border border-crypto-border p-5 hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-600 to-amber-400 flex items-center justify-center shadow-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Rentang Nilai</span>
              </div>
              <div className="flex items-baseline gap-2">
                <div>
                  <p className="text-3xl font-bold text-emerald-400"><AnimatedCounter value={data.nilaiTertinggi} /></p>
                  <p className="text-[10px] text-gray-500 uppercase">Tertinggi</p>
                </div>
                <span className="text-gray-600 text-lg">/</span>
                <div>
                  <p className="text-3xl font-bold text-red-400"><AnimatedCounter value={data.nilaiTerendah} /></p>
                  <p className="text-[10px] text-gray-500 uppercase">Terendah</p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              DISTRIBUSI NILAI (BAR CHART)
              ═══════════════════════════════════════════════════════ */}
          <div className="bg-crypto-card rounded-2xl border border-crypto-border p-6 print:hidden">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-crypto-accent" />
              Distribusi Nilai
            </h3>
            <p className="text-xs text-gray-500 mb-6">Sebaran nilai siswa berdasarkan rentang skor</p>
            <DistributionChart distribusi={data.distribusi} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              DETAIL MODE: Info Jadwal + Statistik Lanjutan
              ═══════════════════════════════════════════════════════ */}
          {!isOverview && data && (
            <>
              {/* Info Jadwal */}
              <div className="bg-gradient-to-r from-crypto-accent/10 to-transparent rounded-2xl border border-crypto-accent/20 p-5 print:hidden">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Ujian</p>
                    <p className="text-lg font-bold text-white">{data.jadwal.nama}</p>
                  </div>
                  <div className="w-px h-10 bg-crypto-border hidden sm:block" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Mata Pelajaran</p>
                    <p className="text-lg font-bold text-crypto-accent">{data.jadwal.mapel}</p>
                  </div>
                  <div className="w-px h-10 bg-crypto-border hidden sm:block" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Kelas</p>
                    <p className="text-sm font-medium text-gray-300">{data.jadwal.kelas.join(', ')}</p>
                  </div>
                  <div className="w-px h-10 bg-crypto-border hidden sm:block" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Jumlah Soal</p>
                    <p className="text-lg font-bold text-white">{data.jadwal.totalSoal}</p>
                  </div>
                </div>
              </div>

              {/* Statistik Lanjutan: Mean, Median, Modus, Std Dev */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                {[
                  { label: 'Mean', value: data.mean.toFixed(1) },
                  { label: 'Median', value: data.median.toFixed(1) },
                  { label: 'Modus', value: data.modus },
                  { label: 'Std. Deviasi', value: data.stdDev.toFixed(2) },
                ].map((stat) => (
                  <div key={stat.label} className="bg-crypto-card rounded-xl border border-crypto-border p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Perbandingan Per Kelas */}
              {data.perKelas && data.perKelas.length > 1 && (
                <div className="bg-crypto-card rounded-2xl border border-crypto-border p-6 print:hidden">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-crypto-accent" />
                    Perbandingan Per Kelas
                  </h3>
                  <div className="space-y-4">
                    {data.perKelas.map((k: any) => (
                      <div key={k.id} className="flex items-center gap-4">
                        <div className="w-28 text-sm font-semibold text-gray-300 shrink-0">{k.nama}</div>
                        <div className="flex-1 bg-black/30 rounded-full h-8 overflow-hidden relative">
                          <div
                            className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-1000 ease-out"
                            style={{
                              width: `${Math.max(k.rataRata, 3)}%`,
                              background: `linear-gradient(90deg, ${k.rataRata >= kkm ? '#10B981' : k.rataRata >= 60 ? '#eab308' : '#ef4444'}, ${k.rataRata >= kkm ? '#059669' : k.rataRata >= 60 ? '#ca8a04' : '#dc2626'})`,
                            }}
                          >
                            <span className="text-xs font-bold text-white drop-shadow">{k.rataRata.toFixed(1)}</span>
                          </div>
                          {/* Garis KKM */}
                          <div
                            className="absolute top-0 bottom-0 border-l-2 border-dashed border-white/30"
                            style={{ left: `${kkm}%` }}
                          />
                        </div>
                        <div className="w-20 text-right shrink-0">
                          <span className="text-xs text-gray-400">{k.totalPeserta} siswa</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <div className="w-4 border-t-2 border-dashed border-white/30" />
                      <span>Garis putus-putus = KKM ({kkm})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Analisis Butir Soal: Termudah & Tersulit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                {/* Soal Termudah */}
                <div className="bg-crypto-card rounded-2xl border border-crypto-border p-6">
                  <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    Soal Termudah
                  </h3>
                  <div className="space-y-2">
                    {data.soalTermudah?.map((s: any, i: number) => {
                      const snippet = s.pertanyaan.replace(/<[^>]+>/g, '').substring(0, 60);
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20">
                          <span className="text-xs font-bold text-emerald-400 w-6">#{i + 1}</span>
                          <span className="text-xs text-gray-400 flex-1 truncate">{snippet}...</span>
                          <span className="text-xs font-bold text-emerald-400 shrink-0">{s.persentaseBenar.toFixed(0)}% benar</span>
                        </div>
                      );
                    })}
                    {(!data.soalTermudah || data.soalTermudah.length === 0) && (
                      <p className="text-xs text-gray-500 text-center py-4">Tidak ada data</p>
                    )}
                  </div>
                </div>

                {/* Soal Tersulit */}
                <div className="bg-crypto-card rounded-2xl border border-crypto-border p-6">
                  <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <XCircle className="w-4 h-4" />
                    Soal Tersulit
                  </h3>
                  <div className="space-y-2">
                    {data.soalTersulit?.map((s: any, i: number) => {
                      const snippet = s.pertanyaan.replace(/<[^>]+>/g, '').substring(0, 60);
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20">
                          <span className="text-xs font-bold text-red-400 w-6">#{i + 1}</span>
                          <span className="text-xs text-gray-400 flex-1 truncate">{snippet}...</span>
                          <span className="text-xs font-bold text-red-400 shrink-0">{s.persentaseBenar.toFixed(0)}% benar</span>
                        </div>
                      );
                    })}
                    {(!data.soalTersulit || data.soalTersulit.length === 0) && (
                      <p className="text-xs text-gray-500 text-center py-4">Tidak ada data</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════
              OVERVIEW MODE: Grid Performa Per Jadwal
              ═══════════════════════════════════════════════════════ */}
          {isOverview && jadwalSummary.length > 0 && (
            <div className="print:hidden">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-crypto-accent" />
                Performa Per Jadwal Ujian
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {jadwalSummary.map((j: any) => (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJadwalId(j.id)}
                    className="bg-crypto-card rounded-2xl border border-crypto-border p-5 text-left hover:bg-crypto-card-hover hover:-translate-y-1 transition-all hover:neon-accent group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-white group-hover:text-crypto-accent transition-colors">{j.nama}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{j.mapel}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-crypto-accent/10 text-crypto-accent border border-crypto-accent/20">
                        {j.totalPeserta} siswa
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400">Rata-rata: <strong className="text-white">{j.rataRata.toFixed(1)}</strong></span>
                        <span className={`font-bold ${j.persentaseLulus >= 80 ? 'text-emerald-400' : j.persentaseLulus >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {j.persentaseLulus.toFixed(0)}% Lulus
                        </span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-2.5">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${j.persentaseLulus}%`,
                            background: j.persentaseLulus >= 80
                              ? 'linear-gradient(90deg, #10B981, #059669)'
                              : j.persentaseLulus >= 60
                                ? 'linear-gradient(90deg, #eab308, #ca8a04)'
                                : 'linear-gradient(90deg, #ef4444, #dc2626)'
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" /> {j.nilaiTertinggi}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-red-500" /> {j.nilaiTerendah}
                      </span>
                      <span className="ml-auto text-gray-600 truncate">
                        {j.kelas.join(', ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state: belum ada jadwal dengan hasil */}
          {isOverview && jadwalSummary.length === 0 && (
            <div className="bg-crypto-card rounded-2xl border border-crypto-border p-12 text-center print:hidden">
              <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Belum ada ujian yang selesai dikerjakan siswa.</p>
              <p className="text-gray-500 text-sm mt-1">Data akan muncul setelah siswa menyelesaikan ujian.</p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              RANKING TABLES
              ═══════════════════════════════════════════════════════ */}
          {isOverview ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between print:hidden">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Award className="w-6 h-6 text-crypto-accent" />
                    Peringkat 10 Besar Berdasarkan Nilai Rata-Rata
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Penilaian ranking siswa per tingkat berdasarkan akumulasi nilai rata-rata dari seluruh ujian yang diselesaikan
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:block print:space-y-6">
                <RankingTableTingkat
                  title="Top 10 Terbaik"
                  tingkatLabel="Tingkat X"
                  badgeColor="bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  pesertaList={data.topRankingX || []}
                  kkm={kkm}
                />
                <RankingTableTingkat
                  title="Top 10 Terbaik"
                  tingkatLabel="Tingkat XI"
                  badgeColor="bg-purple-500/15 text-purple-400 border border-purple-500/30"
                  pesertaList={data.topRankingXI || []}
                  kkm={kkm}
                />
              </div>
            </div>
          ) : (
            <div className="bg-crypto-card rounded-2xl border border-crypto-border overflow-hidden print:shadow-none print:border-black print:rounded-none print:bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-crypto-border flex items-center justify-between print:hidden">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-crypto-accent" />
                  Peringkat Peserta Ujian — {data.jadwal?.nama}
                </h3>
                {data.peserta && data.peserta.length > 10 && (
                  <button
                    onClick={() => setShowAllRanking(!showAllRanking)}
                    className="text-xs text-crypto-accent hover:text-crypto-accent-hover font-semibold transition-colors"
                  >
                    {showAllRanking ? 'Tampilkan Top 10' : `Tampilkan Semua (${data.peserta.length})`}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse print:text-sm">
                  <thead>
                    <tr className="bg-black/40 border-b border-crypto-border text-sm print:bg-white print:border-black print:text-black">
                      <th className="px-6 py-3 font-semibold text-gray-400 print:border print:border-black print:py-2 print:px-2">No</th>
                      <th className="px-6 py-3 font-semibold text-gray-400 print:border print:border-black print:py-2 print:px-2">NIS</th>
                      <th className="px-6 py-3 font-semibold text-gray-400 print:border print:border-black print:py-2 print:px-2">Nama Siswa</th>
                      <th className="px-6 py-3 font-semibold text-gray-400 print:border print:border-black print:py-2 print:px-2">Kelas</th>
                      <th className="px-6 py-3 font-semibold text-gray-400 text-center print:border print:border-black print:py-2 print:px-2">Nilai</th>
                      <th className="px-6 py-3 font-semibold text-gray-400 text-center print:border print:border-black print:py-2 print:px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-crypto-border/50 print:divide-black">
                    {(showAllRanking ? (data.peserta || []) : (data.peserta || []).slice(0, 10)).map((p: any) => (
                      <tr key={`${p.nis}-${p.peringkat}`} className="hover:bg-crypto-card-hover transition-colors print:hover:bg-white print:text-black">
                        <td className="px-6 py-3 text-sm print:border print:border-black print:py-1 print:px-2">
                          {p.peringkat <= 3 ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              p.peringkat === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              p.peringkat === 2 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                              'bg-amber-700/20 text-amber-500 border border-amber-700/30'
                            }`}>
                              {p.peringkat}
                            </span>
                          ) : (
                            <span className="text-gray-500">{p.peringkat}</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-400 font-mono print:border print:border-black print:py-1 print:px-2">{p.nis}</td>
                        <td className="px-6 py-3 text-sm font-medium text-white print:border print:border-black print:py-1 print:px-2">{p.nama}</td>
                        <td className="px-6 py-3 text-sm text-gray-400 print:border print:border-black print:py-1 print:px-2">{p.kelas}</td>
                        <td className="px-6 py-3 text-center print:border print:border-black print:py-1 print:px-2">
                          <span className={`text-lg font-bold print:text-black print:text-base ${
                            p.nilaiAkhir >= 90 ? 'text-emerald-400' :
                            p.nilaiAkhir >= kkm ? 'text-green-400' :
                            p.nilaiAkhir >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {p.nilaiAkhir}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center print:border print:border-black print:py-1 print:px-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            p.status === 'LULUS'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(data.peserta || []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          Belum ada data peserta untuk jadwal ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              PRINT: Tanda Tangan
              ═══════════════════════════════════════════════════════ */}
          <div className="hidden print:flex justify-between items-end mt-12 text-sm">
            <div>
              <p className="text-xs text-gray-500">Dicetak dari {pengaturan?.namaSistem || 'UPIN'} pada {new Date().toLocaleDateString('id-ID')}</p>
            </div>
            <div className="text-center">
              <p>............, {new Date().toLocaleDateString('id-ID')}</p>
              <p className="mb-16">Kepala Sekolah</p>
              <p className="font-bold underline">_________________________</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
