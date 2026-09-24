'use client';

import { useState, useEffect, useRef } from 'react';
import { getAnalisisSoalData, forceSubmitSesi, resetLoginSiswa, forceSubmitAllActiveInJadwal } from '@/app/actions/monitor';
import { createJadwalSusulanQuick } from '@/app/actions/jadwal';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Printer, 
  ArrowLeft, 
  RefreshCw, 
  Download, 
  BarChart2, 
  List, 
  Wifi, 
  WifiOff, 
  StopCircle, 
  PlayCircle,
  Database,
  FileSpreadsheet,
  ChevronDown,
  CalendarPlus,
  UserX,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { renderMathInHtml } from '@/app/utils/mathRenderer';

type Peserta = {
  siswaId: number;
  nis: string;
  nama: string;
  kelas: string;
  status: string;
  pelanggaran: number;
  waktuMulai?: Date;
  waktuSelesai?: Date;
  nilaiAkhir?: number | null;
  sesiId?: number | null;
  jumlahDijawab?: number;
  totalSoal?: number;
};

export default function MonitorClient({ initialData, jadwalId }: { initialData: any, jadwalId: number }) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'monitor' | 'analisis'>('monitor');
  const [analisisData, setAnalisisData] = useState<any>(null);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<number | null>(null);
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isDownloadingDb, setIsDownloadingDb] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [showSusulanModal, setShowSusulanModal] = useState(false);
  const [susulanNama, setSusulanNama] = useState('');
  const [susulanMulai, setSusulanMulai] = useState('');
  const [susulanSelesai, setSusulanSelesai] = useState('');
  const [selectedSusulanSiswaIds, setSelectedSusulanSiswaIds] = useState<number[]>([]);
  const [isCreatingSusulan, setIsCreatingSusulan] = useState(false);
  const [susulanError, setSusulanError] = useState('');
  const backupMenuRef = useRef<HTMLDivElement | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (backupMenuRef.current && !backupMenuRef.current.contains(event.target as Node)) {
        setShowBackupMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLive = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/monitor/jadwal/${jadwalId}`);
      const newData = await res.json();
      if (newData) {
        setData(newData);
        setLastUpdated(new Date());
      }
    } catch { /* ignore */ }
    setIsRefreshing(false);
  };

  // SSE connection with auto-reconnect on server-side stream recycling
  useEffect(() => {
    if (activeTab !== 'monitor') return;

    let retryCount = 0;

    const connectSSE = () => {
      const es = new EventSource(`/api/monitor/jadwal/${jadwalId}`);
      esRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        retryCount = 0;
      };

      es.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          setData(newData);
          setLastUpdated(new Date());
        } catch { /* ignore parse errors */ }
      };

      // Server sends "reconnect" event when recycling the stream (every ~4 min)
      es.addEventListener('reconnect', () => {
        es.close();
        connectSSE();
      });

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        const delay = Math.min(3000 * Math.pow(2, retryCount), 30000);
        retryCount++;
        setTimeout(connectSSE, delay);
      };
    };

    connectSSE();

    return () => {
      esRef.current?.close();
      setIsConnected(false);
    };
  }, [jadwalId, activeTab]);

  useEffect(() => {
    if (activeTab === 'analisis' && !analisisData) {
      setLoadingAnalisis(true);
      getAnalisisSoalData(jadwalId).then(res => {
        setAnalisisData(res);
        setLoadingAnalisis(false);
      });
    }
  }, [activeTab, jadwalId, analisisData]);

  const { jadwal, peserta } = data;

  const totalSiswa = peserta.length;
  const selesai = peserta.filter((p: Peserta) => p.status === 'SELESAI' || p.status === 'FINISHED').length;
  const sedangMengerjakan = peserta.filter((p: Peserta) => p.status === 'MENGERJAKAN' || p.status === 'ONGOING').length;
  const belumMulaiList = peserta.filter((p: Peserta) => p.status === 'BELUM MULAI');
  const belumMulai = belumMulaiList.length;

  const openSusulanModal = () => {
    setSusulanNama(`${jadwal.nama} (SUSULAN)`);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const durasiMs = new Date(jadwal.waktuSelesai).getTime() - new Date(jadwal.waktuMulai).getTime();
    const endTime = new Date(now.getTime() + (durasiMs > 0 ? durasiMs : 90 * 60000));

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setSusulanMulai(formatLocal(now));
    setSusulanSelesai(formatLocal(endTime));
    setSelectedSusulanSiswaIds(belumMulaiList.map((p: Peserta) => p.siswaId));
    setSusulanError('');
    setShowSusulanModal(true);
  };

  const toggleSelectSusulanSiswa = (id: number) => {
    setSelectedSusulanSiswaIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAllSusulan = () => {
    setSelectedSusulanSiswaIds(belumMulaiList.map((p: Peserta) => p.siswaId));
  };

  const deselectAllSusulan = () => {
    setSelectedSusulanSiswaIds([]);
  };

  const handleCreateSusulan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSusulanSiswaIds.length === 0) {
      setSusulanError('Pilih minimal 1 siswa untuk ujian susulan.');
      return;
    }
    if (!susulanNama.trim()) {
      setSusulanError('Nama jadwal susulan tidak boleh kosong.');
      return;
    }
    setIsCreatingSusulan(true);
    setSusulanError('');

    const res = await createJadwalSusulanQuick({
      parentJadwalId: jadwalId,
      nama: susulanNama.trim(),
      waktuMulaiStr: susulanMulai,
      waktuSelesaiStr: susulanSelesai,
      siswaIds: selectedSusulanSiswaIds
    });

    setIsCreatingSusulan(false);
    if (!res.success) {
      setSusulanError(res.message);
    } else {
      setShowSusulanModal(false);
      alert('Jadwal ujian susulan berhasil dibuat! Anda akan dialihkan ke jadwal tersebut.');
      window.location.href = `/admin/jadwal/${res.id}`;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(peserta.map((p: Peserta, index: number) => ({
      'No': index + 1,
      'NIS': p.nis,
      'Nama': p.nama,
      'Kelas': p.kelas,
      'Status': p.status,
      'Progres': p.status !== 'BELUM MULAI' ? `${p.jumlahDijawab || 0}/${p.totalSoal || 0}` : '-',
      'Pelanggaran (Kali)': p.pelanggaran,
      'Nilai Akhir': p.nilaiAkhir !== null ? p.nilaiAkhir : 'Belum Selesai'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai");
    XLSX.writeFile(wb, `Rekap_Nilai_${jadwal.nama}.xlsx`);
  };

  const handleDownloadBackupExcel = () => {
    setIsDownloadingExcel(true);
    setShowBackupMenu(false);
    const link = document.createElement('a');
    link.href = `/api/admin/backup/jadwal/${jadwalId}`;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingExcel(false), 2000);
  };

  const handleDownloadBackupDb = () => {
    setIsDownloadingDb(true);
    setShowBackupMenu(false);
    const link = document.createElement('a');
    link.href = '/api/admin/backup/database';
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingDb(false), 2000);
  };

  const handleForceSubmit = async (sesiId: number) => {
    
    setLoadingActionId(sesiId);
    const res = await forceSubmitSesi(sesiId);
    if (!res.success) {
      alert(res.message);
    } else {
      fetchLive(); // refresh local if SSE is slow
    }
    setLoadingActionId(null);
  };

  const handleResetSesi = async (sesiId: number) => {
    if (!confirm('Yakin ingin melanjutkan sesi siswa ini? Statusnya akan diubah menjadi Mengerjakan.')) return;
    
    setLoadingActionId(sesiId);
    const res = await resetLoginSiswa(sesiId);
    if (!res.success) {
      alert(res.message);
    } else {
      fetchLive();
    }
    setLoadingActionId(null);
  };

  const handleForceSubmitAll = async () => {
    if (!confirm(`Yakin ingin menyelesaikan paksa semua (${sedangMengerjakan}) siswa yang masih berstatus mengerjakan? Sesi mereka akan otomatis dinilai dari jawaban yang tersimpan.`)) return;
    
    setIsSubmittingAll(true);
    const res = await forceSubmitAllActiveInJadwal(jadwalId);
    if (!res.success) {
      alert(res.message);
    } else {
      await fetchLive();
    }
    setIsSubmittingAll(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Halaman (Sembunyikan saat di-print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/jadwal" className="text-gray-400 hover:text-white bg-crypto-card p-1.5 rounded-lg border border-crypto-border hover:bg-crypto-card-hover transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Live Monitor: {jadwal.nama}</h1>
          </div>
          <p className="text-gray-400 text-sm ml-9">
            Mata Pelajaran: <span className="font-semibold text-gray-300">{jadwal.bankSoal.mapel.nama}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* SSE Connection Badge */}
          {isConnected ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-crypto-success/10 text-crypto-success border border-crypto-success/20">
              <Wifi className="w-3.5 h-3.5" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crypto-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-crypto-success"></span>
              </span>
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <WifiOff className="w-3.5 h-3.5" />
              Terputus...
            </span>
          )}
          <button 
            onClick={fetchLive}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-crypto-card text-gray-300 rounded-lg border border-crypto-border hover:bg-crypto-card-hover text-sm font-medium transition print:hidden"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {sedangMengerjakan > 0 && (
            <button 
              onClick={handleForceSubmitAll}
              disabled={isSubmittingAll}
              className="flex items-center gap-2 px-3.5 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg border border-red-500/30 text-sm font-semibold transition print:hidden whitespace-nowrap shadow-sm disabled:opacity-50"
              title="Selesaikan paksa semua siswa yang sedang mengerjakan"
            >
              {isSubmittingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
              <span>Selesaikan Semua ({sedangMengerjakan})</span>
            </button>
          )}

          {/* Menu Tombol Backup Hasil Sesi */}
          <div className="relative print:hidden" ref={backupMenuRef}>
            <button 
              onClick={() => setShowBackupMenu(!showBackupMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-crypto-accent text-white rounded-lg hover:bg-crypto-accent-hover text-sm font-semibold transition shadow-md hover:neon-accent"
            >
              <Database className="w-4 h-4" />
              <span>Backup Hasil Sesi</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBackupMenu ? 'rotate-180' : ''}`} />
            </button>

            {showBackupMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-[#121218] border border-crypto-border rounded-xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-md">
                <button
                  onClick={handleDownloadBackupExcel}
                  disabled={isDownloadingExcel}
                  className="w-full flex items-start gap-3 p-2.5 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition text-left group"
                >
                  <FileSpreadsheet className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      {isDownloadingExcel ? 'Menyiapkan...' : 'Rekap Lengkap (.xlsx)'}
                    </p>
                    <p className="text-[11px] text-gray-400 font-normal mt-0.5">
                      Multi-sheet: Nilai, Lembar Jawaban per butir & Analisis
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleDownloadBackupDb}
                  disabled={isDownloadingDb}
                  className="w-full flex items-start gap-3 p-2.5 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition text-left group"
                >
                  <Database className="w-5 h-5 text-crypto-accent mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      {isDownloadingDb ? 'Mencadangkan...' : 'Snapshot Database (.db)'}
                    </p>
                    <p className="text-[11px] text-gray-400 font-normal mt-0.5">
                      Sinkronisasi WAL & Unduh Database Utuh
                    </p>
                  </div>
                </button>

                <div className="border-t border-crypto-border/60 my-1"></div>

                <button
                  onClick={() => { setShowBackupMenu(false); handleExportExcel(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg transition text-left"
                >
                  <Download className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[11px]">Ekspor Cepat Tabel Ini Saja (.xlsx)</span>
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-crypto-card border border-crypto-border text-gray-300 rounded-lg hover:bg-crypto-card-hover hover:text-white text-sm font-medium transition shadow-sm print:hidden"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap
          </button>
        </div>
      </div>

      {/* Tampilan Kop Surat Khusus Print (Disembunyikan di layar normal) */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase">REKAPITULASI HASIL UJIAN</h1>
        <h2 className="text-lg font-bold">SMK BANJAR ASRI</h2>
        <div className="mt-4 text-left grid grid-cols-2 text-sm gap-2">
          <div>
            <p><strong>Ujian:</strong> {jadwal.nama}</p>
            <p><strong>Mata Pelajaran:</strong> {jadwal.bankSoal.mapel.nama}</p>
          </div>
          <div className="text-right">
            <p><strong>Tanggal:</strong> {new Date(jadwal.waktuMulai).toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-crypto-card p-5 rounded-xl border border-crypto-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-500/10 text-gray-400 rounded-full border border-gray-500/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Peserta</p>
            <p className="text-2xl font-bold text-white">{totalSiswa}</p>
          </div>
        </div>
        
        <div className="bg-crypto-card p-5 rounded-xl border border-crypto-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 flex items-center justify-center shrink-0">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Sedang Mengerjakan</p>
            <p className="text-2xl font-bold text-blue-400">{sedangMengerjakan}</p>
          </div>
        </div>
        
        <div className="bg-crypto-card p-5 rounded-xl border border-crypto-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-crypto-success/10 text-crypto-success rounded-full border border-crypto-success/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Selesai</p>
            <p className="text-2xl font-bold text-crypto-success">{selesai}</p>
          </div>
        </div>

        <div className="bg-crypto-card p-5 rounded-xl border border-crypto-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 flex items-center justify-center shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Belum Mulai</p>
            <p className="text-2xl font-bold text-amber-400">{belumMulai}</p>
          </div>
        </div>
      </div>

      {/* Banner Rekomendasi Ujian Susulan jika ada siswa yang belum ikut */}
      {belumMulai > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-300 flex items-center gap-2">
                Terdapat {belumMulai} Siswa Belum Mengikuti Ujian
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Siswa ini berhalangan hadir (sakit/izin) atau belum memulai sesi. Anda dapat langsung menjadwalkan ujian susulan khusus untuk mereka menggunakan bank soal yang sama.
              </p>
            </div>
          </div>
          <button
            onClick={openSusulanModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            Jadwalkan Ujian Susulan ({belumMulai})
          </button>
        </div>
      )}

      {/* Tab Navigation & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-crypto-border print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'monitor' 
                ? 'border-crypto-accent text-crypto-accent' 
                : 'border-transparent text-gray-400 hover:text-white hover:border-crypto-border'
            }`}
          >
            <List className="w-4 h-4" />
            Daftar Peserta
          </button>
          <button
            onClick={() => setActiveTab('analisis')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'analisis' 
                ? 'border-crypto-accent text-crypto-accent' 
                : 'border-transparent text-gray-400 hover:text-white hover:border-crypto-border'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Analisis Butir Soal
          </button>
        </div>

        {activeTab === 'monitor' && sedangMengerjakan > 0 && (
          <button
            onClick={handleForceSubmitAll}
            disabled={isSubmittingAll}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg border border-red-500/30 text-xs font-semibold transition disabled:opacity-50 whitespace-nowrap self-start sm:self-auto sm:mb-2 shadow-sm"
            title="Selesaikan paksa semua siswa yang sedang mengerjakan"
          >
            {isSubmittingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <StopCircle className="w-3.5 h-3.5" />}
            <span>Selesaikan Semua ({sedangMengerjakan} Siswa)</span>
          </button>
        )}
      </div>

      {activeTab === 'monitor' && (
        <>
          {/* Tabel Peserta */}
      <div className="bg-crypto-card rounded-xl shadow-sm border border-crypto-border overflow-hidden print:shadow-none print:border-black print:rounded-none print:bg-white">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse print:text-sm">
            <thead>
              <tr className="bg-black/40 border-b border-crypto-border text-gray-300 text-sm print:bg-white print:border-black print:text-black">
                <th className="px-6 py-4 font-semibold print:border print:border-black print:py-2 print:px-2">No</th>
                <th className="px-6 py-4 font-semibold print:border print:border-black print:py-2 print:px-2">NIS</th>
                <th className="px-6 py-4 font-semibold print:border print:border-black print:py-2 print:px-2">Nama Siswa</th>
                <th className="px-6 py-4 font-semibold print:border print:border-black print:py-2 print:px-2">Kelas</th>
                <th className="px-6 py-4 font-semibold print:border print:border-black print:py-2 print:px-2">Status</th>
                <th className="px-6 py-4 font-semibold text-center print:border print:border-black print:py-2 print:px-2">Progres</th>
                <th className="px-6 py-4 font-semibold text-center print:hidden">Pelanggaran</th>
                <th className="px-6 py-4 font-semibold text-center print:border print:border-black print:py-2 print:px-2">Nilai Akhir</th>
                <th className="px-6 py-4 font-semibold text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border/50 print:divide-black">
              {peserta.map((p: Peserta, index: number) => (
                <tr key={p.siswaId} className="hover:bg-crypto-card-hover transition-colors print:hover:bg-white print:text-black">
                  <td className="px-6 py-4 text-sm text-gray-400 print:border print:border-black print:py-1 print:px-2">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono print:border print:border-black print:py-1 print:px-2">{p.nis}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white print:border print:border-black print:py-1 print:px-2">{p.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 print:border print:border-black print:py-1 print:px-2">{p.kelas}</td>
                  <td className="px-6 py-4 print:border print:border-black print:py-1 print:px-2">
                    <div className="flex justify-center">
                      {p.status === 'BELUM MULAI' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20 print:border-black print:bg-white">Belum Mulai</span>}
                      {(p.status === 'MENGERJAKAN' || p.status === 'ONGOING') && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse print:border-black print:bg-white print:animate-none">Mengerjakan</span>}
                      {(p.status === 'SELESAI' || p.status === 'FINISHED') && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-crypto-success/10 text-crypto-success border border-crypto-success/20 print:border-black print:bg-white">Selesai</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium print:border print:border-black print:py-1 print:px-2">
                    {p.status !== 'BELUM MULAI' ? (
                      <span className="text-gray-300 print:text-black">{p.jumlahDijawab || 0} / {p.totalSoal || 0}</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 print:hidden">
                    <div className="flex justify-center">
                      {p.pelanggaran > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          <AlertTriangle className="w-3 h-3" /> {p.pelanggaran}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center print:border print:border-black print:py-1 print:px-2">
                    {(p.status === 'SELESAI' || p.status === 'FINISHED') ? (
                      <span className="text-lg font-bold text-white print:text-base print:text-black">
                        {p.nilaiAkhir !== null && p.nilaiAkhir !== undefined ? Math.round(p.nilaiAkhir) : '-'}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 print:hidden">
                    <div className="flex justify-center gap-2">
                      {(p.status === 'MENGERJAKAN' || p.status === 'ONGOING') && p.sesiId && (
                        <button 
                          onClick={() => handleForceSubmit(p.sesiId!)}
                          disabled={loadingActionId === p.sesiId}
                          title="Paksa Selesai Ujian"
                          className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {loadingActionId === p.sesiId ? <RefreshCw className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
                        </button>
                      )}
                      {(p.status === 'SELESAI' || p.status === 'FINISHED') && p.sesiId && (
                        <button 
                          onClick={() => handleResetSesi(p.sesiId!)}
                          disabled={loadingActionId === p.sesiId}
                          title="Lanjutkan Sesi (Reset Status)"
                          className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg border border-blue-500/20 transition-colors disabled:opacity-50"
                        >
                          {loadingActionId === p.sesiId ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                        </button>
                      )}
                      {(!p.sesiId || p.status === 'BELUM MULAI') && (
                        <span className="text-gray-600 text-sm">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {peserta.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data peserta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {activeTab === 'analisis' && (
        <div className="bg-crypto-card rounded-xl shadow-sm border border-crypto-border p-6 print:shadow-none print:border-black print:rounded-none print:bg-white">
          <h2 className="text-xl font-bold text-white mb-4 print:hidden">Analisis Butir Soal</h2>
          
          {loadingAnalisis ? (
            <div className="py-12 flex justify-center items-center">
              <RefreshCw className="w-8 h-8 text-crypto-accent animate-spin" />
            </div>
          ) : !analisisData ? (
            <div className="py-12 text-center text-gray-500">Gagal memuat data analisis.</div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse print:text-sm">
                <thead>
                  <tr className="bg-black/40 border-b border-crypto-border text-gray-300 text-sm print:bg-white print:border-black print:text-black">
                    <th className="px-6 py-4 font-semibold w-16">No</th>
                    <th className="px-6 py-4 font-semibold">Potongan Pertanyaan</th>
                    <th className="px-6 py-4 font-semibold text-center text-green-400 print:text-green-600">Benar</th>
                    <th className="px-6 py-4 font-semibold text-center text-red-400 print:text-red-600">Salah</th>
                    <th className="px-6 py-4 font-semibold text-center text-gray-400 print:text-gray-500">Kosong</th>
                    <th className="px-6 py-4 font-semibold text-center text-blue-400 print:text-blue-600">% Benar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-crypto-border/50 print:divide-black">
                  {analisisData.analisis.map((item: any, index: number) => {
                    const snippet = item.pertanyaan.replace(/<[^>]+>/g, '').substring(0, 80) + '...';
                    
                    return (
                      <tr key={item.id} className="hover:bg-crypto-card-hover transition-colors print:hover:bg-white">
                        <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-300 print:text-gray-700">
                          <div className="font-medium" dangerouslySetInnerHTML={{ __html: renderMathInHtml(snippet) }} />
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-bold text-green-400 print:text-green-600">{item.benar}</td>
                        <td className="px-6 py-4 text-sm text-center font-bold text-red-400 print:text-red-600">{item.salah}</td>
                        <td className="px-6 py-4 text-sm text-center font-bold text-gray-400 print:text-gray-500">{item.kosong}</td>
                        <td className="px-6 py-4 text-sm text-center font-bold text-blue-400 print:text-blue-600">
                          {item.persentase.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400">
                <p><strong>Catatan:</strong> Analisis hanya dihitung berdasarkan peserta yang sudah mulai / sedang mengerjakan / selesai ujian (total {analisisData.analisis[0]?.total || 0} respons).</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Tanda Tangan Print */}
      <div className="hidden print:flex justify-end mt-12 text-sm">
        <div className="text-center">
          <p>Banjar Asri, {new Date().toLocaleDateString('id-ID')}</p>
          <p className="mb-16">Pengawas / Proktor</p>
          <p className="font-bold underline">_________________________</p>
        </div>
      </div>

      {/* Modal Jadwalkan Ujian Susulan */}
      {showSusulanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:hidden animate-in fade-in duration-200">
          <div className="bg-[#121218] border border-crypto-border rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-crypto-border/80 flex items-start justify-between gap-4 bg-black/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Jadwalkan Ujian Susulan</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Membuat sesi ujian susulan dengan bank soal yang sama khusus untuk siswa berhalangan hadir.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSusulanModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSusulan} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
              {susulanError && (
                <div className="p-3.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium">
                  {susulanError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Nama Jadwal Susulan
                </label>
                <input
                  type="text"
                  required
                  value={susulanNama}
                  onChange={(e) => setSusulanNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-crypto-border rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                  placeholder="Contoh: PTS Ganjil - Susulan"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                    Waktu Mulai
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={susulanMulai}
                    onChange={(e) => setSusulanMulai(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/50 border border-crypto-border rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                    Waktu Selesai
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={susulanSelesai}
                    onChange={(e) => setSusulanSelesai(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/50 border border-crypto-border rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Daftar Siswa Peserta Susulan */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Peserta Susulan ({selectedSusulanSiswaIds.length} dari {belumMulaiList.length} dipilih)
                  </label>
                  <div className="space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllSusulan}
                      className="text-amber-400 hover:text-amber-300 font-medium"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      type="button"
                      onClick={deselectAllSusulan}
                      className="text-gray-400 hover:text-gray-300 font-medium"
                    >
                      Batal
                    </button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto border border-crypto-border rounded-xl bg-black/40 divide-y divide-crypto-border/40 custom-scrollbar">
                  {belumMulaiList.map((p: Peserta) => {
                    const isSelected = selectedSusulanSiswaIds.includes(p.siswaId);
                    return (
                      <div
                        key={p.siswaId}
                        onClick={() => toggleSelectSusulanSiswa(p.siswaId)}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition select-none ${
                          isSelected ? 'bg-amber-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="shrink-0 text-amber-400">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <div className="truncate">
                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-amber-200' : 'text-white'}`}>
                              {p.nama}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono">
                              NIS: {p.nis}
                            </p>
                          </div>
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {p.kelas}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {belumMulaiList.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-500">
                      Semua siswa sudah mengikuti ujian ini.
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Catatan: Siswa lain di kelas yang sudah menyelesaikan ujian tidak akan terdaftar dan tidak bisa mengakses sesi susulan ini.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-crypto-border/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSusulanModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSusulan || selectedSusulanSiswaIds.length === 0}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-gray-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CalendarPlus className="w-4 h-4" />
                  {isCreatingSusulan ? 'Menyimpan...' : `Buat Jadwal Susulan (${selectedSusulanSiswaIds.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
