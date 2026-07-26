'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createMapel(formData: FormData) {
  try {
    const nama = formData.get('nama') as string;
    
    if (!nama) {
      return { success: false, message: 'Nama mata pelajaran wajib diisi' };
    }

    await prisma.mataPelajaran.create({
      data: { nama }
    });

    revalidatePath('/admin/master/mapel');
    return { success: true, message: 'Mata pelajaran berhasil ditambahkan' };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, message: 'Nama mata pelajaran sudah ada' };
    }
    return { success: false, message: error.message };
  }
}

export async function updateMapel(id: number, formData: FormData) {
  try {
    const nama = formData.get('nama') as string;
    
    if (!nama) {
      return { success: false, message: 'Nama mata pelajaran wajib diisi' };
    }

    await prisma.mataPelajaran.update({
      where: { id },
      data: { nama }
    });

    revalidatePath('/admin/master/mapel');
    return { success: true, message: 'Mata pelajaran berhasil diupdate' };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, message: 'Nama mata pelajaran sudah ada' };
    }
    return { success: false, message: error.message };
  }
}

export async function deleteMapel(id: number) {
  try {
    await prisma.mataPelajaran.delete({
      where: { id }
    });

    revalidatePath('/admin/master/mapel');
    return { success: true, message: 'Mata pelajaran berhasil dihapus' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
