'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSoalPilihanGanda } from '@/app/actions/soal';
import RichTextEditor from '@/app/components/RichTextEditor';
import Link from 'next/link';
import { ArrowLeft, Edit3, Loader2, Save } from 'lucide-react';

export default function EditSoalClient({ bankSoalId, soal }: { bankSoalId: number, soal: any }) {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [pertanyaan, setPertanyaan] = useState(soal.pertanyaan);
  
  // Parse opsi stringified array to object with keys A, B, C, D, E
  const parsedOpsi = JSON.parse(soal.opsi || '[]');
  const [opsi, setOpsi] = useState<{ [key: string]: string }>({
    A: parsedOpsi[0] || '', 
    B: parsedOpsi[1] || '', 
    C: parsedOpsi[2] || '', 
    D: parsedOpsi[3] || '', 
    E: parsedOpsi[4] || ''
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.append('bankSoalId', String(bankSoalId));

    const result = await updateSoalPilihanGanda(soal.id, formData);
    
    if (result.success) {
      router.push(`/admin/bank-soal/${bankSoalId}`);
      router.refresh();
    } else {
      setError(result.message || 'Gagal memperbarui soal');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link 
          href={`/admin/bank-soal/${bankSoalId}`} 
          className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-crypto-accent" />
            Edit Soal
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Ubah pertanyaan, pilihan jawaban, atau bobot soal.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-6">
        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl font-medium border border-red-500/20 shadow-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Pertanyaan</label>
            <input type="hidden" name="pertanyaan" value={pertanyaan} />
            <div className="bg-black/40 border border-crypto-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-crypto-accent focus-within:border-transparent transition-all">
              <RichTextEditor 
                value={pertanyaan} 
                onChange={setPertanyaan} 
                placeholder="Tuliskan pertanyaan beserta gambar/rumus di sini..."
              />
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <h3 className="text-sm font-semibold text-gray-300 border-b border-crypto-border pb-2">Pilihan Jawaban</h3>
            {['A', 'B', 'C', 'D', 'E'].map((label) => (
              <div key={label} className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="flex-none w-10 h-10 rounded-xl bg-black/40 border border-crypto-border flex items-center justify-center font-bold text-crypto-accent shadow-sm">
                  {label}
                </div>
                <input type="hidden" name={`opsi${label}`} value={opsi[label]} />
                <div className="flex-1 w-full bg-black/40 border border-crypto-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-crypto-accent focus-within:border-transparent transition-all">
                  <RichTextEditor 
                    value={opsi[label]}
                    onChange={(val) => setOpsi(prev => ({ ...prev, [label]: val }))}
                    placeholder={`Opsi Jawaban ${label}...`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-crypto-border mt-8">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Kunci Jawaban</label>
              <select 
                name="kunciJawaban"
                required
                defaultValue={soal.kunciJawaban}
                className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none appearance-none font-bold"
              >
                <option value="" disabled className="text-gray-500 font-normal">Pilih Kunci Jawaban...</option>
                <option value="A" className="bg-gray-900">A</option>
                <option value="B" className="bg-gray-900">B</option>
                <option value="C" className="bg-gray-900">C</option>
                <option value="D" className="bg-gray-900">D</option>
                <option value="E" className="bg-gray-900">E</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Bobot Nilai</label>
              <input 
                type="number"
                name="bobot"
                defaultValue={soal.bobot}
                min="1"
                required
                className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-crypto-border mt-8">
          <Link 
            href={`/admin/bank-soal/${bankSoalId}`}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-crypto-card border border-crypto-border rounded-xl hover:bg-crypto-card-hover hover:text-white transition-all"
          >
            Batal
          </Link>
          <button 
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent disabled:opacity-70 shadow-neon hover:shadow-neon-accent"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
