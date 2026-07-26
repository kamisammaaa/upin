import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import PreviewBankSoal from '@/app/admin/components/PreviewBankSoal';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function GuruPreviewBankSoalPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
