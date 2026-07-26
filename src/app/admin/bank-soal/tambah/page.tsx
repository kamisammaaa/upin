import prisma from '@/lib/prisma';
import TambahBankSoalClient from './TambahBankSoalClient';

export default async function TambahBankSoalPage() {
  const [mapels, gurus] = await Promise.all([
    prisma.mataPelajaran.findMany({ orderBy: { nama: 'asc' } }),
    prisma.user.findMany({ where: { role: 'GURU' }, orderBy: { nama: 'asc' } })
  ]);

  return <TambahBankSoalClient mapels={mapels} gurus={gurus} />;
}
