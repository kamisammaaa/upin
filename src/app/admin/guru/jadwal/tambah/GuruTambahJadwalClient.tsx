'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJadwalUjian } from '@/app/actions/jadwal';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function GuruTambahJadwalClient({ 
  bankSoals, 
  kelass,
  redirectUrl = '/admin/guru/jadwal'
}: { 
  bankSoals: any[]; 
  kelass: any[];
  redirectUrl?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<number[]>([]);
  const [acakSoal, setAcakSoal] = useState(false);
  const [acakOpsi, setAcakOpsi] = useState(false);

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
    selectedKelas.forEach(id => {
      formData.append('kelasIds', id.toString());
    });

    const result = await createJadwalUjian(formData);

    if (!result?.success) {
      setError(result?.message || 'Terjadi kesalahan saat menyimpan data');
      setIsLoading(false);
    } else {
      router.push(redirectUrl);
      router.refresh();
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link 
          href="/admin/guru/jadwal" 
          className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-crypto-accent" />
            Buat Jadwal Ujian Baru
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Tentukan waktu, bank soal yang digunakan, dan kelas yang dapat mengakses. Hanya menampilkan bank soal milik Anda.
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
            <label className="block text-sm font-semibold text-gray-300 mb-2">Nama Jadwal Ujian</label>
            <input
              name="nama"
              type="text"
              required
              placeholder="Contoh: PTS Ganjil - Kewirausahaan"
              className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Bank Soal yang Digunakan</label>
            <select 
              name="bankSoalId"
              defaultValue=""
              required
              className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-all outline-none appearance-none"
            >
              <option value="" disabled className="text-gray-500">Pilih bank soal...</option>
              {bankSoals.map(b => (
                <option key={b.id} value={b.id} className="bg-gray-900">
                  {b.judul} — {b.mapel.nama} (Oleh: {b.guru.nama})
                </option>
              ))}
            </select>
            {bankSoals.length === 0 && (
              <p className="text-sm text-red-400 mt-2">Belum ada bank soal tersedia. Silakan buat bank soal terlebih dahulu.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Waktu Mulai</label>
              <input
                name="waktuMulai"
                type="datetime-local"
                required
                className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white [color-scheme:dark] transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Waktu Selesai</label>
              <input
                name="waktuSelesai"
                type="datetime-local"
                required
                className="w-full p-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white [color-scheme:dark] transition-all outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-semibold text-gray-300">Kelas Peserta (Pilih minimal 1)</label>
              <div className="space-x-3 text-xs">
                <button type="button" onClick={selectAll} className="text-crypto-accent font-medium hover:underline">Pilih Semua</button>
                <span className="text-crypto-border">|</span>
                <button type="button" onClick={deselectAll} className="text-gray-400 font-medium hover:underline">Batalkan Pilihan</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-4 border border-crypto-border rounded-xl bg-black/20 custom-scrollbar">
              {kelass.map(k => (
                <label 
                  key={k.id} 
                  className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                    selectedKelas.includes(k.id) 
                      ? 'bg-crypto-accent/20 border-crypto-accent text-white shadow-[0_0_10px_rgba(112,0,255,0.2)]' 
                      : 'bg-black/40 border-crypto-border hover:bg-crypto-card-hover text-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedKelas.includes(k.id)}
                    onChange={() => toggleKelas(k.id)}
                    className="w-4 h-4 text-crypto-accent rounded bg-black/50 border-crypto-border focus:ring-crypto-accent focus:ring-offset-0"
                  />
                  <span className="text-sm font-medium">{k.nama}</span>
                </label>
              ))}
              {kelass.length === 0 && (
                <p className="text-sm text-gray-500 col-span-full">Belum ada data kelas.</p>
              )}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-6 border-t border-crypto-border mt-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  name="acakSoal"
                  value="true"
                  checked={acakSoal}
                  onChange={(e) => setAcakSoal(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-11 h-6 bg-black/60 border border-crypto-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-crypto-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-crypto-accent peer-checked:after:bg-white"></div>
              </div>
              <div>
                <span className="block text-sm font-semibold text-white">Acak Urutan Soal</span>
                <span className="block text-xs text-gray-400 mt-0.5">Mencegah siswa menyontek urutan soal</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  name="acakOpsi"
                  value="true"
                  checked={acakOpsi}
                  onChange={(e) => setAcakOpsi(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-11 h-6 bg-black/60 border border-crypto-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-crypto-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-crypto-accent peer-checked:after:bg-white"></div>
              </div>
              <div>
                <span className="block text-sm font-semibold text-white">Acak Opsi Jawaban</span>
                <span className="block text-xs text-gray-400 mt-0.5">Mengacak urutan A, B, C, D, E</span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-crypto-border mt-8">
          <Link
            href={redirectUrl}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-crypto-card border border-crypto-border rounded-xl hover:bg-crypto-card-hover hover:text-white transition-all"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isLoading || selectedKelas.length === 0}
            className="px-6 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-neon hover:shadow-neon-accent"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Jadwal Ujian'}
          </button>
        </div>
      </form>
    </div>
  );
}
