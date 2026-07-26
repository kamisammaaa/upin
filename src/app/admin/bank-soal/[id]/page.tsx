import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BankSoalDetailClient from './BankSoalDetailClient';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default async function BankSoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const bankSoalId = parseInt(resolvedParams.id);
  
  if (isNaN(bankSoalId)) {
    notFound();
  }

  const bankSoal = await prisma.bankSoal.findUnique({
    where: { id: bankSoalId },
    include: {
      mapel: true,
      guru: true,
      soals: {
        orderBy: { id: 'asc' }
      }
    }
  });

  if (!bankSoal) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/bank-soal" className="hover:text-crypto-accent transition">Bank Soal</Link>
            <span>/</span>
            <span className="text-white font-medium">Detail</span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-crypto-accent" />
            {bankSoal.judul}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Mata Pelajaran: {bankSoal.mapel.nama} | Oleh: {bankSoal.guru.nama}
          </p>
        </div>
      </div>

      <BankSoalDetailClient bankSoal={bankSoal} />
    </div>
  );
}
