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
    await prisma.$transaction(
      data.map((siswa) => 
        prisma.siswa.upsert({
          where: { nis: siswa.nis },
          update: {
            nama: siswa.nama,
            password: siswa.password,
            kelasId: siswa.kelasId
          },
          create: {
            nis: siswa.nis,
            nama: siswa.nama,
            password: siswa.password,
            kelasId: siswa.kelasId
          }
        })
      )
    );
    
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

export async function exportDataSiswa(search?: string, kelasId?: string) {
  const where: any = {};
  if (search) {
    where.OR = [
      { nama: { contains: search } },
      { nis: { contains: search } }
    ];
  }
  if (kelasId) {
    where.kelasId = parseInt(kelasId);
  }

  const siswas = await prisma.siswa.findMany({
    where,
    include: { kelas: true, ruangan: true },
    orderBy: { nama: 'asc' }
  });

  return siswas.map(s => ({
    NIS: s.nis,
    Nama: s.nama,
    Password: s.password,
    Kelas: s.kelas.nama,
    Ruangan: s.ruangan?.nama || '-'
  }));
}

export async function deleteSiswaMassal(ids: number[]) {
  if (!ids || ids.length === 0) return { error: 'Tidak ada siswa yang dipilih' };
  
  try {
    const { count } = await prisma.siswa.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    revalidatePath('/admin/master/siswa');
    return { success: true, message: `Berhasil menghapus ${count} siswa.` };
  } catch (error: any) {
    return { error: 'Terjadi kesalahan saat menghapus data massal' };
  }
}

export async function updateKelasMassal(ids: number[], kelasId: number) {
  if (!ids || ids.length === 0) return { error: 'Tidak ada siswa yang dipilih' };
  if (!kelasId) return { error: 'Kelas tujuan tidak valid' };
  
  try {
    const { count } = await prisma.siswa.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        kelasId
      }
    });

    revalidatePath('/admin/master/siswa');
    return { success: true, message: `Berhasil memindahkan ${count} siswa ke kelas baru.` };
  } catch (error: any) {
    return { error: 'Terjadi kesalahan saat memindahkan kelas siswa' };
  }
}
