import prisma from '@/lib/prisma';
import { CalendarDays, PlusCircle, Clock, Users, ArrowRight } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function GuruJadwalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  let guruId = 0;
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    guruId = payload.id;
  } catch (e) {
    redirect('/admin/login');
  }

  const jadwals = await prisma.jadwalUjian.findMany({
    where: { bankSoal: { guruId } },
    include: {
      bankSoal: { include: { mapel: true } },
      kelas: true
    },
    orderBy: { waktuMulai: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <CalendarDays className="w-6 h-6 text-crypto-accent" />
            Jadwal Ujian Saya
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Daftar jadwal ujian yang dibuat oleh Admin untuk mata pelajaran Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {jadwals.map((jadwal) => {
          const now = new Date();
          const isOngoing = now >= jadwal.waktuMulai && now <= jadwal.waktuSelesai;
          const isFinished = now > jadwal.waktuSelesai;
          
          let statusBadge = <span className="px-2.5 py-1 text-xs font-semibold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-full">Akan Datang</span>;
          if (isOngoing) statusBadge = <span className="px-2.5 py-1 text-xs font-semibold text-crypto-success bg-crypto-success/10 border border-crypto-success/20 rounded-full animate-pulse">Sedang Berjalan</span>;
          if (isFinished) statusBadge = <span className="px-2.5 py-1 text-xs font-semibold text-gray-400 bg-gray-500/10 border border-gray-500/20 rounded-full">Selesai</span>;

          return (
            <div key={jadwal.id} className="bg-crypto-card p-5 rounded-2xl border border-crypto-border shadow-sm flex flex-col hover:-translate-y-1 hover:neon-accent transition-all group">
              <div className="flex justify-between items-start mb-3">
                {statusBadge}
                
                {isFinished && (
                  <Link 
                    href="/admin/guru/nilai" 
                    className="text-xs font-bold text-crypto-accent hover:text-crypto-accent-hover bg-crypto-accent/10 hover:bg-crypto-accent/20 border border-crypto-accent/20 px-2 py-1 rounded-md transition flex items-center gap-1"
                  >
                    Lihat Nilai <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-crypto-accent transition-colors">{jadwal.nama}</h3>
              <p className="text-sm font-medium text-crypto-accent/80 mb-4">{jadwal.bankSoal.mapel.nama} - {jadwal.bankSoal.judul}</p>

              <div className="space-y-2 text-sm text-gray-400 flex-1 bg-black/40 p-3 rounded-xl border border-crypto-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-crypto-accent" />
                  <div className="flex flex-col">
                    <span className="text-gray-300">
                      {jadwal.waktuMulai.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} - {jadwal.waktuSelesai.toLocaleTimeString('id-ID', { timeStyle: 'short' })}
                    </span>
                    {!isOngoing && !isFinished && (
                      <span className="text-xs font-medium text-yellow-500 mt-0.5">
                        {Math.ceil((jadwal.waktuMulai.getTime() - now.getTime()) / (1000 * 60 * 60))} jam lagi
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-crypto-accent mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {jadwal.kelas.map(k => (
                      <span key={k.id} className="text-[10px] px-1.5 py-0.5 bg-crypto-card text-gray-300 border border-crypto-border rounded">
                        {k.nama}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {jadwals.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-black/40 rounded-2xl border-2 border-dashed border-crypto-border">
            Anda belum pernah membuat jadwal ujian.
          </div>
        )}
      </div>
    </div>
  );
}
