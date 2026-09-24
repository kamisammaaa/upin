import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decodeToken } from '@/lib/jwt';
import EditBankSoalForm from './EditBankSoalForm';

export default async function EditBankSoalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  if (isNaN(id)) {
    redirect('/admin/guru/bank-soal');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) {
    redirect('/admin/login');
  }

  const currentUser = decodeToken(token);
  if (!currentUser) {
    redirect('/admin/login');
  }

  const bankSoal = await prisma.bankSoal.findUnique({
    where: { id },
    include: {
      mapel: true,
      _count: {
        select: { soals: true, jadwals: true }
      }
    }
  });

  if (!bankSoal) {
    redirect('/admin/guru/bank-soal');
  }

  // Guru hanya bisa mengedit bank soal miliknya sendiri
  if (currentUser.role === 'GURU' && bankSoal.guruId !== currentUser.id) {
    redirect('/admin/guru/bank-soal');
  }

  const mapels = await prisma.mataPelajaran.findMany({
    orderBy: { nama: 'asc' }
  });

  return <EditBankSoalForm bankSoal={bankSoal} mapels={mapels} />;
}
