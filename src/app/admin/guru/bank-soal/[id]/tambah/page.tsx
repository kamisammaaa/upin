'use client';

import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import { tambahSoalPilihanGanda } from '@/app/actions/soal';

export default function TambahSoalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bankSoalId = Number(resolvedParams.id);
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.append('bankSoalId', String(bankSoalId));

    const result = await tambahSoalPilihanGanda(formData);
    
    if (result.success) {
      router.push(`/admin/guru/bank-soal/${bankSoalId}`);
    } else {
      setError(result.message || 'Gagal menambahkan soal');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/guru/bank-soal/${bankSoalId}`} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tambah Soal Baru</h2>
          <p className="mt-1 text-sm text-gray-500">Buat butir soal pilihan ganda.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pertanyaan</label>
            <textarea 
              name="pertanyaan"
              required
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white transition-colors"
              placeholder="Tuliskan pertanyaan di sini..."
            ></textarea>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Pilihan Jawaban</h3>
            
            {['A', 'B', 'C', 'D', 'E'].map((label) => (
              <div key={label} className="flex gap-3">
                <div className="flex-none w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-600">
                  {label}
                </div>
                <input 
                  type="text"
                  name={`opsi${label}`}
                  required={label === 'A' || label === 'B'} // Minimal 2 opsi
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white transition-colors"
                  placeholder={`Opsi Jawaban ${label}...`}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kunci Jawaban</label>
              <select 
                name="kunciJawaban"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              >
                <option value="">-- Pilih Kunci Jawaban --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bobot Nilai</label>
              <input 
                type="number"
                name="bobot"
                defaultValue="1"
                min="1"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <Link 
              href={`/admin/guru/bank-soal/${bankSoalId}`}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Batal
            </Link>
            <button 
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Soal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
