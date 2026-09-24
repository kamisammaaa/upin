import MonitorProktorClient from './MonitorProktorClient';
import { getRuanganMonitorData } from '@/app/actions/monitor';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export default async function MonitorProktorPage({ params }: { params: Promise<{ ruanganId: string }> }) {
  const resolvedParams = await params;
  const ruanganId = parseInt(resolvedParams.ruanganId);
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) redirect('/admin/login');
  
  const payload = decodeToken(token);
  if (!payload) redirect('/admin/login');
  
  // Data awal untuk client
  const initialData = await getRuanganMonitorData(ruanganId, payload.id);

  if (!initialData) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Ruangan Tidak Ditemukan</h2>
        <p className="text-gray-500 mt-2">Atau Anda tidak ditugaskan di ruangan ini saat ini.</p>
      </div>
    );
  }

  return (
    <MonitorProktorClient 
      ruanganId={ruanganId} 
      proctorId={payload.id}
      initialData={initialData} 
    />
  );
}
