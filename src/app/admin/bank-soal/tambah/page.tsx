import prisma from '@/lib/prisma';
import TambahBankSoalClient from './TambahBankSoalClient';
import { BookOpen } from 'lucide-react';

export default async function TambahBankSoalPage() {
  const [mapels, gurus] = await Promise.all([
    prisma.mataPelajaran.findMany({ orderBy: { nama: 'asc' } }),
    prisma.user.findMany({ where: { role: 'GURU' }, orderBy: { nama: 'asc' } })
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Tambah Bank Soal</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <TambahBankSoalClient 
          mapels={mapels} 
          gurus={gurus} 
        />
      </div>
    </div>
  );
}
