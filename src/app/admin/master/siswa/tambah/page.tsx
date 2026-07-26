import prisma from '@/lib/prisma';
import TambahSiswaClient from './TambahSiswaClient';

export default async function TambahSiswaPage() {
  const [kelas, ruangans] = await Promise.all([
    prisma.kelas.findMany({ orderBy: { nama: 'asc' } }),
    prisma.ruangan.findMany({ orderBy: { nama: 'asc' } })
  ]);

  return <TambahSiswaClient kelass={kelas} ruangans={ruangans} />;
}
