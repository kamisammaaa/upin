'use client';

import { useState, useEffect } from 'react';
import { getJadwalMonitorData } from '@/app/actions/monitor';
import { Users, CheckCircle2, Clock, AlertTriangle, Printer, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

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
};

export default function MonitorClient({ initialData, jadwalId }: { initialData: any, jadwalId: number }) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLive = async () => {
    setIsRefreshing(true);
    const newData = await getJadwalMonitorData(jadwalId);
    if (newData) {
      setData(newData);
      setLastUpdated(new Date());
    }
    setIsRefreshing(false);
  };

  // Auto-refresh setiap 10 detik
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLive();
    }, 10000);
    return () => clearInterval(interval);
  }, [jadwalId]);

  const { jadwal, peserta } = data;

  const totalSiswa = peserta.length;
  const selesai = peserta.filter((p: Peserta) => p.status === 'FINISHED').length;
  const sedangMengerjakan = peserta.filter((p: Peserta) => p.status === 'ONGOING').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Halaman (Sembunyikan saat di-print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/jadwal" className="text-gray-500 hover:text-gray-900 bg-gray-100 p-1.5 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Live Monitor: {jadwal.nama}</h1>
          </div>
          <p className="text-gray-500 text-sm ml-9">
            Mata Pelajaran: <span className="font-semibold text-gray-700">{jadwal.bankSoal.mapel.nama}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 
            Update: {lastUpdated.toLocaleTimeString()}
          </span>
          <button 
            onClick={fetchLive}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition shadow-sm"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Peserta</p>
            <p className="text-2xl font-bold text-gray-900">{totalSiswa}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sedang Mengerjakan</p>
            <p className="text-2xl font-bold text-blue-700">{sedangMengerjakan}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Selesai</p>
            <p className="text-2xl font-bold text-green-700">{selesai}</p>
          </div>
        </div>
      </div>

      {/* Tabel Peserta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-black print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse print:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm print:bg-white print:border-black">
                <th className="px-6 py-4 font-semibold print:border print:border-black print:py-2 print:px-2">No</th>
                <th className="px-6 py-4 font-semibold print:border print:border-black print:py-2 print:px-2">NIS</th>
                <th className="px-6 py-4 font-semibold print:border print:border-black print:py-2 print:px-2">Nama Siswa</th>
                <th className="px-6 py-4 font-semibold print:border print:border-black print:py-2 print:px-2">Kelas</th>
                <th className="px-6 py-4 font-semibold text-center print:border print:border-black print:py-2 print:px-2">Status</th>
                <th className="px-6 py-4 font-semibold text-center print:hidden">Pelanggaran</th>
                <th className="px-6 py-4 font-semibold text-center print:border print:border-black print:py-2 print:px-2">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-black">
              {peserta.map((p: Peserta, index: number) => (
                <tr key={p.siswaId} className="hover:bg-gray-50 transition-colors print:hover:bg-white">
                  <td className="px-6 py-4 text-sm text-gray-500 print:border print:border-black print:py-1 print:px-2">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono print:border print:border-black print:py-1 print:px-2">{p.nis}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 print:border print:border-black print:py-1 print:px-2">{p.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 print:border print:border-black print:py-1 print:px-2">{p.kelas}</td>
                  <td className="px-6 py-4 print:border print:border-black print:py-1 print:px-2">
                    <div className="flex justify-center">
                      {p.status === 'BELUM MULAI' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 print:border print:border-gray-500 print:bg-white">Belum Mulai</span>}
                      {p.status === 'ONGOING' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse print:border print:border-gray-500 print:bg-white print:animate-none">Mengerjakan</span>}
                      {p.status === 'FINISHED' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 print:border print:border-gray-500 print:bg-white">Selesai</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 print:hidden">
                    <div className="flex justify-center">
                      {p.pelanggaran > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" /> {p.pelanggaran}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center print:border print:border-black print:py-1 print:px-2">
                    {p.status === 'FINISHED' ? (
                      <span className="text-lg font-bold text-gray-900 print:text-base">
                        {p.nilaiAkhir !== null && p.nilaiAkhir !== undefined ? Math.round(p.nilaiAkhir) : '-'}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {peserta.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Belum ada siswa yang terdaftar di kelas untuk jadwal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Tanda Tangan Print */}
      <div className="hidden print:flex justify-end mt-12 text-sm">
        <div className="text-center">
          <p>Banjar Asri, {new Date().toLocaleDateString('id-ID')}</p>
          <p className="mb-16">Pengawas / Proktor</p>
          <p className="font-bold underline">_________________________</p>
        </div>
      </div>

    </div>
  );
}
