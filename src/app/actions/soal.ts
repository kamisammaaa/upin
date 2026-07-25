'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

    revalidatePath(`/admin/guru/bank-soal/${bankSoalId}`);
    return { success: true, message: 'Soal berhasil ditambahkan', id: newSoal.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function hapusSoal(soalId: number, bankSoalId: number) {
  try {
    await prisma.soal.delete({
      where: { id: soalId }
    });
    revalidatePath(`/admin/guru/bank-soal/${bankSoalId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
