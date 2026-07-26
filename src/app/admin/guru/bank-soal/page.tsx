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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <BookOpen className="w-6 h-6 text-crypto-accent" />
            Bank Soal Saya
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Daftar paket soal yang telah Anda buat dan kelola.
          </p>
        </div>
        <Link href="/admin/guru/bank-soal/tambah" className="px-4 py-2 text-sm font-medium text-white bg-crypto-accent hover:bg-crypto-accent-hover rounded-xl transition-all hover:neon-accent">
          + Buat Bank Soal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bankSoals.map((bank: any) => (
          <div key={bank.id} className="bg-crypto-card p-6 rounded-2xl border border-crypto-border shadow-sm hover:-translate-y-1 hover:neon-accent transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 text-xs font-semibold text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-full">
                {bank.mapel.nama}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {bank.createdAt.toLocaleDateString('id-ID')}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-6 leading-tight group-hover:text-crypto-accent transition-colors">
              {bank.judul}
            </h3>
            
            <div className="flex items-center justify-between pt-4 border-t border-crypto-border">
              <div className="flex items-center gap-1.5 text-gray-400">
                <FileQuestion className="w-4 h-4" />
                <span className="text-sm font-medium">{bank._count.soals} Butir Soal</span>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/guru/bank-soal/${bank.id}/preview`} className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                  Preview
                </Link>
                <Link href={`/admin/guru/bank-soal/${bank.id}`} className="text-sm font-medium text-crypto-accent hover:text-crypto-accent-hover transition-colors">
                  Kelola Soal &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))}
        
        {bankSoals.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-black/40 rounded-2xl border-2 border-dashed border-crypto-border">
            Anda belum memiliki bank soal.
          </div>
        )}
      </div>
    </div>
  );
}
