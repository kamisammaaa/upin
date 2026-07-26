import prisma from '@/lib/prisma';
import { Users, GraduationCap, Building2, BookOpen, MapPin, MonitorPlay, CalendarDays, UserCog, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay   = new Date(now); endOfDay.setHours(23, 59, 59, 999);

  const [
    totalSiswa, totalKelas, totalRuangan, totalMapel,
    totalGuru, totalBankSoal, totalJadwalHariIni,
    ruangans, jadwalHariIni, pengaturan
  ] = await Promise.all([
    prisma.siswa.count(),
    prisma.kelas.count(),
    prisma.ruangan.count(),
    prisma.mataPelajaran.count(),
    prisma.user.count({ where: { role: 'GURU' } }),
    prisma.bankSoal.count(),
    prisma.jadwalUjian.count({
      where: { waktuMulai: { gte: startOfDay }, waktuSelesai: { lte: endOfDay } }
    }),
    prisma.ruangan.findMany({
      include: { _count: { select: { siswas: true } } }
    }),
    prisma.jadwalUjian.findMany({
      where: { waktuMulai: { gte: startOfDay }, waktuSelesai: { lte: endOfDay } },
      include: { bankSoal: { include: { mapel: true } }, kelas: true },
      orderBy: { waktuMulai: 'asc' }
    }),
    prisma.pengaturan.findUnique({ where: { id: 1 } })
  ]);

  const stats = [
    { label: 'Total Siswa', value: totalSiswa, icon: Users, color: 'from-blue-600 to-blue-400', href: '/admin/master/siswa' },
    { label: 'Total Kelas', value: totalKelas, icon: GraduationCap, color: 'from-emerald-600 to-emerald-400', href: '/admin/master/kelas' },
    { label: 'Total Guru', value: totalGuru, icon: UserCog, color: 'from-violet-600 to-violet-400', href: '/admin/master/guru' },
    { label: 'Total Mapel', value: totalMapel, icon: BookOpen, color: 'from-orange-600 to-orange-400', href: '/admin/master/mapel' },
    { label: 'Total Ruangan', value: totalRuangan, icon: Building2, color: 'from-pink-600 to-pink-400', href: '/admin/master/ruangan' },
    { label: 'Bank Soal', value: totalBankSoal, icon: BookOpen, color: 'from-yellow-600 to-yellow-400', href: '/admin/bank-soal' },
    { label: 'Jadwal Hari Ini', value: totalJadwalHariIni, icon: CalendarDays, color: 'from-cyan-600 to-cyan-400', href: '/admin/jadwal' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-wide">Ringkasan Sistem</h2>
        <p className="mt-1 text-sm text-gray-400">
          {pengaturan?.namaSistem || 'PintarCBT'} &bull; T.A {pengaturan?.tahunAjaran || '2024/2025'} Semester {pengaturan?.semester || 'Ganjil'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="relative overflow-hidden flex flex-col p-5 bg-crypto-card rounded-2xl border border-crypto-border transition-all hover:bg-crypto-card-hover hover:-translate-y-1 hover:neon-accent group"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider leading-tight">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Jadwal Hari Ini */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide">
          <CalendarDays className="w-5 h-5 text-crypto-accent" />
          Jadwal Ujian Hari Ini
        </h3>
        {jadwalHariIni.length === 0 ? (
          <div className="bg-crypto-card p-8 rounded-2xl border border-crypto-border text-center">
            <CalendarDays className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Tidak ada jadwal ujian untuk hari ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jadwalHariIni.map((j: any) => {
              const isActive = j.waktuMulai <= now && j.waktuSelesai >= now;
              const isFinished = j.waktuSelesai < now;
              const statusLabel = isActive ? 'Berlangsung' : isFinished ? 'Selesai' : 'Akan Datang';
              const statusClass = isActive
                ? 'bg-crypto-success/10 text-crypto-success border-crypto-success/20'
                : isFinished
                ? 'bg-gray-700/50 text-gray-400 border-gray-600/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';

              return (
                <Link key={j.id} href={`/admin/jadwal/${j.id}`} className="bg-crypto-card rounded-2xl border border-crypto-border p-5 hover:bg-crypto-card-hover hover:-translate-y-1 transition-all block">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-white">{j.nama}</h4>
                      <p className="text-sm text-gray-400 mt-0.5">{j.bankSoal.mapel.nama}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusClass} flex items-center gap-1`}>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-crypto-success animate-ping inline-block" />}
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(j.waktuMulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {' \u2013 '}
                    {new Date(j.waktuSelesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    <span className="ml-auto text-gray-600 truncate">{j.kelas.map((k: any) => k.nama).join(', ')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Ruangan Monitor */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide">
          <MonitorPlay className="w-5 h-5 text-crypto-accent" />
          Pemantauan Ujian (Ruangan)
        </h3>
        {ruangans.length === 0 ? (
          <div className="bg-crypto-card p-8 rounded-2xl border border-crypto-border text-center">
            <p className="text-gray-400">
              Tidak ada ruangan.{' '}
              <Link href="/admin/master/ruangan/tambah" className="text-crypto-accent hover:underline">
                Tambah Ruangan
              </Link>
            </p>
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
                    <p className="text-sm text-gray-400 mt-1">Kapasitas: {r.kapasitas} Kursi</p>
                  </div>
                </div>
                <div className="flex-1 mb-6 bg-black/40 p-4 rounded-xl border border-crypto-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Token:</p>
                    <p className="text-lg font-mono font-bold text-crypto-accent neon-accent">{r.token || 'BELUM DIGENERATE'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Siswa:</p>
                    <p className="text-lg font-bold text-crypto-success">{r._count.siswas} Anak</p>
                  </div>
                </div>
                <Link href={`/admin/proktor/monitor/${r.id}`} className="w-full flex justify-center items-center gap-2 bg-crypto-accent hover:bg-crypto-accent-hover text-white font-bold py-3 px-4 rounded-xl transition-all hover:neon-accent-strong">
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
