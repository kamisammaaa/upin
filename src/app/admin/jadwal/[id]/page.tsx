import { getJadwalMonitorData } from '@/app/actions/monitor';
import { redirect } from 'next/navigation';
import MonitorClient from './MonitorClient';

export default async function MonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const jadwalId = parseInt(resolvedParams.id);
  
  if (isNaN(jadwalId)) redirect('/admin/jadwal');

  const initialData = await getJadwalMonitorData(jadwalId);
  if (!initialData) redirect('/admin/jadwal');

  return (
    <MonitorClient initialData={initialData} jadwalId={jadwalId} />
  );
}
