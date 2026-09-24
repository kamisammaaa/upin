import { BookOpen, Users, PenTool, CheckCircle, CalendarDays, PlusCircle } from 'lucide-react';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { decodeToken } from '@/lib/jwt';

export default async function GuruDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  let guruId = 0;
  
  if (token) {
    const payload = decodeToken(token);
    if (payload) {
      guruId = payload.id;
    }
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
          <h2 className="text-2xl font-bold text-white tracking-wide">Dasbor Guru</h2>
          <p className="text-sm text-gray-400 mt-1">Selamat datang, kelola isi soal dan evaluasi hasil ujian siswa Anda di sini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-crypto-card p-6 rounded-2xl border border-crypto-border shadow-sm flex items-center gap-4 transition-all hover:-translate-y-1 hover:neon-accent group">
            <div className={`w-12 h-12 rounded-xl bg-black/40 border border-crypto-border flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 ${stat.color.replace('text-', 'text-').replace('-600', '-400')}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{stat.name}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-crypto-card p-6 rounded-2xl border border-crypto-border shadow-sm mt-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 tracking-wide">
          <PenTool className="w-5 h-5 text-crypto-accent" />
          Akses Cepat
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/guru/bank-soal" className="p-4 border border-crypto-border rounded-xl bg-black/20 hover:bg-black/40 transition-all hover:neon-accent group">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-crypto-accent" />
              <h4 className="font-semibold text-white group-hover:text-crypto-accent transition-colors">Manajemen Bank Soal</h4>
            </div>
            <p className="text-sm text-gray-400">Kelola butir soal, opsi, dan kunci jawaban pada paket soal yang ditugaskan kepada Anda.</p>
          </Link>
          
          <Link href="/admin/guru/nilai" className="p-4 border border-crypto-border rounded-xl bg-black/20 hover:bg-black/40 transition-all hover:neon-accent group">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-crypto-accent" />
              <h4 className="font-semibold text-white group-hover:text-crypto-accent transition-colors">Rekapitulasi Nilai</h4>
            </div>
            <p className="text-sm text-gray-400">Lihat hasil pengerjaan siswa dan unduh laporan nilai (berdasarkan jadwal yang memakai soal Anda).</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

