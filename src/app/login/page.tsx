import prisma from '@/lib/prisma';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const pengaturan = await prisma.pengaturan.findUnique({
    where: { id: 1 }
  });

  return <LoginClient pengaturan={pengaturan} />;
}
