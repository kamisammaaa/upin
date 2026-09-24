import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Book, Clock, LogOut, CheckCircle2, AlertCircle, Award, EyeOff, Calendar, MapPin, Sparkles } from 'lucide-react';
import { logoutSiswa } from '../actions/auth';
import { submitExam } from '../actions/exam';
import ThemeToggle from '../admin/components/ThemeToggle';

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

export default async function SiswaDashboard() {
  const cookieStore = await cookies();
  const siswaId = cookieStore.get('siswaId')?.value;

  if (!siswaId) {
    redirect('/');
  }

  const pengaturan = await prisma.pengaturan.findUnique({
    where: { id: 1 }
  });

  const siswa = await prisma.siswa.findUnique({
    where: { id: parseInt(siswaId) },
    include: {
      kelas: true,
      ruangan: true
    }
  });

  if (!siswa) {
    redirect('/');
  }

  const now = new Date();

  // Otomatis finalisasi ujian siswa yang sudah melewati batas waktuSelesai
  const expiredSessions = await prisma.sesiUjianSiswa.findMany({
    where: {
      siswaId: siswa.id,
      status: 'ONGOING',
      jadwal: {
        waktuSelesai: { lte: now }
      }
    },
    select: { id: true }
  });
  for (const s of expiredSessions) {
    await submitExam(s.id);
  }

  // Cari jadwal ujian aktif yang melibatkan kelas siswa (reguler) atau siswa khusus (susulan)
  const jadwalAktif = await prisma.jadwalUjian.findMany({
    where: {
      OR: [
        {
          tipeUjian: 'REGULER',
          kelas: {
            some: {
              id: siswa.kelasId
            }
          }
        },
        {
          tipeUjian: 'SUSULAN',
          siswaKhusus: {
            some: {
              id: siswa.id
            }
          }
        }
      ],
      waktuSelesai: {
        gte: now
      }
    },
    include: {
      bankSoal: {
        include: { mapel: true }
      },
      sesiSiswa: {
        where: {
          siswaId: siswa.id
        }
      }
    },
    orderBy: [
      { waktuMulai: 'asc' },
      { waktuSelesai: 'asc' }
    ]
  });

  // Urutkan jadwal ujian dari yang paling dekat:
  // 1. Ujian yang belum selesai dikerjakan diprioritaskan di atas ujian yang sudah selesai
  // 2. Di antara yang belum selesai, jika sedang berlangsung (ongoing) ditempatkan paling atas
  // 3. Diurutkan berdasarkan waktu mulai (waktuMulai) paling dekat / paling awal
  const sortedJadwalAktif = [...jadwalAktif].sort((a, b) => {
    const sesiA = a.sesiSiswa[0];
    const sesiB = b.sesiSiswa[0];
    const aFinished = sesiA?.status === 'FINISHED';
    const bFinished = sesiB?.status === 'FINISHED';

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

  // Cari ID ujian yang paling dekat (belum mulai dan belum selesai)
  const nearestUpcomingId = sortedJadwalAktif.find(j => {
    const sesi = j.sesiSiswa[0];
    const isFinished = sesi?.status === 'FINISHED';
    const isOngoing = now >= j.waktuMulai && now <= j.waktuSelesai;
    return !isFinished && !isOngoing;
  })?.id;

  // Cari riwayat ujian yang telah selesai diikuti siswa ini
  const riwayatUjian = await prisma.sesiUjianSiswa.findMany({
    where: {
      siswaId: siswa.id,
      status: 'FINISHED'
    },
    include: {
      jadwal: {
        include: {
          bankSoal: {
            include: { mapel: true }
          }
        }
      }
    },
    orderBy: {
      waktuSelesai: 'desc'
    }
  });

  return (
    <div className="min-h-screen bg-crypto-bg text-gray-100 font-sans pb-12">
      {/* Header */}
      <header className="bg-[#09090b]/80 backdrop-blur-md border-b border-crypto-border sticky top-0 z-10">
        <div className="w-full px-4 sm:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-widest text-white neon-accent">
              {pengaturan?.namaSistem || 'UPIN'}
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              {pengaturan?.namaSekolah || 'SMK Banjar Asri'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-sm text-white">{siswa.nama}</p>
              <p className="text-xs text-crypto-accent font-medium">{siswa.kelas.nama}</p>
            </div>
            <ThemeToggle initialTheme={pengaturan?.temaWarna} />
            <form action={logoutSiswa}>
              <button 
                className="p-2 bg-crypto-card hover:bg-crypto-card-hover text-red-400 hover:text-red-300 rounded-xl transition-colors border border-crypto-border hover:border-red-500/30"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-8 mt-8 space-y-8">
        <div className="bg-crypto-card rounded-2xl border border-crypto-border p-5 sm:hidden shadow-lg">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Selamat Datang,</p>
          <p className="font-bold text-lg text-white">{siswa.nama}</p>
          <span className="inline-block mt-2 px-2.5 py-1 text-xs font-semibold text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-md">
            {siswa.kelas.nama}
          </span>
        </div>

        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide">
          <Book className="w-5 h-5 text-crypto-accent" />
          Daftar Ujian Anda
        </h2>

        {sortedJadwalAktif.length === 0 ? (
          <div className="bg-crypto-card rounded-2xl border border-dashed border-crypto-border p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-crypto-success mx-auto mb-4 opacity-80" />
            <h3 className="text-lg font-bold text-white">Tidak Ada Ujian</h3>
            <p className="text-gray-400 mt-2 text-sm">Saat ini tidak ada ujian aktif yang dijadwalkan untuk kelas Anda.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedJadwalAktif.map(jadwal => {
              const isOnGoing = now >= jadwal.waktuMulai && now <= jadwal.waktuSelesai;
              const sesiSiswa = jadwal.sesiSiswa[0]; // Cek apakah sudah pernah mengerjakan
              const isFinished = sesiSiswa?.status === 'FINISHED';
              const isNearest = jadwal.id === nearestUpcomingId;
              
              return (
                <div 
                  key={jadwal.id} 
                  className={`bg-crypto-card rounded-2xl border p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all hover:bg-crypto-card-hover hover:-translate-y-1 hover:neon-accent group ${
                    isOnGoing && !isFinished
                      ? 'border-crypto-accent/50 shadow-[0_0_20px_rgba(112,0,255,0.15)] bg-gradient-to-r from-crypto-card via-crypto-accent/5 to-crypto-card'
                      : isNearest
                      ? 'border-amber-500/40'
                      : 'border-crypto-border'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-md">
                        {jadwal.bankSoal.mapel.nama}
                      </span>
                      {jadwal.tipeUjian === 'SUSULAN' && (
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded-md">
                          Ujian Susulan
                        </span>
                      )}
                      {isOnGoing && !isFinished && (
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Sedang Berlangsung
                        </span>
                      )}
                      {isNearest && !isOnGoing && !isFinished && (
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Ujian Terdekat
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-2 group-hover:text-crypto-accent transition-colors">{jadwal.nama}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs sm:text-sm text-gray-400">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <Calendar className="w-4 h-4 text-crypto-accent" />
                        {formatTanggal(jadwal.waktuMulai)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {formatJam(jadwal.waktuMulai)} - {formatJam(jadwal.waktuSelesai)} WIB
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {siswa.ruangan ? siswa.ruangan.nama : 'Ruangan Belum Ditentukan'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex-shrink-0">
                    {isFinished ? (
                      <div className="px-4 py-2 bg-crypto-success/10 text-crypto-success border border-crypto-success/20 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Selesai Dikerjakan
                      </div>
                    ) : !isOnGoing ? (
                      <div className="px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Belum Waktunya
                      </div>
                    ) : (
                      <form action={`/siswa/token/${jadwal.id}`}>
                        <button className="w-full sm:w-auto px-6 py-2.5 bg-crypto-accent hover:bg-crypto-accent-hover text-white font-bold rounded-xl transition-all hover:neon-accent-strong shadow-lg flex items-center justify-center gap-2">
                          {sesiSiswa ? 'Lanjutkan' : 'Mulai Ujian'} &rarr;
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Section Riwayat & Rekap Nilai Ujian */}
        <div className="mt-12">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide">
            <Award className="w-5 h-5 text-crypto-accent" />
            Riwayat & Rekap Ujian Selesai
          </h2>

          {riwayatUjian.length === 0 ? (
            <div className="bg-crypto-card rounded-2xl border border-crypto-border p-8 text-center text-gray-500 text-sm">
              Belum ada riwayat ujian yang diselesaikan.
            </div>
          ) : (
            <div className="grid gap-4">
              {riwayatUjian.map((sesi) => {
                const showScore = pengaturan?.tampilkanNilaiSiswa !== false;
                const score = sesi.nilaiAkhir !== null && sesi.nilaiAkhir !== undefined ? Math.round(sesi.nilaiAkhir) : 0;
                
                return (
                  <div 
                    key={sesi.id} 
                    className="bg-crypto-card rounded-2xl border border-crypto-border p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-colors hover:bg-crypto-card-hover"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-md">
                          {sesi.jadwal.bankSoal.mapel.nama}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {sesi.waktuSelesai ? new Date(sesi.waktuSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5">{sesi.jadwal.nama}</h3>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      {showScore ? (
                        <div className="px-4 py-2 bg-crypto-accent/15 border border-crypto-accent/30 rounded-xl flex items-center gap-2 shadow-sm">
                          <span className="text-xs text-gray-400 font-medium">Nilai Akhir:</span>
                          <span className="text-xl font-extrabold text-crypto-accent neon-accent">{score}</span>
                        </div>
                      ) : (
                        <div className="px-4 py-2 bg-gray-800/80 border border-gray-700 text-gray-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                          <EyeOff className="w-4 h-4 text-gray-500" />
                          <span>Nilai Disembunyikan</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
