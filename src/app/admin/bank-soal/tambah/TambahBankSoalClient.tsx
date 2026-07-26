'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBankSoal } from '@/app/actions/bank-soal';
import Link from 'next/link';
import { ArrowLeft, Save, BookOpen, BookMarked } from 'lucide-react';

export default function TambahBankSoalClient({
  mapels,
  gurus
}: {
  mapels: any[];
  gurus: any[];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const result = await createBankSoal(new FormData(e.currentTarget));
    if (result?.error) { setError(result.error); setIsLoading(false); }
    else { router.push('/admin/bank-soal'); router.refresh(); }
  };

  const inputCls = 'w-full px-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-colors';
  const labelCls = 'block text-sm font-semibold text-gray-300 mb-2';

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/bank-soal" className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-crypto-accent" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Tambah Bank Soal</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">Buat paket soal baru dan tetapkan mata pelajaran serta pengampunya.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium">{error}</div>
        )}

        <div>
          <label className={labelCls}>Judul Paket Soal</label>
          <div className="relative">
            <BookMarked className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input name="judul" type="text" required placeholder="Contoh: Penilaian Tengah Semester Gasal"
              className={`${inputCls} pl-10`} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Mata Pelajaran</label>
          <select name="mapelId" defaultValue="" required className={`${inputCls} [&>option]:bg-gray-900`}>
            <option value="" disabled>Pilih mata pelajaran...</option>
            {mapels.map(m => (
              <option key={m.id} value={m.id}>{m.nama}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Guru Pengampu</label>
          <select name="guruId" defaultValue="" required className={`${inputCls} [&>option]:bg-gray-900`}>
            <option value="" disabled>Pilih guru penulis soal...</option>
            {gurus.map(g => (
              <option key={g.id} value={g.id}>{g.nama}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t border-crypto-border flex justify-end gap-3">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-black/40 border border-crypto-border rounded-xl hover:text-white transition-colors">
            Batal
          </button>
          <button type="submit" disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all disabled:opacity-50 hover:neon-accent">
            <Save className="w-4 h-4" />
            {isLoading ? 'Menyimpan...' : 'Simpan Bank Soal'}
          </button>
        </div>
      </form>
    </div>
  );
}
