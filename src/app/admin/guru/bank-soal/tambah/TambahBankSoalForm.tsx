'use client';

import { useState } from 'react';
import { tambahBankSoal } from '@/app/actions/soal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function TambahBankSoalForm({ mapels, guruId }: { mapels: any[], guruId: number }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await tambahBankSoal(formData, guruId);

    if (res.success) {
      router.push(`/admin/guru/bank-soal/${res.id}`);
    } else {
      setError(res.message || 'Terjadi kesalahan');
      setIsSubmitting(false);
    }
  };

  const labelCls = 'block text-sm font-semibold text-gray-300 mb-2';

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link 
          href="/admin/guru/bank-soal" 
          className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-crypto-accent" />
            Buat Bank Soal Baru
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Pilih mata pelajaran dan tentukan judul paket soal.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div>
          <label className={labelCls}>Judul Bank Soal</label>
          <input 
            type="text" 
            name="judul" 
            required
            placeholder="Misal: UAS Matematika Ganjil Kelas X"
            className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none"
          />
        </div>

        <div>
          <label className={labelCls}>Mata Pelajaran</label>
          <select 
            name="mapelId" 
            required
            className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none appearance-none"
          >
            <option value="" disabled className="text-gray-500">Pilih Mata Pelajaran...</option>
            {mapels.map(m => (
              <option key={m.id} value={m.id} className="bg-gray-900">{m.nama}</option>
            ))}
          </select>
        </div>

        <div className="pt-6 border-t border-crypto-border flex justify-end gap-3 mt-8">
          <Link 
            href="/admin/guru/bank-soal"
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-crypto-card border border-crypto-border rounded-xl hover:bg-crypto-card-hover hover:text-white transition-all"
          >
            Batal
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all disabled:opacity-70 shadow-neon hover:shadow-neon-accent"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
          </button>
        </div>
      </form>
    </div>
  );
}
