import prisma from '@/lib/prisma';
import { Users, GraduationCap, Building2, BookOpen, MapPin, MonitorPlay } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [totalSiswa, totalKelas, totalRuangan, totalMapel, ruangans, pengaturan] = await Promise.all([
    prisma.siswa.count(),
    prisma.kelas.count(),
    prisma.ruangan.count(),
    prisma.mataPelajaran.count(),
    prisma.ruangan.findMany({
      include: {
        _count: {
          select: { siswas: true }
        }
      }
    }),
    prisma.pengaturan.findUnique({ where: { id: 1 } })
  ]);

  const stats = [
    { label: 'Total Siswa', value: totalSiswa, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Kelas', value: totalKelas, icon: GraduationCap, color: 'bg-emerald-500' },
    { label: 'Total Ruangan', value: totalRuangan, icon: Building2, color: 'bg-orange-500' },
    { label: 'Total Mapel', value: totalMapel, icon: BookOpen, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-wide">Ringkasan Sistem</h2>
        <p className="mt-1 text-sm text-gray-400">
          Statistik data utama pada sistem {pengaturan?.namaSistem || 'PintarCBT'}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            className="flex items-center p-6 bg-crypto-card rounded-2xl border border-crypto-border transition-all hover:bg-crypto-card-hover hover:-translate-y-1 hover:neon-accent"
          >
            <div className={`flex items-center justify-center w-14 h-14 rounded-xl text-white ${stat.color} shadow-lg`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div className="ml-5">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{stat.label}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Daftar Ruangan Aktif */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide">
          <MonitorPlay className="w-5 h-5 text-crypto-accent" />
          Pemantauan Ujian (Ruangan)
        </h3>
        {ruangans.length === 0 ? (
          <div className="bg-crypto-card p-8 rounded-2xl border border-crypto-border text-center">
            <p className="text-gray-400">Tidak ada ruangan yang tersedia di database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ruangans.map((r: any) => (
              <div key={r.id} className="bg-crypto-card rounded-2xl border border-crypto-border p-6 flex flex-col transition-all hover:-translate-y-1 hover:neon-accent group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-crypto-accent group-hover:animate-bounce" />
                      {r.nama}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Kapasitas: {r.kapasitas} Kursi
                    </p>
                  </div>
                </div>

                <div className="flex-1 mb-6 bg-black/40 p-4 rounded-xl border border-crypto-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Token Ruangan:</p>
                    <p className="text-lg font-mono font-bold text-crypto-accent neon-accent">{r.token || 'BELUM DIGENERATE'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Siswa Aktif:</p>
                    <p className="text-lg font-bold text-crypto-success">{r._count.siswas} Anak</p>
                  </div>
                </div>

                <Link 
                  href={`/admin/proktor/monitor/${r.id}`}
                  className="w-full flex justify-center items-center gap-2 bg-crypto-accent hover:bg-crypto-accent-hover text-white font-bold py-3 px-4 rounded-xl transition-all hover:neon-accent-strong"
                >
                  <MonitorPlay className="w-5 h-5" />
                  Pantau Ujian
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
