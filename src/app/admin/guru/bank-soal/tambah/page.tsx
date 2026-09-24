import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import TambahBankSoalForm from './TambahBankSoalForm';
import { decodeToken } from '@/lib/jwt';

export default async function TambahBankSoalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  const payload = decodeToken(token);
  if (!payload) redirect('/admin/login');
  const guruId = payload.id;

  const mapels = await prisma.mataPelajaran.findMany({
    orderBy: { nama: 'asc' }
  });

  return <TambahBankSoalForm mapels={mapels} guruId={guruId} />;
}
