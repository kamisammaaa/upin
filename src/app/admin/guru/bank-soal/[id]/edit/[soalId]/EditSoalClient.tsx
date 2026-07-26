'use client';

import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateSoalPilihanGanda } from '@/app/actions/soal';
import RichTextEditor from '@/app/components/RichTextEditor';

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
      router.push(`/admin/guru/bank-soal/${bankSoalId}`);
      router.refresh();
    } else {
      setError(result.message || 'Gagal memperbarui soal');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href={`/admin/guru/bank-soal/${bankSoalId}`} className="inline-flex w-fit p-2 bg-crypto-card border border-crypto-border rounded-xl hover:bg-crypto-card-hover text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">Edit Soal</h2>
          <p className="mt-1 text-sm text-gray-400">Ubah butir soal pilihan ganda.</p>
        </div>
      </div>

      <div className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Pertanyaan</label>
            <input type="hidden" name="pertanyaan" value={pertanyaan} />
            <RichTextEditor 
              value={pertanyaan} 
              onChange={setPertanyaan} 
              placeholder="Tuliskan pertanyaan beserta gambar/rumus di sini..."
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-300 border-b border-crypto-border pb-2">Pilihan Jawaban</h3>
            
            {['A', 'B', 'C', 'D', 'E'].map((label) => (
              <div key={label} className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="flex-none w-10 h-10 rounded-xl bg-black/40 border border-crypto-border flex items-center justify-center font-bold text-gray-400 shadow-sm">
                  {label}
                </div>
                <input type="hidden" name={`opsi${label}`} value={opsi[label]} />
                <div className="flex-1">
                  <RichTextEditor 
                    value={opsi[label]}
                    onChange={(val) => setOpsi(prev => ({ ...prev, [label]: val }))}
                    placeholder={`Opsi Jawaban ${label}...`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-crypto-border">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Kunci Jawaban</label>
              <select 
                name="kunciJawaban"
                required
                defaultValue={soal.kunciJawaban}
                className="w-full px-4 py-2.5 rounded-lg border border-crypto-border focus:border-crypto-accent outline-none text-white bg-black/40"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Bobot Nilai</label>
              <input 
                type="number"
                name="bobot"
                defaultValue={soal.bobot}
                min="1"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-crypto-border focus:border-crypto-accent outline-none text-white bg-black/40"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <Link 
              href={`/admin/guru/bank-soal/${bankSoalId}`}
              className="px-6 py-2.5 rounded-lg border border-crypto-border text-gray-400 font-medium hover:bg-crypto-card-hover hover:text-white transition"
            >
              Batal
            </Link>
            <button 
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-crypto-accent text-white font-medium hover:bg-crypto-accent-hover transition disabled:opacity-50 shadow-neon"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
