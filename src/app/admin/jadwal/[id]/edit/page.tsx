import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import EditJadwalClient from './EditJadwalClient';

export const dynamic = 'force-dynamic';

export default async function EditJadwalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const jadwalId = parseInt(resolvedParams.id);

  if (isNaN(jadwalId)) {
    redirect('/admin/jadwal');
  }

  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: {
      kelas: true,
      bankSoal: {
        include: { mapel: true }
      }
    }
  });

  if (!jadwal) {
    redirect('/admin/jadwal');
  }

  const [bankSoals, kelass] = await Promise.all([
    prisma.bankSoal.findMany({
      where: {
        OR: [
          { id: jadwal.bankSoalId },
          { jadwals: { none: {} } }
        ]
      },
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
    <EditJadwalClient 
      jadwal={jadwal}
      bankSoals={bankSoals}
      kelass={kelass}
    />
  );
}
