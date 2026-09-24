import prisma from '@/lib/prisma';
import { CalendarDays, Clock, Users, ArrowRight, Sparkles, Calendar } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { decodeToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

function formatTanggal(date: Date | string) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d);
}

function formatJam(date: Date | string) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d).replace(':', '.');
}

function getSisaWaktu(target: Date, now: Date) {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return '';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    return `${diffMins} menit lagi`;
  }
  if (diffHours < 24) {
    return `${diffHours} jam lagi`;
  }
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `${diffDays} hari lagi`;
}

export default async function GuruJadwalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  const payload = decodeToken(token);
  if (!payload) redirect('/admin/login');
  const guruId = payload.id;

  const jadwals = await prisma.jadwalUjian.findMany({
    where: { bankSoal: { guruId } },
    include: {
      bankSoal: { include: { mapel: true } },
      kelas: true
    },
    orderBy: [
      { waktuMulai: 'asc' },
      { waktuSelesai: 'asc' }
    ]
  });

  const now = new Date();

  // Urutkan jadwal ujian dari yang paling dekat:
  // 1. Ujian aktif (sedang berjalan & akan datang) diprioritaskan di atas ujian yang sudah selesai
  // 2. Di antara yang belum selesai, sedang berjalan (ongoing) berada di paling atas
  // 3. Diurutkan berdasarkan waktu mulai (waktuMulai) paling dekat / paling awal
  const sortedJadwals = [...jadwals].sort((a, b) => {
    const aFinished = now > a.waktuSelesai;
    const bFinished = now > b.waktuSelesai;

    if (aFinished !== bFinished) {
      return aFinished ? 1 : -1;
    }

    const aOngoing = now >= a.waktuMulai && now <= a.waktuSelesai;
    const bOngoing = now >= b.waktuMulai && now <= b.waktuSelesai;

    if (aOngoing !== bOngoing) {
      return aOngoing ? -1 : 1;
    }

    const diffMulai = new Date(a.waktuMulai).getTime() - new Date(b.waktuMulai).getTime();
    if (diffMulai !== 0) return diffMulai;

    return new Date(a.waktuSelesai).getTime() - new Date(b.waktuSelesai).getTime();
  });

  // Cari ID ujian yang paling dekat (akan datang)
  const nearestUpcomingId = sortedJadwals.find(j => {
    const isOngoing = now >= j.waktuMulai && now <= j.waktuSelesai;
    const isFinished = now > j.waktuSelesai;
    return !isOngoing && !isFinished;
  })?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <CalendarDays className="w-6 h-6 text-crypto-accent" />
            Jadwal Ujian Saya
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Daftar jadwal ujian yang dibuat oleh Admin untuk mata pelajaran Anda, diurutkan dari jadwal paling dekat.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedJadwals.map((jadwal) => {
          const isOngoing = now >= jadwal.waktuMulai && now <= jadwal.waktuSelesai;
          const isFinished = now > jadwal.waktuSelesai;
          const isNearest = jadwal.id === nearestUpcomingId;
          
          let statusBadge = (
            <span className="px-2.5 py-1 text-xs font-semibold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
              Akan Datang
            </span>
          );
          if (isOngoing) {
            statusBadge = (
              <span className="px-2.5 py-1 text-xs font-semibold text-crypto-success bg-crypto-success/10 border border-crypto-success/20 rounded-full animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-crypto-success"></span>
                Sedang Berjalan
              </span>
            );
          }
          if (isFinished) {
            statusBadge = (
              <span className="px-2.5 py-1 text-xs font-semibold text-gray-400 bg-gray-500/10 border border-gray-500/20 rounded-full">
                Selesai
              </span>
            );
          }

          return (
            <div 
              key={jadwal.id} 
              className={`bg-crypto-card p-5 rounded-2xl border shadow-sm flex flex-col hover:-translate-y-1 hover:neon-accent transition-all group ${
                isOngoing
                  ? 'border-crypto-accent/50 shadow-[0_0_20px_rgba(112,0,255,0.15)] bg-gradient-to-br from-crypto-card via-crypto-accent/5 to-crypto-card'
                  : isNearest
                  ? 'border-amber-500/40'
                  : 'border-crypto-border'
              }`}
            >
              <div className="flex justify-between items-center mb-3 gap-2">
                <div className="flex items-center gap-2">
                  {statusBadge}
                  {isNearest && !isOngoing && !isFinished && (
                    <span className="px-2 py-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Terdekat
                    </span>
                  )}
                </div>
                
                {isFinished ? (
                  <Link 
                    href="/admin/guru/nilai" 
                    className="text-xs font-bold text-crypto-accent hover:text-crypto-accent-hover bg-crypto-accent/10 hover:bg-crypto-accent/20 border border-crypto-accent/20 px-2.5 py-1 rounded-md transition flex items-center gap-1"
                  >
                    Lihat Nilai <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : isOngoing ? (
                  <Link 
                    href={`/admin/jadwal/${jadwal.id}`} 
                    className="text-xs font-bold text-crypto-success hover:text-crypto-success/80 bg-crypto-success/10 hover:bg-crypto-success/20 border border-crypto-success/20 px-2.5 py-1 rounded-md transition flex items-center gap-1"
                  >
                    Pantau <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : null}
              </div>

              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-crypto-accent transition-colors">{jadwal.nama}</h3>
              <p className="text-sm font-medium text-crypto-accent/80 mb-4">{jadwal.bankSoal.mapel.nama} - {jadwal.bankSoal.judul}</p>

              <div className="space-y-2.5 text-sm text-gray-400 flex-1 bg-black/40 p-3.5 rounded-xl border border-crypto-border">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-crypto-accent mt-0.5 shrink-0" />
                  <span className="text-gray-200 font-medium text-xs sm:text-sm">
                    {formatTanggal(jadwal.waktuMulai)}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-crypto-accent shrink-0" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-300 text-xs sm:text-sm">
                      {formatJam(jadwal.waktuMulai)} - {formatJam(jadwal.waktuSelesai)} WIB
                    </span>
                    {!isOngoing && !isFinished && (
                      <span className="text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                        {getSisaWaktu(jadwal.waktuMulai, now)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1 border-t border-crypto-border/50">
                  <Users className="w-4 h-4 text-crypto-accent mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {jadwal.kelas.map(k => (
                      <span key={k.id} className="text-[10px] px-2 py-0.5 bg-crypto-card text-gray-300 border border-crypto-border rounded-md font-medium">
                        {k.nama}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {sortedJadwals.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-black/40 rounded-2xl border-2 border-dashed border-crypto-border">
            Anda belum memiliki jadwal ujian untuk mata pelajaran Anda.
          </div>
        )}
      </div>
    </div>
  );
}
