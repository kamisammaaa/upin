import prisma from '@/lib/prisma';
import EditGuruClient from './EditGuruClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditGuruPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const guruId = parseInt(resolvedParams.id);
  
  if (isNaN(guruId)) redirect('/admin/master/guru');

  const guru = await prisma.user.findUnique({
    where: { id: guruId }
  });

  if (!guru || guru.role !== 'GURU') {
    redirect('/admin/master/guru');
  }

  return <EditGuruClient guru={guru} />;
}
