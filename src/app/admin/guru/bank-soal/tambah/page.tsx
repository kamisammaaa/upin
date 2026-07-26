import prisma from '@/lib/prisma';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import TambahBankSoalForm from './TambahBankSoalForm';

export default async function TambahBankSoalPage() {
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

  const mapels = await prisma.mataPelajaran.findMany({
    orderBy: { nama: 'asc' }
  });

  return <TambahBankSoalForm mapels={mapels} guruId={guruId} />;
}
