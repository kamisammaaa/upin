'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createSiswa(formData: FormData) {
  const nis = formData.get('nis') as string;
  const nama = formData.get('nama') as string;
  const password = formData.get('password') as string;
  const kelasId = parseInt(formData.get('kelasId') as string);
  const ruanganIdStr = formData.get('ruanganId') as string;
  const ruanganId = ruanganIdStr ? parseInt(ruanganIdStr) : null;

  if (!nis || !nama || !password || isNaN(kelasId)) {
    return { error: 'Data tidak lengkap' };
  }

  try {
    await prisma.siswa.create({
      data: {
        nis,
        nama,
        password,
        kelasId,
        ruanganId
      }
    });

    revalidatePath('/admin/master/siswa');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'NIS sudah terdaftar' };
    }
    return { error: 'Gagal menambahkan siswa' };
  }
}

export async function importSiswa(data: { nis: string; nama: string; password: string; kelasId: number }[]) {
  try {
    // Gunakan createMany dengan skipDuplicates jika SQLite mendukung, atau eksekusi satu per satu
    // SQLite dalam Prisma mendukung skipDuplicates untuk createMany mulai dari versi terbaru
    await prisma.siswa.createMany({
      data,
      skipDuplicates: true
    });
    
    revalidatePath('/admin/master/siswa');
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal mengimpor data siswa' };
  }
}

export async function updateSiswa(siswaId: number, formData: FormData) {
  const nis = formData.get('nis') as string;
  const nama = formData.get('nama') as string;
  const password = formData.get('password') as string;
  const kelasId = parseInt(formData.get('kelasId') as string);
  const ruanganIdStr = formData.get('ruanganId') as string;
  const ruanganId = ruanganIdStr ? parseInt(ruanganIdStr) : null;

  if (!nis || !nama || !password || isNaN(kelasId)) {
    return { error: 'Data tidak lengkap' };
  }

  try {
    await prisma.siswa.update({
      where: { id: siswaId },
      data: {
        nis,
        nama,
        password,
        kelasId,
        ruanganId
      }
    });

    revalidatePath('/admin/master/siswa');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'NIS sudah digunakan' };
    }
    return { error: 'Gagal mengubah data siswa' };
  }
}
