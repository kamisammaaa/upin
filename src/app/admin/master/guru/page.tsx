import prisma from '@/lib/prisma';
import DataGuruClient from './DataGuruClient';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function DataGuruPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page) || 1 : 1;
  const search = typeof params.search === 'string' ? params.search : '';
  
  const take = 50;
  const skip = (page - 1) * take;

  const where: Prisma.UserWhereInput = {
    role: 'GURU',
    ...(search && {
      OR: [
        { nama: { contains: search } },
        { username: { contains: search } }
      ]
    })
  };

  const [gurus, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { nama: 'asc' },
      include: {
        _count: {
          select: { bankSoals: true }
        }
      },
      take,
      skip
    }),
    prisma.user.count({ where })
  ]);

  const totalPages = Math.ceil(total / take) || 1;

  return (
    <DataGuruClient 
      gurus={gurus} 
      currentPage={page}
      totalPages={totalPages}
      totalGuru={total}
      search={search}
    />
  );
}
