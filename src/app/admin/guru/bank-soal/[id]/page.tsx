import { getBankSoalDetail, getSoalByBankSoalId } from '@/app/actions/soal';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import GuruBankSoalDetailClient from './GuruBankSoalDetailClient';

export default async function DetailBankSoalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  
  if (isNaN(id)) redirect('/admin/guru/bank-soal');

  const bankSoal = await getBankSoalDetail(id);
  if (!bankSoal) redirect('/admin/guru/bank-soal');

  const soals = await getSoalByBankSoalId(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/guru/bank-soal" className="p-2 bg-crypto-card border border-crypto-border rounded-lg hover:bg-crypto-card-hover text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">{bankSoal.judul}</h2>
            <p className="mt-1 text-sm text-gray-400">
              Mata Pelajaran: <span className="font-semibold text-gray-300">{bankSoal.mapel.nama}</span>
            </p>
          </div>
        </div>

        <Link
          href={`/admin/guru/bank-soal/${bankSoal.id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500 hover:text-black transition-all w-fit"
        >
          <Pencil className="w-4 h-4" />
          Edit Bank Soal
        </Link>
      </div>

      <GuruBankSoalDetailClient bankSoal={bankSoal} soals={soals} />
    </div>
  );
}

