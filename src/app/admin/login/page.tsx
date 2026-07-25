import prisma from '@/lib/prisma';
import AdminLoginClient from './AdminLoginClient';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const pengaturan = await prisma.pengaturan.findUnique({
    where: { id: 1 }
  });

  return <AdminLoginClient pengaturan={pengaturan} />;
}
