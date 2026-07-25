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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/bank-soal" className="hover:text-indigo-600 transition">Bank Soal</Link>
          <span>/</span>
          <Link href={`/admin/bank-soal/${bankSoal.id}`} className="hover:text-indigo-600 transition">Detail</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Tambah Soal</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-indigo-600" />
          Tambah Soal Baru
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Menambahkan butir soal ke paket: {bankSoal.judul}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <TambahSoalClient bankSoalId={bankSoal.id} />
      </div>
    </div>
  );
}
