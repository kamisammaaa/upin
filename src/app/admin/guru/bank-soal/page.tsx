import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GuruBankSoalListClient from './GuruBankSoalListClient';
import { decodeToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export default async function GuruBankSoalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  const payload = decodeToken(token);
  if (!payload) redirect('/admin/login');
  const guruId = payload.id;

  const bankSoals = await prisma.bankSoal.findMany({
    where: { guruId },
    include: {
      mapel: true,
      _count: {
        select: { soals: true, jadwals: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <GuruBankSoalListClient bankSoals={bankSoals} />;
}
