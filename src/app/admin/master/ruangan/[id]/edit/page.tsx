import prisma from '@/lib/prisma';
import EditRuanganClient from './EditRuanganClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditRuanganPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ruanganId = parseInt(id);
  if (isNaN(ruanganId)) redirect('/admin/master/ruangan');

  const ruangan = await prisma.ruangan.findUnique({ where: { id: ruanganId } });
  if (!ruangan) redirect('/admin/master/ruangan');

  return <EditRuanganClient ruangan={ruangan} />;
}
