'use client';

import { Calendar, Clock, Users, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { deleteJadwalUjian } from '@/app/actions/jadwal';
import { useRouter } from 'next/navigation';

export default function JadwalListClient({ jadwals }: { jadwals: any[] }) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal ujian ini?')) {
      setLoadingId(id);
      const res = await deleteJadwalUjian(id);
      if (!res.success) {
        alert(res.message);
      } else {
        router.refresh();
      }
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <Calendar className="w-6 h-6 text-crypto-accent" />
            Jadwal Ujian
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Atur pelaksanaan ujian, pemetaan waktu, dan peserta ujian.
          </p>
        </div>
        <Link 
          href="/admin/jadwal/tambah"
          className="px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent"
        >
          + Buat Jadwal Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {jadwals.map((jadwal: any) => {
          const status = jadwal.waktuMulai <= new Date() && jadwal.waktuSelesai >= new Date() 
            ? 'Sedang Berjalan' 
            : jadwal.waktuSelesai < new Date() 
              ? 'Selesai' 
              : 'Belum Mulai';
              
          const statusColor = status === 'Sedang Berjalan' 
            ? 'bg-crypto-success/10 text-crypto-success border-crypto-success/20' 
            : status === 'Selesai'
              ? 'bg-gray-800 text-gray-400 border-gray-700'
              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';

          return (
            <div key={jadwal.id} className="bg-crypto-card rounded-2xl border border-crypto-border transition-all hover:bg-crypto-card-hover hover:-translate-y-1 hover:neon-accent overflow-hidden flex flex-col group">
              <div className="p-5 border-b border-crypto-border flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-crypto-accent transition-colors">{jadwal.nama}</h3>
                  <p className="text-sm font-medium text-crypto-accent mt-1">{jadwal.bankSoal.mapel.nama}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${statusColor}`}>
                  {status}
                </span>
              </div>
              
              <div className="p-5 grid grid-cols-2 gap-4 flex-grow">
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium text-white">Waktu Pelaksanaan</p>
                      <p className="text-xs text-gray-500 mt-0.5">{jadwal.waktuMulai.toLocaleString('id-ID')} - <br/>{jadwal.waktuSelesai.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium text-white">Kelas Peserta</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {jadwal.kelas.map((k: any) => (
                          <span key={k.id} className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">
                            {k.nama}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/40 p-4 border-t border-crypto-border flex gap-2 justify-end">
                <button 
                  onClick={() => handleDelete(jadwal.id)}
                  disabled={loadingId === jadwal.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {loadingId === jadwal.id ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          );
        })}

        {jadwals.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-crypto-card rounded-2xl border border-dashed border-crypto-border">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="font-medium text-gray-400">Belum ada jadwal ujian</p>
            <p className="text-sm mt-1">Silakan klik tombol + Buat Jadwal Baru.</p>
          </div>
        )}
      </div>
    </div>
  );
}
