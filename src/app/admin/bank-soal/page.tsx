import prisma from '@/lib/prisma';
import BankSoalListClient from './BankSoalListClient';

export const dynamic = 'force-dynamic';

export default async function BankSoalPage() {
  const bankSoals = await prisma.bankSoal.findMany({
    include: {
      mapel: true,
      guru: true,
      _count: {
        select: { soals: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <BankSoalListClient bankSoals={bankSoals} />;
}
