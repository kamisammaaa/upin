'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJadwalUjian } from '@/app/actions/jadwal';
import Link from 'next/link';
import { ArrowLeft, Save, CalendarPlus, Type, BookOpen, Clock, Users, CheckSquare } from 'lucide-react';

export default function TambahJadwalClient({ 
  bankSoals, 
  kelass,
  redirectUrl = '/admin/jadwal'
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

  const inputCls = 'w-full pl-10 pr-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-colors';
  const selectCls = 'w-full pl-10 pr-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white transition-colors [&>option]:bg-gray-900';
  const labelCls = 'block text-sm font-semibold text-gray-300 mb-2';

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href={redirectUrl} className="inline-flex w-fit p-2 border border-crypto-border rounded-xl bg-crypto-card text-gray-400 hover:text-white hover:bg-crypto-card-hover transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-6 h-6 text-crypto-accent" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Buat Jadwal Ujian Baru</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">Tentukan waktu, bank soal yang digunakan, dan kelas yang dapat mengakses.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium">{error}</div>
        )}

        <div className="space-y-5">
          <div>
            <label className={labelCls}>Nama Jadwal Ujian</label>
            <div className="relative">
              <Type className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                name="nama"
                type="text"
                required
                placeholder="Contoh: PTS Ganjil - Kewirausahaan"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Bank Soal yang Digunakan</label>
            <div className="relative">
              <BookOpen className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <select 
                name="bankSoalId"
                defaultValue=""
                required
                className={selectCls}
              >
                <option value="" disabled>Pilih bank soal...</option>
                {bankSoals.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.judul} — {b.mapel.nama} (Oleh: {b.guru.nama})
                  </option>
                ))}
              </select>
            </div>
            {bankSoals.length === 0 && (
              <p className="text-sm text-red-400 mt-2">Belum ada bank soal tersedia. Silakan buat bank soal terlebih dahulu.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Waktu Mulai</label>
              <div className="relative">
                <Clock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  name="waktuMulai"
                  type="datetime-local"
                  required
                  className={`${inputCls} [color-scheme:dark]`}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Waktu Selesai</label>
              <div className="relative">
                <Clock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  name="waktuSelesai"
                  type="datetime-local"
                  required
                  className={`${inputCls} [color-scheme:dark]`}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-end mb-3">
              <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4" /> Kelas Peserta (Pilih minimal 1)
              </label>
              <div className="space-x-3 text-xs">
                <button type="button" onClick={selectAll} className="text-crypto-accent font-medium hover:underline">Pilih Semua</button>
                <span className="text-gray-600">|</span>
                <button type="button" onClick={deselectAll} className="text-gray-400 font-medium hover:underline">Batalkan Pilihan</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-4 border border-crypto-border rounded-xl bg-black/40 custom-scrollbar">
              {kelass.map(k => (
                <label 
                  key={k.id} 
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                    selectedKelas.includes(k.id) 
                      ? 'bg-crypto-accent/20 border-crypto-accent/30' 
                      : 'bg-crypto-card border-crypto-border hover:bg-crypto-card-hover'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedKelas.includes(k.id)}
                    onChange={() => toggleKelas(k.id)}
                    className="w-4 h-4 text-crypto-accent rounded bg-gray-900 border-gray-600 focus:ring-crypto-accent focus:ring-offset-gray-900"
                  />
                  <span className={`text-sm font-medium ${selectedKelas.includes(k.id) ? 'text-white' : 'text-gray-300'}`}>
                    {k.nama}
                  </span>
                </label>
              ))}
              {kelass.length === 0 && (
                <p className="text-sm text-gray-500 col-span-full">Belum ada data kelas.</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-6 border-t border-crypto-border">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  name="acakSoal"
                  value="true"
                  checked={acakSoal}
                  onChange={(e) => setAcakSoal(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-crypto-accent/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-crypto-accent"></div>
              </div>
              <div>
                <span className="block text-sm font-semibold text-gray-200">Acak Urutan Soal</span>
                <span className="block text-xs text-gray-500">Mencegah siswa menyontek urutan soal</span>
              </div>
            </label>

            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  name="acakOpsi"
                  value="true"
                  checked={acakOpsi}
                  onChange={(e) => setAcakOpsi(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-crypto-accent/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-crypto-accent"></div>
              </div>
              <div>
                <span className="block text-sm font-semibold text-gray-200">Acak Opsi Jawaban</span>
                <span className="block text-xs text-gray-500">Mengacak urutan A, B, C, D, E</span>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-crypto-border flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-black/40 border border-crypto-border rounded-xl hover:text-white hover:bg-gray-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading || selectedKelas.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:neon-accent"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Menyimpan...' : 'Simpan Jadwal Ujian'}
          </button>
        </div>
      </form>
    </div>
  );
}
