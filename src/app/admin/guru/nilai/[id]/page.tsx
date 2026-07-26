import { getJadwalMonitorData } from '@/app/actions/monitor';
import { redirect } from 'next/navigation';
import NilaiClient from './NilaiClient';

export default async function GuruNilaiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const jadwalId = parseInt(resolvedParams.id);
  
  if (isNaN(jadwalId)) redirect('/admin/guru/nilai');

  const initialData = await getJadwalMonitorData(jadwalId);
  if (!initialData) redirect('/admin/guru/nilai');

  return (
    <NilaiClient initialData={initialData} jadwalId={jadwalId} />
  );
}
