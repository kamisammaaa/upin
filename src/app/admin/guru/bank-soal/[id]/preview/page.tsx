import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import PreviewBankSoal from '@/app/admin/components/PreviewBankSoal';
import { cookies } from 'next/headers';
import { decodeToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export default async function GuruPreviewBankSoalPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  const payload = decodeToken(token);
  if (!payload) redirect('/admin/login');
  const guruId = payload.id;

  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const bankSoal = await prisma.bankSoal.findUnique({
    where: { 
      id,
      guruId // ensure it belongs to the guru
    },
    include: {
      mapel: true,
      guru: true,
      soals: true
    }
  });

  if (!bankSoal) notFound();

  return <PreviewBankSoal bankSoal={bankSoal} role="guru" />;
}
