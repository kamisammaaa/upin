import { getSoalById } from '@/app/actions/soal';
import { redirect } from 'next/navigation';
import EditSoalClient from './EditSoalClient';

export default async function EditSoalPage({ params }: { params: Promise<{ id: string, soalId: string }> }) {
  const resolvedParams = await params;
  const bankSoalId = Number(resolvedParams.id);
  const soalId = Number(resolvedParams.soalId);

  if (isNaN(bankSoalId) || isNaN(soalId)) {
    redirect('/admin/bank-soal');
  }

  const soal = await getSoalById(soalId);

  if (!soal || soal.bankSoalId !== bankSoalId) {
    redirect(`/admin/bank-soal/${bankSoalId}`);
  }

  return <EditSoalClient bankSoalId={bankSoalId} soal={soal} />;
}
