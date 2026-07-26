import prisma from '@/lib/prisma';
import TambahJadwalClient from './TambahJadwalClient';

export const dynamic = 'force-dynamic';

export default async function TambahJadwalPage() {
  const [bankSoals, kelass] = await Promise.all([
    prisma.bankSoal.findMany({
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

  return <TambahJadwalClient bankSoals={bankSoals} kelass={kelass} />;
}
