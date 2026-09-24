'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { decodeToken } from '@/lib/jwt';

export async function createBankSoal(formData: FormData) {
  const judul = formData.get('judul') as string;
  const mapelId = parseInt(formData.get('mapelId') as string);
  const guruId = parseInt(formData.get('guruId') as string);

  if (!judul || isNaN(mapelId) || isNaN(guruId)) {
    return { error: 'Data tidak lengkap' };
  }

  try {
    await prisma.bankSoal.create({
      data: {
        judul,
        mapelId,
        guruId
      }
    });

    revalidatePath('/admin/bank-soal');
    revalidatePath('/admin/guru/bank-soal');
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal membuat bank soal' };
  }
}

export async function deleteBankSoal(id: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) {
      return { success: false, error: 'Sesi login tidak valid. Silakan login kembali.' };
    }

    const currentUser = decodeToken(token);
    if (!currentUser) {
      return { success: false, error: 'Token autentikasi tidak valid.' };
    }

    // Ambil data bank soal untuk validasi kepemilikan dan relasi
    const bankSoal = await prisma.bankSoal.findUnique({
      where: { id },
      include: {
        _count: {
          select: { soals: true, jadwals: true }
        }
      }
    });

    if (!bankSoal) {
      return { success: false, error: 'Bank soal tidak ditemukan.' };
    }

    // Jika yang menghapus adalah Guru, pastikan bank soal miliknya
    if (currentUser.role === 'GURU' && bankSoal.guruId !== currentUser.id) {
      return { success: false, error: 'Anda tidak memiliki hak akses untuk menghapus bank soal milik guru lain.' };
    }

    // Lakukan penghapusan secara bersih & berjenjang (cascading) dalam satu transaksi database
    await prisma.$transaction(async (tx) => {
      // 1. Ambil semua butir soal dalam bank soal ini
      const soals = await tx.soal.findMany({
        where: { bankSoalId: id },
        select: { id: true }
      });
      const soalIds = soals.map(s => s.id);

      // 2. Ambil semua jadwal yang terhubung ke bank soal ini
      const jadwals = await tx.jadwalUjian.findMany({
        where: { bankSoalId: id },
        select: { id: true }
      });
      const jadwalIds = jadwals.map(j => j.id);

      // 3. Hapus JawabanSiswa yang terhubung ke soal ini atau ke sesi jadwal ini
      if (soalIds.length > 0 || jadwalIds.length > 0) {
        await tx.jawabanSiswa.deleteMany({
          where: {
            OR: [
              ...(soalIds.length > 0 ? [{ soalId: { in: soalIds } }] : []),
              ...(jadwalIds.length > 0 ? [{ sesi: { jadwalId: { in: jadwalIds } } }] : [])
            ]
          }
        });
      }

      // 4. Hapus SesiUjianSiswa dan JadwalUjian terkait
      if (jadwalIds.length > 0) {
        await tx.sesiUjianSiswa.deleteMany({
          where: { jadwalId: { in: jadwalIds } }
        });

        await tx.jadwalUjian.deleteMany({
          where: { id: { in: jadwalIds } }
        });
      }

      // 5. Hapus butir soal
      if (soalIds.length > 0) {
        await tx.soal.deleteMany({
          where: { id: { in: soalIds } }
        });
      }

      // 6. Hapus BankSoal
      await tx.bankSoal.delete({
        where: { id }
      });
    });

    await logAudit(
      currentUser.nama,
      'DELETE_BANK_SOAL',
      'BankSoal',
      `Menghapus bank soal ID ${id}: "${bankSoal.judul}" (${bankSoal._count.soals} butir soal, ${bankSoal._count.jadwals} jadwal)`
    );

    revalidatePath('/admin/bank-soal');
    revalidatePath('/admin/guru/bank-soal');
    revalidatePath('/admin/jadwal');
    revalidatePath('/admin/guru/jadwal');

    return { 
      success: true, 
      message: `Bank soal "${bankSoal.judul}" berhasil dihapus.` 
    };
  } catch (error: any) {
    console.error('Error deleting bank soal:', error);
    return { 
      success: false, 
      error: 'Gagal menghapus bank soal: ' + (error.message || 'Terjadi kesalahan sistem.') 
    };
  }
}

