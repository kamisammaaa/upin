import prisma from '@/lib/prisma';
import TambahKelasClient from './TambahKelasClient';
import { GraduationCap } from 'lucide-react';

export default async function TambahKelasPage() {
  const [tingkats, jurusans] = await Promise.all([
    prisma.tingkat.findMany({ orderBy: { level: 'asc' } }),
    prisma.jurusan.findMany({ orderBy: { kode: 'asc' } })
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Tambah Data Kelas</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <TambahKelasClient 
          tingkats={tingkats} 
          jurusans={jurusans} 
        />
      </div>
    </div>
  );
}
