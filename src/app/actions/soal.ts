'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { clearSoalCache } from './exam';

export async function getSoalByBankSoalId(bankSoalId: number) {
  try {
    return await prisma.soal.findMany({
      where: { bankSoalId },
      orderBy: { id: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching soal:", error);
    return [];
  }
}

export async function getBankSoalDetail(id: number) {
  try {
    return await prisma.bankSoal.findUnique({
      where: { id },
      include: {
        mapel: true,
        guru: true
      }
    });
  } catch (error) {
    console.error("Error fetching bank soal:", error);
    return null;
  }
}

export async function tambahBankSoal(formData: FormData, guruId: number) {
  try {
    const judul = formData.get('judul') as string;
    const mapelId = Number(formData.get('mapelId'));

    if (!judul || !mapelId) throw new Error('Data tidak lengkap');

    const newBankSoal = await prisma.bankSoal.create({
      data: {
        judul,
        mapelId,
        guruId
      }
    });

    revalidatePath('/admin/guru/bank-soal');
    revalidatePath('/admin/bank-soal');
    return { success: true, id: newBankSoal.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function tambahSoalPilihanGanda(formData: FormData) {
  try {
    const bankSoalId = Number(formData.get('bankSoalId'));
    const pertanyaan = formData.get('pertanyaan') as string;
    const opsiA = formData.get('opsiA') as string;
    const opsiB = formData.get('opsiB') as string;
    const opsiC = formData.get('opsiC') as string;
    const opsiD = formData.get('opsiD') as string;
    const opsiE = formData.get('opsiE') as string;
    const kunciJawaban = formData.get('kunciJawaban') as string;
    const bobot = Number(formData.get('bobot') || 1);

    const opsi = [opsiA, opsiB, opsiC, opsiD, opsiE].filter(Boolean); // Filter empty options

    const newSoal = await prisma.soal.create({
      data: {
        bankSoalId,
        pertanyaan,
        opsi: JSON.stringify(opsi),
        kunciJawaban,
        bobot
      }
    });

    await clearSoalCache();
    revalidatePath(`/admin/guru/bank-soal/${bankSoalId}`);
    return { success: true, message: 'Soal berhasil ditambahkan', id: newSoal.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function hapusSoal(soalId: number, bankSoalId: number) {
  try {
    await prisma.$transaction([
      prisma.jawabanSiswa.deleteMany({ where: { soalId } }),
      prisma.soal.delete({ where: { id: soalId } }),
    ]);
    await clearSoalCache();
    revalidatePath(`/admin/guru/bank-soal/${bankSoalId}`);
    revalidatePath(`/admin/bank-soal/${bankSoalId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function importBulkSoal(bankSoalId: number, dataSoal: any[]) {
  try {
    const soalToInsert = dataSoal.map((soal) => {
      const opsiArray = [soal.opsiA, soal.opsiB];
      if (soal.opsiC) opsiArray.push(soal.opsiC);
      if (soal.opsiD) opsiArray.push(soal.opsiD);
      if (soal.opsiE) opsiArray.push(soal.opsiE);

      return {
        bankSoalId,
        pertanyaan: soal.pertanyaan,
        opsi: JSON.stringify(opsiArray),
        kunciJawaban: soal.kunciJawaban,
        bobot: soal.bobot || 1,
      };
    });

    await prisma.soal.createMany({
      data: soalToInsert,
    });

    await clearSoalCache();
    revalidatePath(`/admin/bank-soal/${bankSoalId}`);
    revalidatePath(`/admin/guru/bank-soal/${bankSoalId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error import soal:", error);
    return { success: false, error: 'Gagal mengimpor soal. Pastikan format benar.' };
  }
}

export async function getSoalById(id: number) {
  try {
    return await prisma.soal.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error("Error fetching soal by id:", error);
    return null;
  }
}

export async function updateSoalPilihanGanda(soalId: number, formData: FormData) {
  try {
    const bankSoalId = Number(formData.get('bankSoalId'));
    const pertanyaan = formData.get('pertanyaan') as string;
    const opsiA = formData.get('opsiA') as string;
    const opsiB = formData.get('opsiB') as string;
    const opsiC = formData.get('opsiC') as string;
    const opsiD = formData.get('opsiD') as string;
    const opsiE = formData.get('opsiE') as string;
    const kunciJawaban = formData.get('kunciJawaban') as string;
    const bobot = Number(formData.get('bobot') || 1);

    const opsi = [opsiA, opsiB, opsiC, opsiD, opsiE].filter(Boolean); // Filter empty options

    await prisma.soal.update({
      where: { id: soalId },
      data: {
        pertanyaan,
        opsi: JSON.stringify(opsi),
        kunciJawaban,
        bobot
      }
    });

    await clearSoalCache();
    revalidatePath(`/admin/guru/bank-soal/${bankSoalId}`);
    revalidatePath(`/admin/bank-soal/${bankSoalId}`);
    return { success: true, message: 'Soal berhasil diperbarui' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

