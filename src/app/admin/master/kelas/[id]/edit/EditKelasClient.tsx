'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateKelas } from '@/app/actions/kelas';

type Tingkat = { id: number; level: string };
type Jurusan = { id: number; kode: string; nama: string };
type Kelas = { id: number; nama: string; tingkatId: number; jurusans: Jurusan[] };

export default function EditKelasClient({ 
  kelas, 
  tingkats, 
  jurusans 
}: { 
  kelas: Kelas; 
  tingkats: Tingkat[]; 
  jurusans: Jurusan[];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedJurusans, setSelectedJurusans] = useState<number[]>(
    kelas.jurusans.map(j => j.id)
  );

  const toggleJurusan = (id: number) => {
    setSelectedJurusans(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    // Append jurusans
    selectedJurusans.forEach(id => {
      formData.append('jurusanIds', id.toString());
    });

    const result = await updateKelas(kelas.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push('/admin/master/kelas');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl font-medium border border-red-500/20 shadow-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Tingkat</label>
        <select 
          name="tingkatId"
          defaultValue={kelas.tingkatId}
          required
          className="w-full p-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-colors"
        >
          <option value="" disabled className="text-gray-500">Pilih tingkat...</option>
          {tingkats.map(t => (
            <option key={t.id} value={t.id} className="bg-crypto-bg">{t.level}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Nama Kelas</label>
        <input
          name="nama"
          type="text"
          defaultValue={kelas.nama}
          required
          placeholder="Misal: X TJKT 1"
          className="w-full p-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">Pilih Jurusan yang Tersedia di Kelas Ini</label>
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

      <div className="flex justify-end gap-3 pt-6 border-t border-crypto-border">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-bold text-gray-300 bg-black/40 border border-crypto-border rounded-xl hover:bg-crypto-card-hover transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent disabled:opacity-70 shadow-lg"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}
