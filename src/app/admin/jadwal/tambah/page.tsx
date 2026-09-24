import prisma from '@/lib/prisma';
import TambahJadwalClient from './TambahJadwalClient';

export const dynamic = 'force-dynamic';

export default async function TambahJadwalPage() {
  const [bankSoals, kelass, siswas] = await Promise.all([
    prisma.bankSoal.findMany({
      include: {
        mapel: true,
        guru: true,
        jadwals: {
          select: {
            id: true,
            nama: true,
            tipeUjian: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.kelas.findMany({
      orderBy: { nama: 'asc' }
    }),
    prisma.siswa.findMany({
      select: {
        id: true,
        nama: true,
        nis: true,
        kelasId: true,
        kelas: { select: { id: true, nama: true } }
      },
      orderBy: [
        { kelas: { nama: 'asc' } },
        { nama: 'asc' }
      ]
    })
  ]);

  return <TambahJadwalClient bankSoals={bankSoals} kelass={kelass} siswas={siswas} />;
}
