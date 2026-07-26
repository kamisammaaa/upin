import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TambahSoalClient from './TambahSoalClient';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default async function TambahSoalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const bankSoalId = parseInt(resolvedParams.id);
  
  if (isNaN(bankSoalId)) {
    notFound();
  }

  const bankSoal = await prisma.bankSoal.findUnique({
    where: { id: bankSoalId }
  });

  if (!bankSoal) {
    notFound();
  }

  return <TambahSoalClient bankSoalId={bankSoal.id} />;
}
