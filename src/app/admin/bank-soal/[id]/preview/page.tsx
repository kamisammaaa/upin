import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PreviewBankSoal from '@/app/admin/components/PreviewBankSoal';

export const dynamic = 'force-dynamic';

export default async function AdminPreviewBankSoalPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id);
  
  if (isNaN(id)) notFound();

  const bankSoal = await prisma.bankSoal.findUnique({
    where: { id },
    include: {
      mapel: true,
      guru: true,
      soals: true
    }
  });

  if (!bankSoal) notFound();

  return <PreviewBankSoal bankSoal={bankSoal} role="admin" />;
}
