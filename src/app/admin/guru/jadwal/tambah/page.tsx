import prisma from '@/lib/prisma';
import GuruTambahJadwalClient from './GuruTambahJadwalClient';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function GuruTambahJadwalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  let guruId = 0;
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    guruId = payload.id;
  } catch (e) {
    redirect('/admin/login');
  }

  const [bankSoals, kelass] = await Promise.all([
    prisma.bankSoal.findMany({
      where: { guruId },
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

  return <GuruTambahJadwalClient bankSoals={bankSoals} kelass={kelass} redirectUrl="/admin/guru/jadwal" />;
}
