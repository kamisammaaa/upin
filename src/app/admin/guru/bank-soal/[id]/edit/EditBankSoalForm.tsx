'use client';

import { useState } from 'react';
import { updateBankSoal } from '@/app/actions/bank-soal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Save, Loader2, FileQuestion, CalendarDays } from 'lucide-react';

interface Mapel {
  id: number;
  nama: string;
}

interface BankSoalData {
  id: number;
  judul: string;
  mapelId: number;
  mapel?: {
    id: number;
    nama: string;
  };
  _count?: {
    soals: number;
    jadwals: number;
  };
}

export default function EditBankSoalForm({ 
  bankSoal, 
  mapels 
}: { 
  bankSoal: BankSoalData; 
  mapels: Mapel[]; 
}) {
  const router = useRouter();
  const [judul, setJudul] = useState(bankSoal.judul);
  const [mapelId, setMapelId] = useState(bankSoal.mapelId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('judul', judul);
    formData.append('mapelId', String(mapelId));

    const res = await updateBankSoal(bankSoal.id, formData);

    if (res.success) {
      router.push(`/admin/guru/bank-soal/${bankSoal.id}`);
      router.refresh();
    } else {
      setError(res.error || 'Terjadi kesalahan saat memperbarui bank soal.');
      setIsSubmitting(false);
    }
  };

  const labelCls = 'block text-sm font-semibold text-gray-300 mb-2';

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link 
          href={`/admin/guru/bank-soal/${bankSoal.id}`}
          className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-crypto-accent" />
            Edit Bank Soal
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Perbarui judul paket soal dan mata pelajaran yang diampu.
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-crypto-card/60 p-4 rounded-2xl border border-crypto-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-crypto-success bg-crypto-success/10 px-3 py-1.5 rounded-lg border border-crypto-success/20">
            <FileQuestion className="w-4 h-4" />
            <span>{bankSoal._count?.soals ?? 0} Butir Soal Tersedia</span>
          </div>
          {(bankSoal._count?.jadwals || 0) > 0 && (
            <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
              <CalendarDays className="w-4 h-4" />
              <span>Digunakan pada {bankSoal._count?.jadwals} Jadwal Ujian</span>
            </div>
          )}
        </div>
        <span className="text-xs text-gray-500">ID Bank Soal: #{bankSoal.id}</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium text-sm">
            {error}
          </div>
        )}

        <div>
          <label className={labelCls}>Judul Bank Soal</label>
          <input 
            type="text" 
            name="judul" 
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            required
            placeholder="Misal: UAS Matematika Ganjil Kelas X"
            className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none"
          />
        </div>

        <div>
          <label className={labelCls}>Mata Pelajaran</label>
          <select 
            name="mapelId" 
            value={mapelId}
            onChange={(e) => setMapelId(Number(e.target.value))}
            required
            className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none"
          >
            <option value="" disabled className="text-gray-500">Pilih Mata Pelajaran...</option>
            {mapels.map(m => (
              <option key={m.id} value={m.id} className="bg-gray-900">{m.nama}</option>
            ))}
          </select>
        </div>

        <div className="pt-6 border-t border-crypto-border flex justify-end gap-3 mt-8">
          <Link 
            href={`/admin/guru/bank-soal/${bankSoal.id}`}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-crypto-card border border-crypto-border rounded-xl hover:bg-crypto-card-hover hover:text-white transition-all"
          >
            Batal
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all disabled:opacity-70 shadow-neon hover:shadow-neon-accent"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
