import prisma from '@/lib/prisma';
import { Users, Download, Eye } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function GuruNilaiPage() {
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
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Rekapitulasi Nilai Ujian
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Hasil pengerjaan siswa dari jadwal ujian yang menggunakan soal Anda.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">Jadwal Ujian</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Mata Pelajaran</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Kelas Peserta</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Total Sesi Ujian</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jadwals.map((jadwal: any) => (
                <tr key={jadwal.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{jadwal.nama}</p>
                    <p className="text-xs text-gray-500">
                      {jadwal.waktuMulai.toLocaleDateString('id-ID')}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {jadwal.bankSoal.mapel.nama}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {jadwal.kelas.map((k: any) => (
                        <span key={k.id} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                          {k.nama}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {jadwal._count.sesiSiswa} Siswa Mengerjakan
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg mr-2 transition">
                      <Eye className="w-4 h-4" /> Lihat
                    </button>
                    <button className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-800 bg-green-50 px-3 py-1.5 rounded-lg transition">
                      <Download className="w-4 h-4" /> Unduh (Excel)
                    </button>
                  </td>
                </tr>
              ))}
              {jadwals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Belum ada jadwal ujian yang menggunakan soal Anda.
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
