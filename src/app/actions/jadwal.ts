'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createJadwalUjian(formData: FormData) {
  try {
    const nama = formData.get('nama') as string;
    const bankSoalId = Number(formData.get('bankSoalId'));
    const waktuMulai = new Date(formData.get('waktuMulai') as string);
    const waktuSelesai = new Date(formData.get('waktuSelesai') as string);
    
    // Multi-select classes (can be multiple hidden inputs or array)
    const kelasIdsStr = formData.getAll('kelasIds') as string[];
    const kelasIds = kelasIdsStr.map(id => Number(id)).filter(id => !isNaN(id));

    if (kelasIds.length === 0) {
      return { success: false, message: 'Pilih minimal satu kelas target.' };
    }

    if (waktuMulai >= waktuSelesai) {
      return { success: false, message: 'Waktu selesai harus lebih besar dari waktu mulai.' };
    }

    const newJadwal = await prisma.jadwalUjian.create({
      data: {
        nama,
        bankSoalId,
        waktuMulai,
        waktuSelesai,
        kelas: {
          connect: kelasIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath('/admin/jadwal');
    return { success: true, message: 'Jadwal berhasil dibuat', id: newJadwal.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteJadwalUjian(id: number) {
  try {
    await prisma.jadwalUjian.delete({
      where: { id }
    });
    revalidatePath('/admin/jadwal');
    return { success: true, message: 'Jadwal berhasil dihapus' };
  } catch (error: any) {
    return { success: false, message: 'Gagal menghapus jadwal. Pastikan tidak ada data ujian siswa yang terkait.' };
  }
}
