import prisma from '@/lib/prisma';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import TambahBankSoalForm from './TambahBankSoalForm';

export default async function TambahBankSoalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  let guruId = 0;
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    guruId = payload.id;
  } catch (e) {
    redirect('/admin/login');
  }

  const mapels = await prisma.mataPelajaran.findMany({
    orderBy: { nama: 'asc' }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/guru/bank-soal" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-600" />
            Buat Bank Soal Baru
          </h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <TambahBankSoalForm mapels={mapels} guruId={guruId} />
      </div>
    </div>
  );
}
