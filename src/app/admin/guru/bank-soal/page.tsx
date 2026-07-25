import prisma from '@/lib/prisma';
import { BookOpen, FileQuestion } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function GuruBankSoalPage() {
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

  const bankSoals = await prisma.bankSoal.findMany({
    where: { guruId },
    include: {
      mapel: true,
      _count: {
        select: { soals: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Bank Soal Saya
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Daftar paket soal yang telah Anda buat dan kelola.
          </p>
        </div>
        <Link href="/admin/guru/bank-soal/tambah" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
          + Buat Bank Soal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bankSoals.map((bank: any) => (
          <div key={bank.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full">
                {bank.mapel.nama}
              </span>
              <span className="text-xs text-gray-400">
                {bank.createdAt.toLocaleDateString('id-ID')}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-6 leading-tight">
              {bank.judul}
            </h3>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-500">
                <FileQuestion className="w-4 h-4" />
                <span className="text-sm font-medium">{bank._count.soals} Butir Soal</span>
              </div>
              <Link href={`/admin/guru/bank-soal/${bank.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                Kelola Soal &rarr;
              </Link>
            </div>
          </div>
        ))}
        
        {bankSoals.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            Anda belum memiliki bank soal.
          </div>
        )}
      </div>
    </div>
  );
}
