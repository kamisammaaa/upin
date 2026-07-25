'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBankSoal } from '@/app/actions/bank-soal';

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

    const formData = new FormData(e.currentTarget);
    const result = await createBankSoal(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push('/admin/bank-soal');
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Judul Paket Soal</label>
          <input
            name="judul"
            type="text"
            required
            placeholder="Contoh: Penilaian Tengah Semester Gasal"
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Mata Pelajaran</label>
          <select 
            name="mapelId"
            defaultValue=""
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          >
            <option value="" disabled>Pilih mata pelajaran...</option>
            {mapels.map(m => (
              <option key={m.id} value={m.id}>{m.nama}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Guru Pengampu</label>
          <select 
            name="guruId"
            defaultValue=""
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          >
            <option value="" disabled>Pilih guru penulis soal...</option>
            {gurus.map(g => (
              <option key={g.id} value={g.id}>{g.nama}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-70"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Bank Soal'}
        </button>
      </div>
    </form>
  );
}
