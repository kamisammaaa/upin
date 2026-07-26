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

  return <EditKelasClient kelas={kelas} tingkats={tingkats} jurusans={jurusans} />;
}
