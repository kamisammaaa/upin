'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProktor } from '@/app/actions/proktor';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

type Proktor = {
  id: number;
  username: string;
  nama: string;
};

export default function EditProktorClient({ proktor }: { proktor: Proktor }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await updateProktor(proktor.id, formData);

    if (res.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      router.push('/admin/master/proktor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/master/proktor"
          className="text-gray-400 hover:text-white bg-crypto-card p-1.5 rounded-lg border border-crypto-border hover:bg-crypto-card-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Proktor</h1>
          <p className="text-gray-400 text-sm">Ubah data akun proktor</p>
        </div>
      </div>

      <div className="w-full bg-crypto-card border border-crypto-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b border-crypto-border bg-black/30 flex items-center gap-3">
          <Shield className="w-5 h-5 text-crypto-accent" />
          <h2 className="text-base font-semibold text-white">Informasi Akun Proktor</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="nama" className="block text-sm font-medium text-gray-300">
              Nama Lengkap <span className="text-red-400">*</span>
            </label>
            <input
              id="nama"
              name="nama"
              type="text"
              required
              defaultValue={proktor.nama}
              placeholder="Nama lengkap proktor"
              className="w-full px-4 py-3 bg-black/40 border border-crypto-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-crypto-accent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              defaultValue={proktor.username}
              placeholder="Username untuk login (unik)"
              className="w-full px-4 py-3 bg-black/40 border border-crypto-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-crypto-accent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password Baru
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Kosongkan jika tidak ingin mengubah password"
              className="w-full px-4 py-3 bg-black/40 border border-crypto-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-crypto-accent transition-colors"
            />
            <p className="text-xs text-gray-500">Biarkan kosong jika tidak ingin mengubah password</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/admin/master/proktor"
              className="flex-1 px-6 py-3 bg-transparent border border-crypto-border text-gray-300 rounded-xl hover:bg-crypto-card-hover transition-colors text-center font-medium"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-crypto-accent text-white rounded-xl hover:bg-crypto-accent-hover font-semibold transition-all hover:neon-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
