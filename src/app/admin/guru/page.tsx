import { BookOpen, Users, PenTool, CheckCircle, CalendarDays, PlusCircle } from 'lucide-react';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function GuruDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  let guruId = 0;
  
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      guruId = payload.id;
    } catch (e) {}
  }

  // Ambil statistik Guru
  const totalBankSoal = await prisma.bankSoal.count({
    where: { guruId }
  });

  const jadwals = await prisma.jadwalUjian.findMany({
    where: { bankSoal: { guruId } },
    include: {
      sesiSiswa: {
        where: { status: 'FINISHED' }
      }
    }
  });

  const totalJadwal = jadwals.length;
  const totalSiswaDinilai = jadwals.reduce((sum, j) => sum + j.sesiSiswa.length, 0);

  const stats = [
    { name: 'Bank Soal Saya', value: totalBankSoal, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Jadwal Menggunakan Soal Saya', value: totalJadwal, icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Total Siswa Dinilai', value: totalSiswaDinilai, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dasbor Guru</h2>
          <p className="text-sm text-gray-500 mt-1">Selamat datang, kelola soal dan pantau nilai siswa Anda di sini.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/admin/guru/bank-soal/tambah" 
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-4 h-4" /> Buat Soal
          </Link>
          <Link 
            href="/admin/guru/jadwal/tambah" 
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            <PlusCircle className="w-4 h-4" /> Buat Jadwal
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PenTool className="w-5 h-5 text-gray-500" />
          Akses Cepat
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/guru/bank-soal" className="p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-blue-50 transition group">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900 group-hover:text-blue-700">Manajemen Bank Soal</h4>
            </div>
            <p className="text-sm text-gray-500">Buat soal pilihan ganda, atur opsi, dan tentukan kunci jawaban mata pelajaran Anda.</p>
          </Link>
          
          <Link href="/admin/guru/nilai" className="p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-purple-50 transition group">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900 group-hover:text-purple-700">Rekapitulasi Nilai</h4>
            </div>
            <p className="text-sm text-gray-500">Lihat hasil pengerjaan siswa dan unduh laporan nilai (berdasarkan jadwal yang memakai soal Anda).</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

