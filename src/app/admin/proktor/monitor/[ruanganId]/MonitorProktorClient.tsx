'use client';

import { useState, useEffect, useRef } from 'react';
import { forceSubmitSesi, resetLoginSiswa, hapusUlangSiswa, refreshToken } from '@/app/actions/monitor';
import { RefreshCcw, AlertTriangle, ArrowLeft, Printer, StopCircle, RotateCcw, Trash2, KeyRound, Wifi, WifiOff, Download } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function MonitorProktorClient({ ruanganId, proctorId, initialData }: { ruanganId: number, proctorId: number, initialData: any }) {
  const [data, setData] = useState(initialData);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // SSE connection with auto-reconnect on server-side stream recycling
  useEffect(() => {
    let retryCount = 0;

    const connectSSE = () => {
      const es = new EventSource(`/api/monitor/ruangan/${ruanganId}`);
      esRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        retryCount = 0; // Reset backoff on successful connection
      };

      es.onmessage = (event) => {
        try {
          const freshData = JSON.parse(event.data);
          setData(freshData);
          setLastUpdate(new Date());
        } catch { /* ignore */ }
      };

      // Server sends "reconnect" event when recycling the stream (every ~4 min)
      // Reconnect immediately and silently — no disconnect flash
      es.addEventListener('reconnect', () => {
        es.close();
        connectSSE();
      });

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        // Exponential backoff: 3s, 6s, 12s... capped at 30s
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
  }, [ruanganId]);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/monitor/ruangan/${ruanganId}`);
      const freshData = await res.json();
      if (freshData) {
        setData(freshData);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Gagal refresh data', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForceSubmit = async (sesiId: number) => {
    if (!confirm('Apakah Anda yakin ingin MENGAKHIRI PAKSA ujian siswa ini?')) return;
    const res = await forceSubmitSesi(sesiId);
    if (res.success) {
      fetchData();
    } else {
      alert(res.message);
    }
  };

  // Reset Login: siswa bisa re-login, JAWABAN TETAP ADA
  const handleResetLogin = async (sesiId: number) => {
    if (!confirm('Reset Login: siswa akan bisa masuk kembali. Jawaban yang sudah diisi TETAP tersimpan dan bisa dilanjutkan.\n\nLanjutkan?')) return;
    const res = await resetLoginSiswa(sesiId);
    if (res.success) {
      fetchData();
    } else {
      alert(res.message);
    }
  };

  // Hapus & Mulai Ulang: sesi + semua jawaban dihapus
  const handleHapusUlang = async (sesiId: number) => {
    if (!confirm('PERINGATAN!\nSemua jawaban siswa ini akan DIHAPUS PERMANEN dan siswa harus mengerjakan dari awal.\n\nApakah Anda yakin?')) return;
    const res = await hapusUlangSiswa(sesiId);
    if (res.success) {
      fetchData();
    } else {
      alert(res.message);
    }
  };

  const handleRefreshToken = async () => {
    if (!confirm('Apakah Anda yakin ingin mengganti token ruangan ini? Siswa yang belum login harus menggunakan token yang baru.')) return;
    setIsRefreshingToken(true);
    const res = await refreshToken(ruanganId);
    if (res.success && res.token) {
      // Optimistic update state lokal langsung (0ms delay pada UI)
      setData((prev: any) => ({
        ...prev,
        ruangan: {
          ...prev.ruangan,
          token: res.token
        }
      }));
      fetchData();
    } else if (res.message) {
      alert(res.message);
    }
    setIsRefreshingToken(false);
  };

  const { pengaturan, ruangan, jadwals, peserta } = data;

  const totalPeserta = peserta.length;
  const sedangMengerjakan = peserta.filter((p: any) => p.status === 'MENGERJAKAN').length;
  const selesai = peserta.filter((p: any) => p.status === 'SELESAI').length;

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(peserta.map((p: any, index: number) => ({
      'No': index + 1,
      'NIS': p.nis,
      'Nama Siswa': p.nama,
      'Kelas': p.kelas,
      'Mata Pelajaran': p.mapel,
      'Status': p.status,
      'Progres': p.totalSoal > 0 ? `${p.jumlahDijawab}/${p.totalSoal} (${Math.round((p.jumlahDijawab / p.totalSoal) * 100)}%)` : '-',
      'Pelanggaran (Kali)': p.pelanggaran,
      'Nilai Akhir': p.nilaiAkhir !== null && p.nilaiAkhir !== undefined ? p.nilaiAkhir : '-'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Ruangan");
    const safeRuangan = (ruangan?.nama || 'Ruangan').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Rekap_Ujian_${safeRuangan}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <Link href="/admin/proktor" className="inline-flex items-center gap-2 text-sm text-crypto-accent hover:text-crypto-accent-hover mb-2 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dasbor
          </Link>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-widest">
            Pemantauan Ruang: {ruangan.nama}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Ujian Berjalan: {jadwals.map((j: any) => j.bankSoal.mapel.nama).join(', ')}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* SSE Connection Badge */}
          {isConnected ? (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-crypto-success/10 text-crypto-success border border-crypto-success/20">
              <Wifi className="w-3.5 h-3.5" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crypto-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-crypto-success"></span>
              </span>
              Live
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <WifiOff className="w-3.5 h-3.5" />
              Terputus...
            </span>
          )}
          <button 
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-crypto-card border border-crypto-border rounded-xl text-sm font-semibold text-gray-300 hover:bg-crypto-card-hover hover:text-white transition-all disabled:opacity-50 shadow-md"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-crypto-accent' : ''}`} />
            {isRefreshing ? 'Memuat...' : 'Refresh'}
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-sm font-bold text-green-400 hover:bg-green-500 hover:text-white transition-all shadow-md"
          >
            <Download className="w-4 h-4" /> Ekspor Excel
          </button>

          <button 
            onClick={() => window.print()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-crypto-accent rounded-xl text-sm font-bold text-white hover:bg-crypto-accent-hover hover:neon-accent shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" /> Cetak Rekap
          </button>
        </div>
      </div>
      
      {/* Panel Token */}
      <div className="bg-crypto-card p-6 rounded-2xl border border-crypto-border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-crypto-accent/5 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-crypto-accent/20 border border-crypto-accent/50 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(112,0,255,0.4)]">
            <KeyRound className="w-7 h-7 text-crypto-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400">Token Ujian Saat Ini</p>
            <div className="text-4xl font-bold tracking-[0.2em] text-white mt-1 uppercase neon-accent">
              {ruangan.token || 'KOSONG'}
            </div>
          </div>
        </div>
        <button 
          onClick={handleRefreshToken}
          disabled={isRefreshingToken}
          className="px-6 py-3 bg-crypto-accent/10 text-crypto-accent border border-crypto-accent/20 rounded-xl font-bold hover:bg-crypto-accent/20 transition-all disabled:opacity-50 flex items-center gap-2 relative z-10 hover:shadow-[0_0_15px_rgba(112,0,255,0.2)]"
        >
          <RefreshCcw className={`w-5 h-5 ${isRefreshingToken ? 'animate-spin' : ''}`} />
          Generate Token Baru
        </button>
      </div>

      <div className="print-area">
        {/* Kop Surat Cetak */}
        <div className="hidden print:block mb-8 text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-bold uppercase">Berita Acara & Rekapitulasi Nilai</h1>
          <h2 className="text-xl font-semibold">{pengaturan?.namaSistem || 'UPIN'} - {pengaturan?.namaSekolah || 'SMK Banjar Asri'}</h2>
          <div className="mt-4 flex justify-between text-left text-sm">
            <div>
              <p><strong>Ruangan:</strong> {ruangan.nama}</p>
              <p><strong>Mata Pelajaran:</strong> {jadwals.map((j: any) => j.bankSoal.mapel.nama).join(', ')}</p>
              <p><strong>Token:</strong> {ruangan.token}</p>
            </div>
            <div className="text-right">
              <p suppressHydrationWarning><strong>Tanggal:</strong> {new Date().toLocaleDateString('id-ID')}</p>
              <p suppressHydrationWarning><strong>Waktu Cetak:</strong> {new Date().toLocaleTimeString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* Statistik Cepat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-crypto-card p-5 rounded-2xl shadow-xl border border-crypto-border flex items-center gap-4 hover:-translate-y-1 transition-transform group">
            <div className="w-12 h-12 bg-crypto-accent/20 border border-crypto-accent/30 rounded-full flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(112,0,255,0.4)] transition-shadow">
              <span className="text-crypto-accent font-bold text-xl">{totalPeserta}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Peserta Ruangan</p>
            </div>
          </div>
          
          <div className="bg-crypto-card p-5 rounded-2xl shadow-xl border border-crypto-border flex items-center gap-4 hover:-translate-y-1 transition-transform group">
            <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-shadow">
              <RefreshCcw className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Sedang Mengerjakan</p>
              <p className="text-2xl font-bold text-white">{sedangMengerjakan}</p>
            </div>
          </div>
          
          <div className="bg-crypto-card p-5 rounded-2xl shadow-xl border border-crypto-border flex items-center gap-4 hover:-translate-y-1 transition-transform group">
            <div className="w-12 h-12 bg-crypto-success/20 border border-crypto-success/30 rounded-full flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(0,255,170,0.4)] transition-shadow">
              <span className="text-crypto-success font-bold text-xl">{selesai}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Selesai</p>
            </div>
          </div>
        </div>

        {/* Tabel Peserta Campuran */}
        <div className="bg-crypto-card rounded-2xl shadow-xl border border-crypto-border overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-black/40 border-b border-crypto-border text-xs uppercase tracking-wider text-gray-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">No</th>
                  <th className="px-6 py-4 font-semibold">NIS</th>
                  <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                  <th className="px-6 py-4 font-semibold">Kelas</th>
                  <th className="px-6 py-4 font-semibold">Mata Pelajaran</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Progres Jawaban</th>
                  <th className="px-6 py-4 font-semibold text-center">Pelanggaran</th>
                  <th className="px-6 py-4 font-semibold text-center">Nilai Akhir</th>
                  <th className="px-6 py-4 font-semibold text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crypto-border/50">
                {peserta.map((p: any, idx: number) => (
                  <tr key={p.siswaId} className="hover:bg-crypto-card-hover transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4 font-bold text-crypto-accent group-hover:text-crypto-accent-hover transition-colors">{p.nis}</td>
                    <td className="px-6 py-4 font-bold text-white">{p.nama}</td>
                    <td className="px-6 py-4 font-medium text-gray-400">{p.kelas}</td>
                    <td className="px-6 py-4 font-medium text-gray-300">{p.mapel}</td>
                    <td className="px-6 py-4">
                      {p.status === 'BELUM MULAI'  && <span className="text-[10px] font-bold text-gray-400 bg-gray-500/10 border border-gray-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">Belum Mulai</span>}
                      {p.status === 'MENGERJAKAN'  && <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider animate-pulse">Mengerjakan</span>}
                      {p.status === 'SELESAI'      && <span className="text-[10px] font-bold text-crypto-success bg-crypto-success/10 border border-crypto-success/20 px-2.5 py-1 rounded-md uppercase tracking-wider">Selesai</span>}
                      {p.status === 'TIDAK AKTIF'  && <span className="text-[10px] font-bold text-gray-500 bg-black/40 border border-crypto-border px-2.5 py-1 rounded-md uppercase tracking-wider">-</span>}
                    </td>
                    {/* Kolom Progres */}
                    <td className="px-6 py-4">
                      {p.totalSoal > 0 ? (() => {
                        const pct = Math.round((p.jumlahDijawab / p.totalSoal) * 100);
                        const barColor = p.status === 'SELESAI'
                          ? 'bg-crypto-success shadow-[0_0_10px_rgba(0,255,170,0.5)]'
                          : p.status === 'MENGERJAKAN'
                            ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]'
                            : 'bg-gray-600';
                        return (
                          <div className="min-w-[120px]">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs font-medium text-gray-500">{p.jumlahDijawab}/{p.totalSoal} soal</span>
                              <span className={`text-xs font-extrabold ${
                                p.status === 'SELESAI' ? 'text-crypto-success' :
                                p.status === 'MENGERJAKAN' ? 'text-blue-400' : 'text-gray-500'
                              }`}>{pct}%</span>
                            </div>
                            <div className="w-full bg-black/60 rounded-full h-1.5 border border-crypto-border overflow-hidden">
                              <div
                                className={`${barColor} h-full rounded-full transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })() : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.pelanggaran > 0 ? (
                        <div className="inline-flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md text-xs font-bold border border-red-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {p.pelanggaran}
                        </div>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.nilaiAkhir !== null && p.nilaiAkhir !== undefined ? (
                        <span className="font-bold text-crypto-accent text-lg">{p.nilaiAkhir}</span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center no-print">
                      {p.status === 'MENGERJAKAN' && p.sesiId && (
                        <div className="flex items-center justify-center gap-2">
                          {/* Akhiri Paksa */}
                          <button 
                            onClick={() => handleForceSubmit(p.sesiId)}
                            title="Akhiri Paksa (jawaban tersimpan)"
                            className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 rounded-lg transition-all"
                          >
                            <StopCircle className="w-4 h-4" />
                          </button>
                          {/* Reset Login: jawaban tetap */}
                          <button 
                            onClick={() => handleResetLogin(p.sesiId)}
                            title="Reset Login (jawaban TETAP)"
                            className="p-2 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 hover:text-yellow-300 border border-yellow-500/20 rounded-lg transition-all"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          {/* Hapus & Mulai Ulang: jawaban hilang */}
                          <button 
                            onClick={() => handleHapusUlang(p.sesiId)}
                            title="Hapus & Mulai Ulang (jawaban DIHAPUS)"
                            className="p-2 text-gray-400 bg-gray-500/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-gray-500/20 rounded-lg transition-all group-hover:text-gray-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {peserta.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500 font-medium">
                      Tidak ada peserta di ruangan ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tanda Tangan Cetak */}
        <div className="hidden print:flex justify-between mt-16 px-10">
          <div className="text-center">
            <p className="mb-20">Mengetahui,<br/>Kepala Sekolah</p>
            <p className="font-bold underline">_________________________</p>
            <p>NIP. </p>
          </div>
          <div className="text-center">
            <p className="mb-20">Proktor Ruangan<br/>&nbsp;</p>
            <p className="font-bold underline">_________________________</p>
            <p>NIP. </p>
          </div>
        </div>

      </div>
    </div>
  );
}
