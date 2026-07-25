'use client';

import { useState } from 'react';
import { tambahBankSoal } from '@/app/actions/soal';
import { useRouter } from 'next/navigation';

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Bank Soal</label>
        <input 
          type="text" 
          name="judul" 
          required
          placeholder="Misal: UAS Matematika Ganjil Kelas X"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
        <select 
          name="mapelId" 
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
        >
          <option value="">Pilih Mata Pelajaran...</option>
          {mapels.map(m => (
            <option key={m.id} value={m.id}>{m.nama}</option>
          ))}
        </select>
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
        </button>
      </div>
    </form>
  );
}
