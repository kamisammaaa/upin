import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import EditProktorClient from './EditProktorClient';

export const metadata: Metadata = {
  title: 'Edit Proktor - Admin',
};

export default async function EditProktorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) notFound();

  const proktor = await prisma.user.findUnique({
    where: { id, role: 'PROCTOR' },
    select: { id: true, username: true, nama: true }
  });

  if (!proktor) notFound();

  return <EditProktorClient proktor={proktor} />;
}
