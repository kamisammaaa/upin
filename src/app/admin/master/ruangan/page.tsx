import prisma from '@/lib/prisma';
import DataRuanganClient from './DataRuanganClient';

export const dynamic = 'force-dynamic';

export default async function DataRuanganPage() {
  const ruangans = await prisma.ruangan.findMany({
    orderBy: { nama: 'asc' },
    include: {
      _count: { select: { siswas: true } },
      siswas: {
        select: {
          id: true,
          nis: true,
          nama: true,
          kelas: { select: { nama: true } }
        },
        orderBy: { nama: 'asc' }
      }
    }
  });

  return <DataRuanganClient ruangans={ruangans} />;
}
