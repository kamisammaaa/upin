import prisma from '@/lib/prisma';
import TambahKelasClient from './TambahKelasClient';
import { GraduationCap } from 'lucide-react';

export default async function TambahKelasPage() {
  const [tingkats, jurusans] = await Promise.all([
    prisma.tingkat.findMany({ orderBy: { level: 'asc' } }),
    prisma.jurusan.findMany({ orderBy: { kode: 'asc' } })
  ]);

  return <TambahKelasClient tingkats={tingkats} jurusans={jurusans} />;
}