export async function createSoal(bankSoalId: number, formData: FormData) {
  const pertanyaan = formData.get('pertanyaan') as string;
  const bobot = parseInt(formData.get('bobot') as string) || 1;
  const kunciJawaban = formData.get('kunciJawaban') as string;

  const opsiA = formData.get('opsiA') as string;
  const opsiB = formData.get('opsiB') as string;
  const opsiC = formData.get('opsiC') as string;
  const opsiD = formData.get('opsiD') as string;
  const opsiE = formData.get('opsiE') as string;

  if (!pertanyaan || !kunciJawaban || !opsiA || !opsiB) {
    return { error: 'Pertanyaan, Kunci Jawaban, dan minimal 2 opsi (A dan B) harus diisi' };
  }

  const opsisArray = [opsiA, opsiB];
  if (opsiC) opsisArray.push(opsiC);
  if (opsiD) opsisArray.push(opsiD);
  if (opsiE) opsisArray.push(opsiE);

  try {
    await prisma.soal.create({
      data: {
        bankSoalId,
        pertanyaan,
        opsi: JSON.stringify(opsisArray),
        kunciJawaban, // 'A', 'B', 'C', 'D', 'E'
        bobot
      }
    });

    revalidatePath(`/admin/bank-soal/${bankSoalId}`);
    revalidatePath(`/admin/guru/bank-soal/${bankSoalId}`);
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal menambahkan soal' };
  }
}

export async function deleteSoal(soalId: number, bankSoalId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      // Hapus JawabanSiswa yang terhubung ke soal ini terlebih dahulu
      await tx.jawabanSiswa.deleteMany({
        where: { soalId }
      });

      await tx.soal.delete({
        where: { id: soalId }
      });
    });

    revalidatePath(`/admin/bank-soal/${bankSoalId}`);
    revalidatePath(`/admin/guru/bank-soal/${bankSoalId}`);
    return { success: true, message: 'Butir soal berhasil dihapus.' };
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus butir soal: ' + (error.message || 'Terjadi kesalahan sistem.') };
  }
}

export async function updateBankSoal(id: number, formData: FormData) {
  try {
    const judul = (formData.get('judul') as string)?.trim();
    const mapelId = parseInt(formData.get('mapelId') as string);

    if (!judul || isNaN(mapelId)) {
      return { success: false, error: 'Judul dan Mata Pelajaran wajib diisi.' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) {
      return { success: false, error: 'Sesi login tidak valid. Silakan login kembali.' };
    }

    const currentUser = decodeToken(token);
    if (!currentUser) {
      return { success: false, error: 'Token autentikasi tidak valid.' };
    }

    const bankSoal = await prisma.bankSoal.findUnique({
      where: { id },
      include: { mapel: true }
    });

    if (!bankSoal) {
      return { success: false, error: 'Bank soal tidak ditemukan.' };
    }

    if (currentUser.role === 'GURU' && bankSoal.guruId !== currentUser.id) {
      return { success: false, error: 'Anda tidak memiliki hak akses untuk mengedit bank soal ini.' };
    }

    const updated = await prisma.bankSoal.update({
      where: { id },
      data: {
        judul,
        mapelId
      },
      include: {
        mapel: true
      }
    });

    await logAudit(
      currentUser.nama,
      'UPDATE_BANK_SOAL',
      'BankSoal',
      `Mengubah data bank soal ID ${id}: "${bankSoal.judul}" -> "${judul}" (Mapel ID: ${mapelId})`
    );

    revalidatePath('/admin/bank-soal');
    revalidatePath('/admin/guru/bank-soal');
    revalidatePath(`/admin/bank-soal/${id}`);
    revalidatePath(`/admin/guru/bank-soal/${id}`);
    revalidatePath('/admin/jadwal');
    revalidatePath('/admin/guru/jadwal');

    return { 
      success: true, 
      message: 'Bank soal berhasil diperbarui.',
      data: updated
    };
  } catch (error: any) {
    console.error('Error updating bank soal:', error);
    return { 
      success: false, 
      error: 'Gagal memperbarui bank soal: ' + (error.message || 'Terjadi kesalahan sistem.') 
    };
  }
}

