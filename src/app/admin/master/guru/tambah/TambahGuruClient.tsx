'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGuru } from '@/app/actions/guru';
import Link from 'next/link';
import { ArrowLeft, Save, User, Lock, Tag } from 'lucide-react';

export default function TambahGuruClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await createGuru(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/admin/master/guru');
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link 
          href="/admin/master/guru"
          className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Tambah Guru Baru</h2>
          <p className="text-sm text-gray-400 mt-1">Masukkan informasi akun guru yang akan ditambahkan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Nama Lengkap</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                name="nama"
                type="text"
                required
                placeholder="Misal: Budi Santoso, S.Pd"
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Username</label>
            <div className="relative">
              <Tag className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                name="username"
                type="text"
                required
                placeholder="Misal: budi_guru"
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-colors"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">Username digunakan untuk login ke dasbor guru.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Password Default</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                name="password"
                type="text"
                required
                defaultValue="guru123"
                placeholder="Misal: guru123"
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-colors"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">Bisa diubah nanti oleh Admin atau Guru (jika fitur tersedia).</p>
          </div>
        </div>

        <div className="pt-4 border-t border-crypto-border flex justify-end gap-3">
          <Link
            href="/admin/master/guru"
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-black/40 border border-crypto-border rounded-xl hover:text-white hover:bg-black/60 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:neon-accent"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Menyimpan...' : 'Simpan Data'}
          </button>
        </div>
      </form>
    </div>
  );
}
