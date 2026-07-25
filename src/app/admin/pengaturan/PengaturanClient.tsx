'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertPengaturan } from '@/app/actions/pengaturan';
import { Save } from 'lucide-react';

export default function PengaturanClient({ pengaturan }: { pengaturan: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const result = await upsertPengaturan(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Pengaturan berhasil disimpan!');
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl font-medium border border-red-500/20 shadow-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-crypto-success/10 text-crypto-success p-4 rounded-xl font-medium border border-crypto-success/20 shadow-sm">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Nama Sistem Ujian</label>
          <input
            name="namaSistem"
            type="text"
            required
            defaultValue={pengaturan.namaSistem || 'PintarCBT'}
            placeholder="Misal: PintarCBT"
            className="w-full p-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Upload Logo Sekolah</label>
          <div className="flex items-center gap-4">
            {pengaturan.logoUrl && (
              <img src={pengaturan.logoUrl} alt="Logo saat ini" className="w-12 h-12 rounded-full object-contain" />
            )}
            <input
              name="logoFile"
              type="file"
              accept="image/*"
              className="flex-1 p-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-crypto-accent file:text-white hover:file:bg-crypto-accent-hover"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Pilih gambar dari komputer (PNG/JPG). Akan menggantikan logo saat ini.</p>
          <input type="hidden" name="logoUrl" value={pengaturan.logoUrl || ''} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Nama Sekolah</label>
          <input
            name="namaSekolah"
            type="text"
            required
            defaultValue={pengaturan.namaSekolah}
            placeholder="SMK Negeri 1 Contoh"
            className="w-full p-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Alamat Lengkap</label>
          <textarea
            name="alamat"
            rows={2}
            defaultValue={pengaturan.alamat || ''}
            placeholder="Jl. Pendidikan No. 1..."
            className="w-full p-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 resize-y transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Pengumuman di Halaman Login Siswa</label>
          <textarea
            name="pengumuman"
            rows={3}
            defaultValue={pengaturan.pengumuman || ''}
            placeholder="Misal: Ujian dimulai pukul 07.30 WIB. Harap hadir tepat waktu!"
            className="w-full p-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 resize-y transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ada pengumuman khusus.</p>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-crypto-border">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent disabled:opacity-70 shadow-lg"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </form>
  );
}
