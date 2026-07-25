'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSiswa } from '@/app/actions/siswa';

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

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">NIS</label>
          <input
            name="nis"
            type="text"
            defaultValue={siswa.nis}
            required
            placeholder="Nomor Induk Siswa"
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
          <input
            name="nama"
            type="text"
            defaultValue={siswa.nama}
            required
            placeholder="Nama Lengkap Siswa"
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
          <input
            name="password"
            type="text"
            defaultValue={siswa.password}
            required
            placeholder="Password Login CBT"
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Kelas</label>
          <select 
            name="kelasId"
            defaultValue={siswa.kelasId}
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="" disabled>Pilih kelas...</option>
            {kelass.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Ruangan (Opsional)</label>
          <select 
            name="ruanganId"
            defaultValue={siswa.ruanganId ?? ""}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="">-- Belum Diatur --</option>
            {ruangans.map(r => (
              <option key={r.id} value={r.id}>{r.nama}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-70"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}
