'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRuangan } from '@/app/actions/ruangan';
import Link from 'next/link';
import { ArrowLeft, Save, Building2, Users } from 'lucide-react';

type Ruangan = { id: number; nama: string; kapasitas: number };

export default function EditRuanganClient({ ruangan }: { ruangan: Ruangan }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await updateRuangan(ruangan.id, new FormData(e.currentTarget));
    if (result?.error) { setError(result.error); setLoading(false); }
    else router.push('/admin/master/ruangan');
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/master/ruangan" className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Edit Ruangan</h2>
          <p className="text-sm text-gray-400 mt-1">Ubah informasi ruangan ujian.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-5">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium">{error}</div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Nama Ruangan</label>
          <div className="relative">
            <Building2 className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input name="nama" type="text" required defaultValue={ruangan.nama} className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Kapasitas (Kursi)</label>
          <div className="relative">
            <Users className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input name="kapasitas" type="number" min="1" max="500" required defaultValue={ruangan.kapasitas} className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-colors" />
          </div>
        </div>

        <div className="pt-4 border-t border-crypto-border flex justify-end gap-3">
          <Link href="/admin/master/ruangan" className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-black/40 border border-crypto-border rounded-xl hover:text-white transition-colors">Batal</Link>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all disabled:opacity-50 hover:neon-accent">
            <Save className="w-4 h-4" />
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
