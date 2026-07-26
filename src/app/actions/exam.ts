'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logoutSiswa } from './auth';

function cleanHtml(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function checkIsCorrect(soal: { opsi: string; kunciJawaban: string }, opsiDipilih: string | null): boolean {
  if (!soal || !soal.kunciJawaban || !opsiDipilih) return false;

  const kunciRaw = soal.kunciJawaban.trim();
  const selectedRaw = opsiDipilih.trim();

  // 1. Match persis (teks opsi sama atau huruf kunci sama)
  if (kunciRaw === selectedRaw) return true;

  // 2. Match setelah pembersihan tag HTML
  const cleanKunci = cleanHtml(kunciRaw);
  const cleanSelected = cleanHtml(selectedRaw);
  if (cleanKunci && cleanSelected && cleanKunci.toLowerCase() === cleanSelected.toLowerCase()) return true;

  // Parse JSON opsi dari bank soal
  let opsiArr: string[] = [];
  try {
    opsiArr = JSON.parse(soal.opsi);
  } catch {
    opsiArr = [];
  }

  // 3. Match jika kunciJawaban berbentuk huruf 'A', 'B', 'C', 'D', 'E'
  const letterIndex = kunciRaw.toUpperCase().charCodeAt(0) - 65;
  if (letterIndex >= 0 && letterIndex < 26 && letterIndex < opsiArr.length) {
    const correctOptionText = opsiArr[letterIndex];
    if (correctOptionText) {
      if (correctOptionText.trim() === selectedRaw) return true;
      if (cleanHtml(correctOptionText).toLowerCase() === cleanSelected.toLowerCase()) return true;
    }
  }

  // 4. Match jika kunciJawaban berbentuk indeks angka '0', '1', '2', '3', '4'
  const numIndex = parseInt(kunciRaw, 10);
  if (!isNaN(numIndex) && numIndex >= 0 && numIndex < opsiArr.length) {
    const correctOptionText = opsiArr[numIndex];
    if (correctOptionText) {
      if (correctOptionText.trim() === selectedRaw) return true;
      if (cleanHtml(correctOptionText).toLowerCase() === cleanSelected.toLowerCase()) return true;
    }
  }

  // 5. Match jika kunciJawaban & opsiDipilih sama-sama berbentuk huruf ('A', 'B', 'C', etc.)
  if (kunciRaw.toUpperCase() === selectedRaw.toUpperCase()) return true;

  return false;
}

export async function saveAnswer(sesiId: number, soalId: number, opsiDipilih: string) {
  const sesi = await prisma.sesiUjianSiswa.findUnique({ where: { id: sesiId } });
  if (!sesi || sesi.status === 'FINISHED') {
    return { success: false, error: 'Sesi tidak valid' };
  }

  const soal = await prisma.soal.findUnique({ where: { id: soalId } });
  if (!soal) return { success: false };

  const isBenar = checkIsCorrect(soal, opsiDipilih);

  await prisma.jawabanSiswa.upsert({
    where: {
      sesiId_soalId: { sesiId, soalId }
    },
    update: {
      opsiDipilih,
      isBenar
    },
    create: {
      sesiId,
      soalId,
      opsiDipilih,
      isBenar
    }
  });

  return { success: true };
}

export async function submitExam(sesiId: number) {
  // Hitung nilai akhir
  const sesi = await prisma.sesiUjianSiswa.findUnique({
    where: { id: sesiId },
    include: {
      jawabans: { include: { soal: true } },
      jadwal: { include: { bankSoal: { include: { soals: true } } } }
    }
  });

  if (!sesi) return { success: false };

  // Evaluasi ulang kebenaran setiap jawaban untuk kepastian 100%
  let bobotDiperoleh = 0;
  for (const j of sesi.jawabans) {
    const isCorrect = checkIsCorrect(j.soal, j.opsiDipilih);
    if (j.isBenar !== isCorrect) {
      await prisma.jawabanSiswa.update({
        where: { id: j.id },
        data: { isBenar: isCorrect }
      });
    }
    if (isCorrect) {
      bobotDiperoleh += j.soal.bobot;
    }
  }

  const totalBobot = sesi.jadwal.bankSoal.soals.reduce((sum: number, s: any) => sum + s.bobot, 0);
  const nilaiAkhir = totalBobot > 0 ? Math.round((bobotDiperoleh / totalBobot) * 100) : 0;

  await prisma.sesiUjianSiswa.update({
    where: { id: sesiId },
    data: {
      status: 'FINISHED',
      waktuSelesai: new Date(),
      nilaiAkhir
    }
  });

  return { success: true, nilaiAkhir };
}

export async function reportCheat(sesiId: number) {
  const sesi = await prisma.sesiUjianSiswa.findUnique({ where: { id: sesiId } });
  if (!sesi || sesi.status === 'FINISHED') return { forcedSubmit: false, count: 0 };

  const updatedSesi = await prisma.sesiUjianSiswa.update({
    where: { id: sesiId },
    data: {
      pelanggaran: { increment: 1 }
    }
  });

  // Jika pelanggaran >= 3, trigger auto-submit
  if (updatedSesi.pelanggaran >= 3) {
    await submitExam(sesiId);
    return { forcedSubmit: true, count: updatedSesi.pelanggaran };
  }

  return { forcedSubmit: false, count: updatedSesi.pelanggaran };
}

export async function checkSessionStatus(sesiId: number) {
  const sesi = await prisma.sesiUjianSiswa.findUnique({ where: { id: sesiId } });
  if (!sesi) {
    // Sesi dihapus oleh proktor (Hapus & Mulai Ulang) atau Admin (Reset Global)
    return { valid: false, reason: 'DELETED' };
  }
  if (sesi.status === 'FINISHED') {
    // Sesi diselesaikan paksa oleh proktor
    return { valid: false, reason: 'FINISHED' };
  }
  return { valid: true };
}

// Untuk melogout siswa secara paksa dari client component
export async function forceLogout() {
  await logoutSiswa();
}
