'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createJadwalUjian } from '@/app/actions/jadwal';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  CalendarPlus, 
  Type, 
  BookOpen, 
  Clock, 
  Users, 
  Search,
  CheckSquare,
  Square,
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function TambahJadwalClient({ 
  bankSoals, 
  kelass,
  siswas = [],
  redirectUrl = '/admin/jadwal'
}: { 
  bankSoals: any[]; 
  kelass: any[];
  siswas?: any[];
  redirectUrl?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tipeUjian, setTipeUjian] = useState<'REGULER' | 'SUSULAN'>('REGULER');
  const [selectedKelas, setSelectedKelas] = useState<number[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState<number[]>([]);
  const [siswaSearch, setSiswaSearch] = useState('');
  const [siswaKelasFilter, setSiswaKelasFilter] = useState<string>('all');
  const [acakSoal, setAcakSoal] = useState(false);
  const [acakOpsi, setAcakOpsi] = useState(false);

  // Filter bank soal
  const availableBankSoals = useMemo(() => {
    if (tipeUjian === 'SUSULAN') {
      return bankSoals;
    }
    // Reguler: hanya yang belum dipakai reguler
    return bankSoals.filter(b => !b.jadwals?.some((j: any) => j.tipeUjian === 'REGULER'));
  }, [bankSoals, tipeUjian]);

  // Filter siswa untuk ujian susulan
  const filteredSiswas = useMemo(() => {
    return siswas.filter(s => {
      const matchKelas = siswaKelasFilter === 'all' || s.kelasId === Number(siswaKelasFilter);
      const query = siswaSearch.toLowerCase().trim();
      const matchSearch = !query || 
        s.nama.toLowerCase().includes(query) || 
        s.nis.toLowerCase().includes(query);
      return matchKelas && matchSearch;
    });
  }, [siswas, siswaKelasFilter, siswaSearch]);

  const toggleKelas = (id: number) => {
    setSelectedKelas(prev => 
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const selectAllKelas = () => setSelectedKelas(kelass.map(k => k.id));
  const deselectAllKelas = () => setSelectedKelas([]);

  const toggleSiswa = (id: number) => {
    setSelectedSiswa(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAllFilteredSiswa = () => {
    const idsToAdd = filteredSiswas.map(s => s.id);
    setSelectedSiswa(prev => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const deselectAllFilteredSiswa = () => {
    const idsToRemove = new Set(filteredSiswas.map(s => s.id));
    setSelectedSiswa(prev => prev.filter(id => !idsToRemove.has(id)));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (tipeUjian === 'REGULER' && selectedKelas.length === 0) {
      setError('Pilih minimal 1 kelas peserta untuk ujian reguler.');
      setIsLoading(false);
      return;
    }

    if (tipeUjian === 'SUSULAN' && selectedSiswa.length === 0) {
      setError('Pilih minimal 1 siswa peserta untuk ujian susulan.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append('tipeUjian', tipeUjian);

    if (tipeUjian === 'REGULER') {
      selectedKelas.forEach(id => {
        formData.append('kelasIds', id.toString());
      });
    } else {
      selectedSiswa.forEach(id => {
        formData.append('siswaIds', id.toString());
      });
    }

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
          <p className="text-sm text-gray-400 mt-1">Tentukan tipe ujian (Reguler atau Susulan), waktu, bank soal, dan peserta.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-crypto-card p-5 sm:p-8 rounded-2xl border border-crypto-border space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium">{error}</div>
        )}

        <div className="space-y-6">
          {/* Pilihan Tipe Ujian */}
          <div>
            <label className={labelCls}>Tipe Ujian</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label 
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  tipeUjian === 'REGULER'
                    ? 'bg-crypto-accent/15 border-crypto-accent shadow-[0_0_15px_rgba(0,180,216,0.15)]'
                    : 'bg-black/40 border-crypto-border hover:bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name="tipeRadio"
                  value="REGULER"
                  checked={tipeUjian === 'REGULER'}
                  onChange={() => setTipeUjian('REGULER')}
                  className="mt-1 text-crypto-accent focus:ring-crypto-accent"
                />
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-crypto-accent" />
                    Ujian Reguler
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ujian terjadwal massal untuk semua siswa dalam satu atau beberapa kelas.
                  </p>
                </div>
              </label>

              <label 
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  tipeUjian === 'SUSULAN'
                    ? 'bg-amber-500/15 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-black/40 border-crypto-border hover:bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name="tipeRadio"
                  value="SUSULAN"
                  checked={tipeUjian === 'SUSULAN'}
                  onChange={() => setTipeUjian('SUSULAN')}
                  className="mt-1 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <p className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Ujian Susulan
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ujian untuk siswa tertentu yang berhalangan hadir (sakit/izin). Menggunakan bank soal yang sama.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className={labelCls}>Nama Jadwal Ujian</label>
            <div className="relative">
              <Type className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                name="nama"
                type="text"
                required
                placeholder={tipeUjian === 'SUSULAN' ? 'Contoh: PTS Ganjil - Susulan' : 'Contoh: PTS Ganjil - Kewirausahaan'}
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
                {availableBankSoals.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.judul} — {b.mapel.nama} (Oleh: {b.guru.nama})
                  </option>
                ))}
              </select>
            </div>
            {availableBankSoals.length === 0 && (
              <p className="text-sm text-yellow-400/90 mt-2 bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded-lg">
                Tidak ada bank soal yang tersedia untuk dipilih. Semua bank soal sudah digunakan pada jadwal ujian reguler atau belum dibuat.
              </p>
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

          {/* Bagian Pemilihan Peserta Berdasarkan Tipe Ujian */}
          {tipeUjian === 'REGULER' ? (
            <div className="pt-2">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-crypto-accent" /> Kelas Peserta (Pilih minimal 1)
                </label>
                <div className="space-x-3 text-xs">
                  <button type="button" onClick={selectAllKelas} className="text-crypto-accent font-medium hover:underline">Pilih Semua</button>
                  <span className="text-gray-600">|</span>
                  <button type="button" onClick={deselectAllKelas} className="text-gray-400 font-medium hover:underline">Batalkan Pilihan</button>
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
          ) : (
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 mb-3">
                <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400" /> 
                  Peserta Ujian Susulan ({selectedSiswa.length} siswa terpilih)
                </label>
                <div className="space-x-3 text-xs">
                  <button type="button" onClick={selectAllFilteredSiswa} className="text-amber-400 font-medium hover:underline">Pilih yang Tampil</button>
                  <span className="text-gray-600">|</span>
                  <button type="button" onClick={deselectAllFilteredSiswa} className="text-gray-400 font-medium hover:underline">Batal Pilihan</button>
                </div>
              </div>

              {/* Filter Kelas dan Search Siswa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={siswaSearch}
                    onChange={(e) => setSiswaSearch(e.target.value)}
                    placeholder="Cari siswa berdasarkan nama / NIS..."
                    className="w-full pl-9 pr-3 py-2 bg-black/50 border border-crypto-border rounded-xl text-xs text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <select
                  value={siswaKelasFilter}
                  onChange={(e) => setSiswaKelasFilter(e.target.value)}
                  className="px-3 py-2 bg-black/50 border border-crypto-border rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/50 [&>option]:bg-gray-900"
                >
                  <option value="all">Semua Kelas ({siswas.length} siswa)</option>
                  {kelass.map(k => (
                    <option key={k.id} value={k.id}>Kelas {k.nama}</option>
                  ))}
                </select>
              </div>

              {/* Daftar Siswa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-4 border border-crypto-border rounded-xl bg-black/40 custom-scrollbar">
                {filteredSiswas.map(s => {
                  const isSelected = selectedSiswa.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSiswa(s.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer border transition select-none ${
                        isSelected 
                          ? 'bg-amber-500/20 border-amber-500/40' 
                          : 'bg-crypto-card border-crypto-border hover:bg-white/5'
                      }`}
                    >
                      <div className="shrink-0 text-amber-400">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-amber-200' : 'text-white'}`}>
                          {s.nama}
                        </p>
                        <div className="flex items-center justify-between gap-1 mt-0.5 text-[10px] text-gray-400 font-mono">
                          <span>NIS: {s.nis}</span>
                          <span className="px-1.5 py-0.2 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20 font-sans">
                            {s.kelas?.nama}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredSiswas.length === 0 && (
                  <p className="text-sm text-gray-500 col-span-full py-4 text-center">
                    Tidak ada siswa yang sesuai dengan pencarian atau filter.
                  </p>
                )}
              </div>
            </div>
          )}

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
            disabled={isLoading || (tipeUjian === 'REGULER' ? selectedKelas.length === 0 : selectedSiswa.length === 0)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              tipeUjian === 'SUSULAN' 
                ? 'bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold' 
                : 'bg-crypto-accent hover:bg-crypto-accent-hover hover:neon-accent'
            }`}
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Menyimpan...' : (tipeUjian === 'SUSULAN' ? 'Simpan Jadwal Susulan' : 'Simpan Jadwal Ujian')}
          </button>
        </div>
      </form>
    </div>
  );
}
