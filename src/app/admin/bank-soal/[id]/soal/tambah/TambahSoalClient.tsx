'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSoal } from '@/app/actions/bank-soal';

export default function TambahSoalClient({ bankSoalId }: { bankSoalId: number }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await createSoal(bankSoalId, formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push(`/admin/bank-soal/${bankSoalId}`);
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Pertanyaan</label>
          <textarea
            name="pertanyaan"
            required
            rows={4}
            placeholder="Tuliskan pertanyaan di sini..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Opsi A (Wajib)</label>
            <input
              name="opsiA"
              type="text"
              required
              placeholder="Pilihan A"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Opsi B (Wajib)</label>
            <input
              name="opsiB"
              type="text"
              required
              placeholder="Pilihan B"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Opsi C (Opsional)</label>
            <input
              name="opsiC"
              type="text"
              placeholder="Pilihan C"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Opsi D (Opsional)</label>
            <input
              name="opsiD"
              type="text"
              placeholder="Pilihan D"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Opsi E (Opsional)</label>
            <input
              name="opsiE"
              type="text"
              placeholder="Pilihan E"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Kunci Jawaban</label>
            <select 
              name="kunciJawaban"
              defaultValue=""
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 font-bold"
            >
              <option value="" disabled>Pilih Kunci Jawaban...</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bobot Nilai</label>
            <input
              name="bobot"
              type="number"
              min="1"
              defaultValue="1"
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>
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
          {isLoading ? 'Menyimpan...' : 'Simpan Butir Soal'}
        </button>
      </div>
    </form>
  );
}
