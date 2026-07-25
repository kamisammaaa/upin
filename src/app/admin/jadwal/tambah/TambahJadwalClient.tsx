'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJadwalUjian } from '@/app/actions/jadwal';

export default function TambahJadwalClient({ 
  bankSoals, 
  kelass 
}: { 
  bankSoals: any[]; 
  kelass: any[];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Local state for checkboxes
  const [selectedKelas, setSelectedKelas] = useState<number[]>([]);

  const toggleKelas = (id: number) => {
    setSelectedKelas(prev => 
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedKelas(kelass.map(k => k.id));
  const deselectAll = () => setSelectedKelas([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    // Add multiple kelasIds
    selectedKelas.forEach(id => {
      formData.append('kelasIds', id.toString());
    });

    const result = await createJadwalUjian(formData);

    if (!result?.success) {
      setError(result?.message || 'Terjadi kesalahan saat menyimpan data');
      setIsLoading(false);
    } else {
      router.push('/admin/jadwal');
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Jadwal Ujian</label>
          <input
            name="nama"
            type="text"
            required
            placeholder="Contoh: PTS Ganjil - Kewirausahaan"
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Soal yang Digunakan</label>
          <select 
            name="bankSoalId"
            defaultValue=""
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
          >
            <option value="" disabled>Pilih bank soal...</option>
            {bankSoals.map(b => (
              <option key={b.id} value={b.id}>
                {b.judul} — {b.mapel.nama} (Oleh: {b.guru.nama})
              </option>
            ))}
          </select>
          {bankSoals.length === 0 && (
            <p className="text-sm text-red-500 mt-1">Belum ada bank soal tersedia. Silakan buat bank soal terlebih dahulu.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Waktu Mulai</label>
            <input
              name="waktuMulai"
              type="datetime-local"
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Waktu Selesai</label>
            <input
              name="waktuSelesai"
              type="datetime-local"
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        <div className="pt-2">
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-semibold text-gray-700">Kelas Peserta (Pilih minimal 1)</label>
            <div className="space-x-2 text-xs">
              <button type="button" onClick={selectAll} className="text-orange-600 font-medium hover:underline">Pilih Semua</button>
              <span className="text-gray-300">|</span>
              <button type="button" onClick={deselectAll} className="text-gray-500 font-medium hover:underline">Batalkan Pilihan</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
            {kelass.map(k => (
              <label 
                key={k.id} 
                className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-colors ${
                  selectedKelas.includes(k.id) 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedKelas.includes(k.id)}
                  onChange={() => toggleKelas(k.id)}
                  className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">{k.nama}</span>
              </label>
            ))}
            {kelass.length === 0 && (
              <p className="text-sm text-gray-500 col-span-full">Belum ada data kelas.</p>
            )}
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
          disabled={isLoading || selectedKelas.length === 0}
          className="px-5 py-2.5 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Jadwal Ujian'}
        </button>
      </div>
    </form>
  );
}
