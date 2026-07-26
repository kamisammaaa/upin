import prisma from '@/lib/prisma';
import DataSiswaClient from './DataSiswaClient';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function DataSiswaPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page) || 1 : 1;
  const search = typeof params.search === 'string' ? params.search : '';
  const kelasId = typeof params.kelasId === 'string' ? params.kelasId : '';
  
  const take = 50;
  const skip = (page - 1) * take;

  const where: Prisma.SiswaWhereInput = {
    ...(search && {
      OR: [
        { nama: { contains: search } },
        { nis: { contains: search } }
      ]
    }),
    ...(kelasId && {
      kelasId: parseInt(kelasId)
    })
  };

  const [siswas, total, kelass] = await Promise.all([
    prisma.siswa.findMany({
      where,
      include: {
        kelas: true,
        ruangan: true,
      },
      orderBy: {
        nama: 'asc'
      },
      take,
      skip
    }),
    prisma.siswa.count({ where }),
    prisma.kelas.findMany({
      orderBy: { nama: 'asc' }
    })
  ]);

  const totalPages = Math.ceil(total / take) || 1;

  return (
    <DataSiswaClient 
      siswas={siswas} 
      kelass={kelass}
      currentPage={page}
      totalPages={totalPages}
      totalSiswa={total}
      search={search}
      kelasId={kelasId}
    />
  );
}
