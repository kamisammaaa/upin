'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createKelas(formData: FormData) {
  const nama = (formData.get('nama') as string)?.trim();
  const tingkatId = parseInt(formData.get('tingkatId') as string);
  const jurusanIds = formData.getAll('jurusanIds').map(id => parseInt(id as string));

  if (!nama || isNaN(tingkatId)) {
    return { error: 'Data tidak lengkap' };
  }

  try {
    await prisma.kelas.create({
      data: {
        nama,
        tingkat: { connect: { id: tingkatId } },
        jurusans: {
          connect: jurusanIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath('/admin/master/kelas');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Nama kelas sudah digunakan' };
    }
    return { error: 'Gagal menambahkan kelas' };
  }
}

export async function updateKelas(kelasId: number, formData: FormData) {
  const nama = (formData.get('nama') as string)?.trim();
  const tingkatId = parseInt(formData.get('tingkatId') as string);
  const jurusanIds = formData.getAll('jurusanIds').map(id => parseInt(id as string));

  if (!nama || isNaN(tingkatId)) {
    return { error: 'Data tidak lengkap' };
  }

  try {
    await prisma.kelas.update({
      where: { id: kelasId },
      data: {
        nama,
        tingkat: { connect: { id: tingkatId } },
        jurusans: {
          set: jurusanIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath('/admin/master/kelas');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Nama kelas sudah digunakan' };
    }
    return { error: 'Gagal memperbarui kelas' };
  }
}
