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
    <EditSiswaClient 
      siswa={siswa}
      kelass={kelass} 
      ruangans={ruangans} 
    />
  );
}
