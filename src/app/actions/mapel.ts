'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';

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
    const inUse = await prisma.bankSoal.count({ where: { mapelId: id } });
    if (inUse > 0) {
      return { success: false, message: `Mata pelajaran tidak dapat dihapus karena masih digunakan oleh ${inUse} Bank Soal.` };
    }

    await prisma.mataPelajaran.delete({
      where: { id }
    });

    revalidatePath('/admin/master/mapel');
    return { success: true, message: 'Mata pelajaran berhasil dihapus' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteManyMapel(ids: number[]) {
  if (!ids || ids.length === 0) {
    return { success: false, message: 'Tidak ada mata pelajaran yang dipilih' };
  }

  try {
    // 1. Cek mata pelajaran mana saja yang sedang digunakan di BankSoal
    const inUseBankSoals = await prisma.bankSoal.findMany({
      where: { mapelId: { in: ids } },
      select: { mapelId: true }
    });
    const inUseMapelIds = new Set(inUseBankSoals.map(b => b.mapelId));

    const deletableIds = ids.filter(id => !inUseMapelIds.has(id));

    if (deletableIds.length === 0) {
      return { 
        success: false, 
        message: `Semua (${ids.length}) mata pelajaran yang dipilih tidak dapat dihapus karena masih digunakan di Bank Soal.` 
      };
    }

    const { count } = await prisma.mataPelajaran.deleteMany({
      where: { id: { in: deletableIds } }
    });

    await logAudit('ADMIN', 'DELETE_MASSAL_MAPEL', 'MataPelajaran', `Hapus massal: ${count} mapel dihapus, ${inUseMapelIds.size} dilewati`);
    revalidatePath('/admin/master/mapel');

    let message = `Berhasil menghapus ${count} mata pelajaran.`;
    if (inUseMapelIds.size > 0) {
      message += ` (${inUseMapelIds.size} mata pelajaran dilewati karena masih digunakan di Bank Soal).`;
    }

    return { 
      success: true, 
      message, 
      deletedCount: count,
      skippedCount: inUseMapelIds.size,
      deletedIds: deletableIds
    };
  } catch (error: any) {
    return { success: false, message: 'Gagal menghapus mata pelajaran massal: ' + (error.message || 'Kesalahan sistem') };
  }
}

export async function importMapel(data: { nama: string }[]) {
  try {
    if (!data || data.length === 0) {
      return { success: false, message: 'Tidak ada data mata pelajaran untuk diimpor.' };
    }

    // Ambil daftar nama unik yang valid dan tidak kosong
    const uniqueInputMap = new Map<string, string>();
    for (const item of data) {
      const clean = (item.nama || '').trim();
      if (clean) {
        const lower = clean.toLowerCase();
        if (!uniqueInputMap.has(lower)) {
          uniqueInputMap.set(lower, clean);
        }
      }
    }

    const uniqueNames = Array.from(uniqueInputMap.values());
    if (uniqueNames.length === 0) {
      return { success: false, message: 'Tidak ada nama mata pelajaran yang valid dalam file.' };
    }

    // Cek mata pelajaran yang sudah ada di database (case-insensitive check)
    const existing = await prisma.mataPelajaran.findMany({
      select: { nama: true }
    });
    const existingSet = new Set(existing.map(e => e.nama.trim().toLowerCase()));

    const toCreate = uniqueNames.filter(n => !existingSet.has(n.toLowerCase()));

    if (toCreate.length > 0) {
      await prisma.mataPelajaran.createMany({
        data: toCreate.map(nama => ({ nama }))
      });
    }

    const skipped = uniqueNames.length - toCreate.length;
    await logAudit('ADMIN', 'IMPORT_MAPEL', 'MataPelajaran', `Import massal: ${toCreate.length} baru, ${skipped} dilewati`);
    revalidatePath('/admin/master/mapel');

    let message = `Berhasil mengimpor ${toCreate.length} mata pelajaran baru.`;
    if (skipped > 0) {
      message += ` (${skipped} mata pelajaran dilewati karena sudah terdaftar).`;
    }

    return { 
      success: true, 
      message, 
      importedCount: toCreate.length, 
      skippedCount: skipped 
    };
  } catch (error: any) {
    return { success: false, message: 'Gagal mengimpor mata pelajaran: ' + (error.message || 'Terjadi kesalahan sistem') };
  }
}

export async function exportDataMapel() {
  const mapels = await prisma.mataPelajaran.findMany({
    orderBy: { nama: 'asc' },
    select: {
      id: true,
      nama: true
    }
  });

  return mapels.map((m, index) => ({
    No: index + 1,
    Nama_Mata_Pelajaran: m.nama
  }));
}
