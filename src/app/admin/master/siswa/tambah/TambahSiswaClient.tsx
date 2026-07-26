'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSiswa } from '@/app/actions/siswa';
import Link from 'next/link';
import { ArrowLeft, Save, Hash, User, Lock, GraduationCap, Building2 } from 'lucide-react';

type Kelas = { id: number; nama: string };
type Ruangan = { id: number; nama: string };

export default function TambahSiswaClient({
  kelass,
  ruangans
}: {
  kelass: Kelas[];
  ruangans: Ruangan[];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const result = await createSiswa(new FormData(e.currentTarget));
    if (result?.error) { setError(result.error); setIsLoading(false); }
    else { router.push('/admin/master/siswa'); router.refresh(); }
  };

  const inputCls = 'w-full pl-10 pr-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-colors';
  const selectCls = 'w-full pl-10 pr-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-colors [&>option]:bg-gray-900';
  const labelCls = 'block text-sm font-semibold text-gray-300 mb-2';

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/master/siswa" className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-crypto-accent" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Tambah Data Siswa</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">Daftarkan siswa baru ke dalam sistem.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>NIS</label>
            <div className="relative">
              <Hash className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input name="nis" type="text" required placeholder="Nomor Induk Siswa" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Nama Lengkap</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input name="nama" type="text" required placeholder="Nama Lengkap Siswa" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Password Login CBT</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input name="password" type="text" required placeholder="Password Login CBT" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Kelas</label>
            <div className="relative">
              <GraduationCap className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <select name="kelasId" defaultValue="" required className={selectCls}>
                <option value="" disabled>Pilih kelas...</option>
                {kelass.map(k => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Ruangan <span className="text-gray-500 font-normal">(Opsional)</span></label>
            <div className="relative">
              <Building2 className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <select name="ruanganId" defaultValue="" className={selectCls}>
                <option value="">-- Belum Diatur --</option>
                {ruangans.map(r => (
                  <option key={r.id} value={r.id}>{r.nama}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-crypto-border flex justify-end gap-3">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-black/40 border border-crypto-border rounded-xl hover:text-white transition-colors">
            Batal
          </button>
          <button type="submit" disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all disabled:opacity-50 hover:neon-accent">
            <Save className="w-4 h-4" />
            {isLoading ? 'Menyimpan...' : 'Tambah Siswa'}
          </button>
        </div>
      </form>
    </div>
  );
}
