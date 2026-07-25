import prisma from '@/lib/prisma';
import JadwalListClient from './JadwalListClient';

export const dynamic = 'force-dynamic';

export default async function JadwalUjianPage() {
  const jadwals = await prisma.jadwalUjian.findMany({
    include: {
      bankSoal: {
        include: { mapel: true }
      },
      kelas: {
        orderBy: { nama: 'asc' }
      }
    },
    orderBy: {
      waktuMulai: 'desc'
    }
  });

  return <JadwalListClient jadwals={jadwals} />;
}
