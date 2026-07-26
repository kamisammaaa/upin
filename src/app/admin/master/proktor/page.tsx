import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import DataProktorClient from './DataProktorClient';

export const metadata: Metadata = {
  title: 'Data Proktor - Admin',
};

export default async function DataProktorPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : '';
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  const perPage = 50;
  
  const where: any = { role: 'PROCTOR' };
  
  if (search) {
    where.OR = [
      { nama: { contains: search } },
      { username: { contains: search } }
    ];
  }

  const [proktors, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { nama: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        username: true,
        nama: true,
      }
    }),
    prisma.user.count({ where })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Manajemen Proktor</h1>
        <p className="text-gray-400">Kelola data akun proktor ujian.</p>
      </div>

      <DataProktorClient 
        initialProktors={proktors} 
        total={total}
        search={search}
        page={page}
        perPage={perPage}
      />
    </div>
  );
}
