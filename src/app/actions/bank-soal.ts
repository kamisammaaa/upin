'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal membuat bank soal' };
  }
}

export async function deleteBankSoal(id: number) {
  try {
    await prisma.bankSoal.delete({
      where: { id }
    });
    revalidatePath('/admin/bank-soal');
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal menghapus bank soal' };
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
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal menambahkan soal' };
  }
}

export async function deleteSoal(soalId: number, bankSoalId: number) {
  try {
    await prisma.soal.delete({
      where: { id: soalId }
    });
    revalidatePath(`/admin/bank-soal/${bankSoalId}`);
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal menghapus soal' };
  }
}
