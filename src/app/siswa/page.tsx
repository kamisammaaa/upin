import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Book, Clock, LogOut, CheckCircle2, AlertCircle, Award, EyeOff, Calendar } from 'lucide-react';
import { logoutSiswa } from '../actions/auth';

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

  // Cari jadwal ujian aktif yang melibatkan kelas siswa
  const now = new Date();
  const jadwalAktif = await prisma.jadwalUjian.findMany({
    where: {
      kelas: {
        some: {
          id: siswa.kelasId
        }
      },
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
    }
  });

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
              {pengaturan?.namaSistem || 'PintarCBT'}
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

        {jadwalAktif.length === 0 ? (
          <div className="bg-crypto-card rounded-2xl border border-dashed border-crypto-border p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-crypto-success mx-auto mb-4 opacity-80" />
            <h3 className="text-lg font-bold text-white">Tidak Ada Ujian</h3>
            <p className="text-gray-400 mt-2 text-sm">Saat ini tidak ada ujian aktif yang dijadwalkan untuk kelas Anda.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jadwalAktif.map(jadwal => {
              const isOnGoing = now >= jadwal.waktuMulai && now <= jadwal.waktuSelesai;
              const sesiSiswa = jadwal.sesiSiswa[0]; // Cek apakah sudah pernah mengerjakan
              
              const isFinished = sesiSiswa?.status === 'FINISHED';
              
              return (
                <div key={jadwal.id} className="bg-crypto-card rounded-2xl border border-crypto-border p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all hover:bg-crypto-card-hover hover:-translate-y-1 hover:neon-accent group">
                  <div>
                    <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-md">
                      {jadwal.bankSoal.mapel.nama}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2 group-hover:text-crypto-accent transition-colors">{jadwal.nama}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {jadwal.waktuSelesai.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span>{siswa.ruangan ? siswa.ruangan.nama : 'Ruangan Belum Ditentukan'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0">
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
                        <button className="w-full sm:w-auto px-6 py-2.5 bg-crypto-accent hover:bg-crypto-accent-hover text-white font-bold rounded-xl transition-all hover:neon-accent-strong shadow-lg">
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
