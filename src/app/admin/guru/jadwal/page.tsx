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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-600" />
            Jadwal Ujian Saya
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Daftar paket ujian yang telah Anda jadwalkan untuk siswa.
          </p>
        </div>
        <Link 
          href="/admin/guru/jadwal/tambah"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Buat Jadwal Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {jadwals.map((jadwal) => {
          const now = new Date();
          const isOngoing = now >= jadwal.waktuMulai && now <= jadwal.waktuSelesai;
          const isFinished = now > jadwal.waktuSelesai;
          
          let statusBadge = <span className="px-2.5 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">Akan Datang</span>;
          if (isOngoing) statusBadge = <span className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full animate-pulse">Sedang Berjalan</span>;
          if (isFinished) statusBadge = <span className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">Selesai</span>;

          return (
            <div key={jadwal.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-3">
                {statusBadge}
                
                {isFinished && (
                  <Link 
                    href="/admin/guru/nilai" 
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-md transition flex items-center gap-1"
                  >
                    Lihat Nilai <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{jadwal.nama}</h3>
              <p className="text-sm font-medium text-purple-700 mb-4">{jadwal.bankSoal.mapel.nama} - {jadwal.bankSoal.judul}</p>

              <div className="space-y-2 text-sm text-gray-600 flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div className="flex flex-col">
                    <span>
                      {jadwal.waktuMulai.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} - {jadwal.waktuSelesai.toLocaleTimeString('id-ID', { timeStyle: 'short' })}
                    </span>
                    {!isOngoing && !isFinished && (
                      <span className="text-xs font-medium text-orange-600 mt-0.5">
                        {Math.ceil((jadwal.waktuMulai.getTime() - now.getTime()) / (1000 * 60 * 60))} jam lagi
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {jadwal.kelas.map(k => (
                      <span key={k.id} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
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
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            Anda belum pernah membuat jadwal ujian.
          </div>
        )}
      </div>
    </div>
  );
}
