import { getHasilUjianOverview } from '@/app/actions/hasilUjian';
import HasilUjianClient from './HasilUjianClient';

export const dynamic = 'force-dynamic';

export default async function HasilUjianPage() {
  const overviewData = await getHasilUjianOverview();
  return <HasilUjianClient overviewData={overviewData} />;
}
