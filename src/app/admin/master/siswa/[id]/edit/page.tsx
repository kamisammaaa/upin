import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditSiswaClient from './EditSiswaClient';
import { Users } from 'lucide-react';

export default async function EditSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const siswaId = parseInt(resolvedParams.id);
  
  if (isNaN(siswaId)) {
    notFound();
  }

  const [siswa, kelass, ruangans] = await Promise.all([
    prisma.siswa.findUnique({
      where: { id: siswaId }
    }),
    prisma.kelas.findMany({ orderBy: { nama: 'asc' } }),
    prisma.ruangan.findMany({ orderBy: { nama: 'asc' } })
  ]);

  if (!siswa) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Edit Data Siswa</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <EditSiswaClient 
          siswa={siswa}
          kelass={kelass} 
          ruangans={ruangans} 
        />
      </div>
    </div>
  );
}
