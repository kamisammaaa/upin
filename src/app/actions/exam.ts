'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logoutSiswa } from './auth';

export async function saveAnswer(sesiId: number, soalId: number, opsiDipilih: string) {
  const sesi = await prisma.sesiUjianSiswa.findUnique({ where: { id: sesiId } });
  if (!sesi || sesi.status === 'FINISHED') {
    return { success: false, error: 'Sesi tidak valid' };
  }

  const soal = await prisma.soal.findUnique({ where: { id: soalId } });
  if (!soal) return { success: false };

  const isBenar = soal.kunciJawaban === opsiDipilih;

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

  const totalBobot = sesi.jadwal.bankSoal.soals.reduce((sum: number, s: any) => sum + s.bobot, 0);
  const bobotDiperoleh = sesi.jawabans.reduce((sum: number, j: any) => {
    return j.isBenar ? sum + j.soal.bobot : sum;
  }, 0);

  const nilaiAkhir = totalBobot > 0 ? (bobotDiperoleh / totalBobot) * 100 : 0;

  await prisma.sesiUjianSiswa.update({
    where: { id: sesiId },
    data: {
      status: 'FINISHED',
      waktuSelesai: new Date(),
      nilaiAkhir
    }
  });

  return { success: true };
}

export async function reportCheat(sesiId: number) {
  const sesi = await prisma.sesiUjianSiswa.findUnique({ where: { id: sesiId } });
  if (!sesi) return { forcedSubmit: false };

  await prisma.sesiUjianSiswa.update({
    where: { id: sesiId },
    data: {
      pelanggaran: { increment: 1 }
    }
  });
  
  const updatedSesi = await prisma.sesiUjianSiswa.findUnique({ where: { id: sesiId } });
  
  // Jika pelanggaran > 3, trigger auto-submit
  if (updatedSesi && updatedSesi.pelanggaran > 3) {
    await submitExam(sesiId);
    return { forcedSubmit: true };
  }

  return { forcedSubmit: false };
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
