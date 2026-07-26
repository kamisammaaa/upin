'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSiswa } from '@/app/actions/siswa';
import { ArrowLeft, Users, KeyRound, User, CreditCard } from 'lucide-react';
import Link from 'next/link';

type Kelas = { id: number; nama: string };
type Ruangan = { id: number; nama: string };
type Siswa = {
  id: number;
  nis: string;
  nama: string;
  password: string;
  kelasId: number;
  ruanganId: number | null;
};

export default function EditSiswaClient({ 
  siswa,
  kelass, 
  ruangans 
}: { 
  siswa: Siswa;
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

    const formData = new FormData(e.currentTarget);
    const result = await updateSiswa(siswa.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push('/admin/master/siswa');
      router.refresh();
    }
  };

  const labelCls = 'block text-sm font-semibold text-gray-300 mb-2';

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/master/siswa" className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-crypto-accent" />
            Edit Data Siswa
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Ubah informasi data siswa.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>NIS</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CreditCard className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="nis"
                type="text"
                defaultValue={siswa.nis}
                required
                placeholder="Nomor Induk Siswa"
                className="w-full pl-10 p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Nama Lengkap</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="nama"
                type="text"
                defaultValue={siswa.nama}
                required
                placeholder="Nama Lengkap Siswa"
                className="w-full pl-10 p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="password"
                type="text"
                defaultValue={siswa.password}
                required
                placeholder="Password Login CBT"
                className="w-full pl-10 p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Kelas</label>
            <select 
              name="kelasId"
              defaultValue={siswa.kelasId}
              required
              className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none appearance-none"
            >
              <option value="" disabled className="bg-gray-900">Pilih kelas...</option>
              {kelass.map(k => (
                <option key={k.id} value={k.id} className="bg-gray-900">{k.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Ruangan (Opsional)</label>
            <select 
              name="ruanganId"
              defaultValue={siswa.ruanganId ?? ""}
              className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none appearance-none"
            >
              <option value="" className="bg-gray-900">-- Belum Diatur --</option>
              {ruangans.map(r => (
                <option key={r.id} value={r.id} className="bg-gray-900">{r.nama}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-crypto-border mt-8">
          <Link
            href="/admin/master/siswa"
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-crypto-card border border-crypto-border rounded-xl hover:bg-crypto-card-hover hover:text-white transition-all"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all disabled:opacity-70 shadow-neon hover:shadow-neon-accent"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
