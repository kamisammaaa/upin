'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createKelas } from '@/app/actions/kelas';
import Link from 'next/link';
import { ArrowLeft, GraduationCap } from 'lucide-react';

type Tingkat = { id: number; level: string };
type Jurusan = { id: number; kode: string; nama: string };

export default function TambahKelasClient({ 
  tingkats, 
  jurusans 
}: { 
  tingkats: Tingkat[]; 
  jurusans: Jurusan[];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedJurusans, setSelectedJurusans] = useState<number[]>([]);

  const toggleJurusan = (id: number) => {
    setSelectedJurusans(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (selectedJurusans.length === 0) {
      setError('Pilih minimal satu jurusan untuk kelas ini.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    selectedJurusans.forEach(id => {
      formData.append('jurusanIds', id.toString());
    });

    const result = await createKelas(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push('/admin/master/kelas');
      router.refresh();
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link 
          href="/admin/master/kelas" 
          className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-crypto-accent" />
            Tambah Data Kelas
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Pilih tingkat, nama kelas, dan jurusan yang tersedia.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-6">
        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl font-medium border border-red-500/20 shadow-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Tingkat</label>
          <select 
            name="tingkatId"
            defaultValue=""
            required
            className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none appearance-none"
          >
            <option value="" disabled className="text-gray-500">Pilih tingkat...</option>
            {tingkats.map(t => (
              <option key={t.id} value={t.id} className="bg-gray-900">{t.level}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Nama Kelas</label>
          <input
            name="nama"
            type="text"
            required
            placeholder="Misal: X TJKT 1"
            className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-all outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">Pilih Jurusan (Bisa lebih dari satu)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {jurusans.map(j => (
              <label 
                key={j.id} 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedJurusans.includes(j.id) 
                    ? 'border-crypto-accent bg-crypto-accent/10 text-crypto-accent shadow-[0_0_10px_rgba(112,0,255,0.2)]' 
                    : 'border-crypto-border bg-black/40 text-gray-400 hover:bg-crypto-card-hover'
                }`}
              >
                <input 
                  type="checkbox"
                  checked={selectedJurusans.includes(j.id)}
                  onChange={() => toggleJurusan(j.id)}
                  className="w-4 h-4 text-crypto-accent rounded bg-black/50 border-crypto-border focus:ring-crypto-accent focus:ring-offset-0"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white">{j.kode}</span>
                  <span className="text-xs opacity-80">{j.nama}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-crypto-border mt-8">
          <Link
            href="/admin/master/kelas"
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-crypto-card border border-crypto-border rounded-xl hover:bg-crypto-card-hover hover:text-white transition-all"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent disabled:opacity-70 shadow-neon hover:shadow-neon-accent"
          >
            {isLoading ? 'Menyimpan...' : 'Tambah Kelas'}
          </button>
        </div>
      </form>
    </div>
  );
}
