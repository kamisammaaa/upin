'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function revalidateRuanganAll() {
  revalidatePath('/admin/master/ruangan');
  revalidatePath('/admin/master/siswa');
  revalidatePath('/admin/proktor');
  revalidatePath('/admin');
  revalidatePath('/siswa');
}

export async function createRuangan(formData: FormData) {
  const nama = (formData.get('nama') as string)?.trim();
  const kapasitas = parseInt(formData.get('kapasitas') as string) || 40;

  if (!nama) return { error: 'Nama ruangan wajib diisi' };

  try {
    await prisma.ruangan.create({ data: { nama, kapasitas } });
    revalidateRuanganAll();
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { error: 'Nama ruangan sudah digunakan' };
    return { error: 'Gagal menambahkan ruangan' };
  }
}

export async function updateRuangan(id: number, formData: FormData) {
  const nama = (formData.get('nama') as string)?.trim();
  const kapasitas = parseInt(formData.get('kapasitas') as string) || 40;

  if (!nama) return { error: 'Nama ruangan wajib diisi' };

  try {
    await prisma.ruangan.update({ where: { id }, data: { nama, kapasitas } });
    revalidateRuanganAll();
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { error: 'Nama ruangan sudah digunakan' };
    return { error: 'Gagal mengubah data ruangan' };
  }
}

export async function deleteRuangan(id: number) {
  try {
    const ruangan = await prisma.ruangan.findUnique({
      where: { id },
      include: { _count: { select: { siswas: true } } }
    });

    if (!ruangan) return { error: 'Ruangan tidak ditemukan' };

    if (ruangan._count.siswas > 0) {
      return { error: `Tidak dapat menghapus ruangan karena masih ada ${ruangan._count.siswas} siswa yang terdaftar di ruangan ini.` };
    }

    await prisma.ruangan.delete({ where: { id } });
    revalidateRuanganAll();
    return { success: true };
  } catch {
    return { error: 'Gagal menghapus ruangan' };
  }
}
