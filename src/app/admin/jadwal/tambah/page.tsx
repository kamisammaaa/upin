import prisma from '@/lib/prisma';
import TambahJadwalClient from './TambahJadwalClient';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TambahJadwalPage() {
  const [bankSoals, kelass] = await Promise.all([
    prisma.bankSoal.findMany({
      include: {
        mapel: true,
        guru: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.kelas.findMany({
      orderBy: { nama: 'asc' }
    })
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/jadwal" className="hover:text-orange-600 transition">Jadwal Ujian</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Buat Baru</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-orange-600" />
          Buat Jadwal Ujian Baru
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Tentukan waktu, bank soal yang digunakan, dan kelas yang dapat mengakses.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <TambahJadwalClient bankSoals={bankSoals} kelass={kelass} />
      </div>
    </div>
  );
}
