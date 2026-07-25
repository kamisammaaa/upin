import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditKelasClient from './EditKelasClient';
import { GraduationCap } from 'lucide-react';

export default async function EditKelasPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const kelasId = parseInt(resolvedParams.id);
  
  if (isNaN(kelasId)) {
    notFound();
  }

  const [kelas, tingkats, jurusans] = await Promise.all([
    prisma.kelas.findUnique({
      where: { id: kelasId },
      include: {
        jurusans: true
      }
    }),
    prisma.tingkat.findMany({ orderBy: { level: 'asc' } }),
    prisma.jurusan.findMany({ orderBy: { kode: 'asc' } })
  ]);

  if (!kelas) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Edit Data Kelas</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <EditKelasClient 
          kelas={kelas} 
          tingkats={tingkats} 
          jurusans={jurusans} 
        />
      </div>
    </div>
  );
}
