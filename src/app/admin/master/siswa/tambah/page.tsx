import prisma from '@/lib/prisma';
import TambahSiswaClient from './TambahSiswaClient';
import { Users } from 'lucide-react';

export default async function TambahSiswaPage() {
  const [kelas, ruangans] = await Promise.all([
    prisma.kelas.findMany({ orderBy: { nama: 'asc' } }),
    prisma.ruangan.findMany({ orderBy: { nama: 'asc' } })
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Tambah Data Siswa</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <TambahSiswaClient 
          kelass={kelas} 
          ruangans={ruangans} 
        />
      </div>
    </div>
  );
}
