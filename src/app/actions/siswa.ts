'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { hashPassword } from '@/lib/hash';

function revalidateSiswaAndRuangan() {
  try { revalidatePath('/admin/master/siswa'); } catch {}
  try { revalidatePath('/admin/master/ruangan'); } catch {}
  try { revalidatePath('/admin/proktor'); } catch {}
  try { revalidatePath('/admin/proktor/monitor', 'layout'); } catch {}
  try { revalidatePath('/admin'); } catch {}
  try { revalidatePath('/siswa'); } catch {}
}

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
    const hashedPassword = await hashPassword(password);
    await prisma.siswa.create({
      data: {
        nis,
        nama,
        password: hashedPassword,
        passwordPlain: password,
        kelasId,
        ruanganId
      }
    });

    revalidateSiswaAndRuangan();
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'NIS sudah terdaftar' };
    }
    return { error: 'Gagal menambahkan siswa' };
  }
}

export async function importSiswa(data: { nis: string; nama: string; password: string; kelasId: number; ruanganId?: number | null }[]) {
  try {
    const processedData = await Promise.all(
      data.map(async (siswa) => {
        const nisStr = String(siswa.nis ?? '').trim();
        const pwdStr = String(siswa.password ?? '').trim();
        const namaStr = String(siswa.nama ?? '').trim();
        const isHashed = pwdStr.startsWith('$2a$') || pwdStr.startsWith('$2b$');
        const hashedPassword = isHashed ? pwdStr : await hashPassword(pwdStr);
        const plain = isHashed ? null : pwdStr;
        return { ...siswa, nis: nisStr, nama: namaStr, password: hashedPassword, passwordPlain: plain };
      })
    );

    await prisma.$transaction(
      processedData.map((siswa) => 
        prisma.siswa.upsert({
          where: { nis: siswa.nis },
          update: {
            nama: siswa.nama,
            password: siswa.password,
            ...(siswa.passwordPlain ? { passwordPlain: siswa.passwordPlain } : {}),
            kelasId: siswa.kelasId,
            ...(siswa.ruanganId !== undefined ? { ruanganId: siswa.ruanganId } : {})
          },
          create: {
            nis: siswa.nis,
            nama: siswa.nama,
            password: siswa.password,
            passwordPlain: siswa.passwordPlain,
            kelasId: siswa.kelasId,
            ruanganId: siswa.ruanganId ?? null
          }
        })
      )
    );
    
    revalidateSiswaAndRuangan();
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
    const isHashed = password.startsWith('$2a$') || password.startsWith('$2b$');
    const hashedPassword = isHashed ? password : await hashPassword(password);

    await prisma.siswa.update({
      where: { id: siswaId },
      data: {
        nis,
        nama,
        password: hashedPassword,
        ...(!isHashed ? { passwordPlain: password } : {}),
        kelasId,
        ruanganId
      }
    });

    revalidateSiswaAndRuangan();
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'NIS sudah digunakan' };
    }
    return { error: 'Gagal mengubah data siswa' };
  }
}

export async function exportDataSiswa(search?: string, kelasId?: string, ruanganId?: string) {
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
  if (ruanganId) {
    if (ruanganId === 'null') {
      where.ruanganId = null;
    } else {
      where.ruanganId = parseInt(ruanganId);
    }
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
    let count = 0;
    await prisma.$transaction(async (tx) => {
      // 1. Temukan semua sesi ujian milik siswa yang akan dihapus
      const sesis = await tx.sesiUjianSiswa.findMany({
        where: { siswaId: { in: ids } },
        select: { id: true }
      });
      const sesiIds = sesis.map(s => s.id);

      // 2. Hapus jawaban siswa
      if (sesiIds.length > 0) {
        await tx.jawabanSiswa.deleteMany({
          where: { sesiId: { in: sesiIds } }
        });
        await tx.sesiUjianSiswa.deleteMany({
          where: { id: { in: sesiIds } }
        });
      }

      // 3. Hapus data siswa
      const result = await tx.siswa.deleteMany({
        where: { id: { in: ids } }
      });
      count = result.count;
    });

    revalidateSiswaAndRuangan();
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

    revalidateSiswaAndRuangan();
    return { success: true, message: `Berhasil memindahkan ${count} siswa ke kelas baru.` };
  } catch (error: any) {
    return { error: 'Terjadi kesalahan saat memindahkan kelas siswa' };
  }
}

export async function updateRuanganMassal(ids: number[], ruanganId: number | null) {
  if (!ids || ids.length === 0) return { error: 'Tidak ada siswa yang dipilih' };
  
  try {
    const { count } = await prisma.siswa.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        ruanganId
      }
    });

    revalidateSiswaAndRuangan();
    return { success: true, message: `Berhasil mengatur ruangan untuk ${count} siswa.` };
  } catch (error: any) {
    return { error: 'Terjadi kesalahan saat mengatur ruangan siswa' };
  }
}
