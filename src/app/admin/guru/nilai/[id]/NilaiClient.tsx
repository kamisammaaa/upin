'use client';

import { useState, useEffect } from 'react';
import { getAnalisisSoalData } from '@/app/actions/monitor';
import { Users, CheckCircle2, AlertTriangle, Printer, ArrowLeft, Download, BarChart2, List } from 'lucide-react';
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
};

export default function NilaiClient({ initialData, jadwalId }: { initialData: any, jadwalId: number }) {
  const [data] = useState(initialData);
  const [activeTab, setActiveTab] = useState<'rekap' | 'analisis'>('rekap');
  const [analisisData, setAnalisisData] = useState<any>(null);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);

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
  const sudahAdaNilai = peserta.filter((p: Peserta) => p.nilaiAkhir !== null && p.nilaiAkhir !== undefined);
  const totalSelesai = sudahAdaNilai.length;
  const rataRataNilai = totalSelesai > 0
    ? (sudahAdaNilai.reduce((sum: number, p: Peserta) => sum + (p.nilaiAkhir || 0), 0) / totalSelesai).toFixed(1)
    : '-';

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(peserta.map((p: Peserta, index: number) => ({
      'No': index + 1,
      'NIS': p.nis,
      'Nama': p.nama,
      'Kelas': p.kelas,
      'Nilai Akhir': p.nilaiAkhir !== null && p.nilaiAkhir !== undefined ? Math.round(p.nilaiAkhir) : 'Belum Ada Nilai'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hasil Ujian");
    XLSX.writeFile(wb, `Hasil_Ujian_${jadwal.nama}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Halaman (Sembunyikan saat di-print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/guru/nilai" className="text-gray-400 hover:text-white bg-crypto-card p-1.5 rounded-lg border border-crypto-border hover:bg-crypto-card-hover transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Rekapitulasi Nilai & Analisis</h1>
          </div>
          <p className="text-gray-400 text-sm ml-9">
            Mata Pelajaran: <span className="font-semibold text-gray-300">{jadwal.bankSoal.mapel.nama}</span> | {jadwal.nama}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500 hover:text-white text-sm font-medium transition shadow-sm print:hidden"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-crypto-accent/20 border border-crypto-accent/30 text-crypto-accent rounded-lg hover:bg-crypto-accent hover:text-white text-sm font-medium transition shadow-sm print:hidden"
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

      {/* Kartu Statistik Hasil Ujian */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="bg-crypto-card p-5 rounded-xl border border-crypto-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-500/10 text-gray-400 rounded-full border border-gray-500/20 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Peserta</p>
            <p className="text-2xl font-bold text-white">{totalSiswa}</p>
          </div>
        </div>
        
        <div className="bg-crypto-card p-5 rounded-xl border border-crypto-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-crypto-success/10 text-crypto-success rounded-full border border-crypto-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Sudah Mengerjakan</p>
            <p className="text-2xl font-bold text-crypto-success">{totalSelesai}</p>
          </div>
        </div>
        
        <div className="bg-crypto-card p-5 rounded-xl border border-crypto-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-crypto-accent/10 text-crypto-accent rounded-full border border-crypto-accent/20 flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Rata-Rata Nilai</p>
            <p className="text-2xl font-bold text-crypto-accent">{rataRataNilai}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-4 border-b border-crypto-border print:hidden">
        <button
          onClick={() => setActiveTab('rekap')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'rekap' 
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

      {activeTab === 'rekap' && (
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
                <th className="px-6 py-4 font-semibold text-center print:border print:border-black print:py-2 print:px-2">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border/50 print:divide-black">
              {peserta.map((p: Peserta, index: number) => (
                <tr key={p.siswaId} className="hover:bg-crypto-card-hover transition-colors print:hover:bg-white print:text-black">
                  <td className="px-6 py-4 text-sm text-gray-400 print:border print:border-black print:py-1 print:px-2">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono print:border print:border-black print:py-1 print:px-2">{p.nis}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white print:border print:border-black print:py-1 print:px-2">{p.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 print:border print:border-black print:py-1 print:px-2">{p.kelas}</td>
                  <td className="px-6 py-4 text-center print:border print:border-black print:py-1 print:px-2">
                    {p.nilaiAkhir !== null && p.nilaiAkhir !== undefined ? (
                      <span className="text-lg font-bold text-crypto-accent print:text-base print:text-black">
                        {Math.round(p.nilaiAkhir)}
                      </span>
                    ) : (
                      <span className="text-gray-500 font-medium">-</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {peserta.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data hasil ujian.
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
              <AlertTriangle className="w-8 h-8 text-crypto-accent animate-spin" />
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
          <p className="mb-16">Guru Mata Pelajaran</p>
          <p className="font-bold underline">_________________________</p>
        </div>
      </div>

    </div>
  );
}
