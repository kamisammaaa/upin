import prisma from '@/lib/prisma';
import { Users, Download, Eye } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { decodeToken } from '@/lib/jwt';

export default async function GuruNilaiPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  const payload = decodeToken(token);
  if (!payload) redirect('/admin/login');
  const guruId = payload.id;

  // Cari jadwal ujian yang menggunakan soal dari guru ini
  const jadwals = await prisma.jadwalUjian.findMany({
    where: { bankSoal: { guruId } },
    include: {
      bankSoal: {
        include: { mapel: true }
      },
      kelas: true,
      _count: {
        select: { sesiSiswa: true }
      }
    },
    orderBy: { waktuSelesai: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
          <Users className="w-6 h-6 text-crypto-accent" />
          Rekapitulasi Nilai Ujian
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Hasil pengerjaan siswa dari jadwal ujian yang menggunakan soal Anda.
        </p>
      </div>
      </div>

      <div className="bg-crypto-card rounded-2xl shadow-sm border border-crypto-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-crypto-border text-sm">
                <th className="px-6 py-4 font-semibold text-gray-400">Jadwal Ujian</th>
                <th className="px-6 py-4 font-semibold text-gray-400">Mata Pelajaran</th>
                <th className="px-6 py-4 font-semibold text-gray-400">Kelas Peserta</th>
                <th className="px-6 py-4 font-semibold text-gray-400">Total Sesi Ujian</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border text-sm">
              {jadwals.map((j: any) => (
                <tr key={j.id} className="hover:bg-crypto-card-hover transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{j.nama}</p>
                    <p className="text-xs text-gray-400 mt-1">{j.waktuMulai.toLocaleDateString('id-ID')}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {j.bankSoal.mapel.nama}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {j.kelas.map((k: any) => (
                        <span key={k.id} className="text-[10px] px-2 py-1 bg-crypto-accent/10 text-crypto-accent border border-crypto-accent/20 rounded-md font-medium">
                          {k.nama}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {j._count.sesiSiswa} Siswa Mengerjakan
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/guru/nilai/${j.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-lg hover:bg-crypto-accent/20 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Lihat & Analisis
                    </Link>
                  </td>
                </tr>
              ))}
              {jadwals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 bg-black/40">
                    Belum ada data nilai. Pastikan Anda telah membuat jadwal ujian dan siswa telah mengerjakannya.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
