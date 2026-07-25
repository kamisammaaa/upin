import prisma from '@/lib/prisma';
import DataSiswaClient from './DataSiswaClient';

export const dynamic = 'force-dynamic';

export default async function DataSiswaPage() {
  const siswas = await prisma.siswa.findMany({
    include: {
      kelas: true,
      ruangan: true,
    },
    orderBy: {
      nama: 'asc'
    }
  });

  const kelass = await prisma.kelas.findMany({
    orderBy: { nama: 'asc' }
  });

  return <DataSiswaClient siswas={siswas} kelass={kelass} />;
}
