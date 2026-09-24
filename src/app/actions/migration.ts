'use server';

import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/hash';

export async function migratePasswordsToHash() {
  try {
    const users = await prisma.user.findMany();
    let migratedUsers = 0;
    for (const u of users) {
      if (!u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
        const hashed = await hashPassword(u.password);
        await prisma.user.update({
          where: { id: u.id },
          data: { password: hashed }
        });
        migratedUsers++;
      }
    }

    const siswas = await prisma.siswa.findMany();
    let migratedSiswas = 0;
    for (const s of siswas) {
      if (!s.password.startsWith('$2a$') && !s.password.startsWith('$2b$')) {
        const hashed = await hashPassword(s.password);
        await prisma.siswa.update({
          where: { id: s.id },
          data: { password: hashed }
        });
        migratedSiswas++;
      }
    }

    return {
      success: true,
      message: `Migrasi selesai: ${migratedUsers} user dan ${migratedSiswas} siswa berhasil di-hash.`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
