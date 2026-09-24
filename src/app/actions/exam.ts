'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
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

// Cache in-memory metadata soal (opsi & kunci) untuk memangkas ribuan query redundant ke SQLite saat ratusan siswa klik jawaban
const soalCache = new Map<number, { opsi: string; kunciJawaban: string }>();

async function getCachedSoal(soalId: number) {
  let soal = soalCache.get(soalId);
  if (!soal) {
    const dbSoal = await prisma.soal.findUnique({
      where: { id: soalId },
      select: { opsi: true, kunciJawaban: true }
    });
    if (dbSoal) {
      soal = dbSoal;
      soalCache.set(soalId, soal);
    }
  }
  return soal;
}

export async function clearSoalCache() {
  soalCache.clear();
}

export async function saveAnswer(sesiId: number, soalId: number, opsiDipilih: string) {
  const sesi = await prisma.sesiUjianSiswa.findUnique({ 
    where: { id: sesiId },
    select: { status: true, jadwal: { select: { waktuSelesai: true } } }
  });
  if (!sesi || sesi.status === 'FINISHED') {
    return { success: false, error: 'Sesi tidak valid' };
  }

  // Jika waktu jadwal sudah lewat saat mencoba simpan jawaban, finalisasi ujian
  if (sesi.jadwal?.waktuSelesai && new Date() > sesi.jadwal.waktuSelesai) {
    await submitExam(sesiId);
    return { success: false, error: 'Waktu ujian telah berakhir' };
  }

  const soal = await getCachedSoal(soalId);
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

// Batch save: simpan banyak jawaban sekaligus dalam 1 transaksi database (lebih cepat & atomic)
export async function saveManyAnswers(sesiId: number, answers: Record<number, string>) {
  const sesi = await prisma.sesiUjianSiswa.findUnique({ 
    where: { id: sesiId },
    select: { status: true, jadwal: { select: { waktuSelesai: true } } }
  });
  if (!sesi || sesi.status === 'FINISHED') {
    return { success: false, error: 'Sesi tidak valid' };
  }

  // Jika waktu jadwal sudah lewat saat mencoba simpan jawaban, finalisasi ujian
  if (sesi.jadwal?.waktuSelesai && new Date() > sesi.jadwal.waktuSelesai) {
    await submitExam(sesiId);
    return { success: false, error: 'Waktu ujian telah berakhir' };
  }

  const soalIds = Object.keys(answers).map(Number);
  if (soalIds.length === 0) return { success: true };

  const soals = await prisma.soal.findMany({ where: { id: { in: soalIds } } });
  const soalMap = new Map(soals.map(s => [s.id, s]));

  await prisma.$transaction(
    soalIds.map(soalId => {
      const opsiDipilih = answers[soalId];
      const soal = soalMap.get(soalId);
      const isBenar = soal ? checkIsCorrect(soal, opsiDipilih) : false;
      return prisma.jawabanSiswa.upsert({
        where: { sesiId_soalId: { sesiId, soalId } },
        update: { opsiDipilih, isBenar },
        create: { sesiId, soalId, opsiDipilih, isBenar }
      });
    })
  );

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

  // Idempotent: jika sesi sudah FINISHED, kembalikan sukses tanpa proses ulang
  if (sesi.status === 'FINISHED') {
    return { success: true, nilaiAkhir: sesi.nilaiAkhir ?? 0 };
  }

  // Evaluasi ulang kebenaran setiap jawaban untuk kepastian 100%
  let bobotDiperoleh = 0;
  for (const j of sesi.jawabans) {
    if (!j.soal) continue;
    const isCorrect = checkIsCorrect(j.soal, j.opsiDipilih);
    if (j.isBenar !== isCorrect) {
      await prisma.jawabanSiswa.update({
        where: { id: j.id },
        data: { isBenar: isCorrect }
      });
    }
    if (isCorrect) {
      bobotDiperoleh += (j.soal.bobot || 1);
    }
  }

  const soals = sesi.jadwal?.bankSoal?.soals || [];
  const totalBobot = soals.reduce((sum: number, s: any) => sum + (s.bobot || 1), 0);
  const nilaiAkhir = totalBobot > 0 ? Math.round((bobotDiperoleh / totalBobot) * 100) : 0;

  const now = new Date();
  const waktuSelesai = (sesi.jadwal?.waktuSelesai && now > sesi.jadwal.waktuSelesai)
    ? sesi.jadwal.waktuSelesai
    : now;

  await prisma.sesiUjianSiswa.update({
    where: { id: sesiId },
    data: {
      status: 'FINISHED',
      waktuSelesai,
      nilaiAkhir
    }
  });

  try {
    revalidatePath('/siswa');
    revalidatePath('/admin/proktor');
    revalidatePath(`/admin/proktor/monitor/${sesi.jadwalId}`);
    revalidatePath('/admin/guru/nilai');
    revalidatePath(`/admin/guru/nilai/${sesi.jadwalId}`);
    revalidatePath(`/admin/jadwal/${sesi.jadwalId}`);
    revalidatePath('/admin/jadwal');
  } catch {}

  return { success: true, nilaiAkhir };
}

// Otomatis finalisasi & hitung nilai semua sesi yang jadwal ujiannya sudah berakhir
export async function autoFinalizeExpiredSessions(targetJadwalId?: number) {
  try {
    const now = new Date();
    const expiredSessions = await prisma.sesiUjianSiswa.findMany({
      where: {
        status: 'ONGOING',
        ...(targetJadwalId ? { jadwalId: targetJadwalId } : {}),
        jadwal: {
          waktuSelesai: { lte: now }
        }
      },
      select: { id: true, jadwalId: true }
    });

    if (expiredSessions.length === 0) return { count: 0 };

    for (const s of expiredSessions) {
      await submitExam(s.id);
    }

    return { count: expiredSessions.length };
  } catch (error) {
    console.error('Gagal auto-finalize sesi ujian kedaluwarsa:', error);
    return { count: 0, error };
  }
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
  if (!sesiId || isNaN(sesiId)) return { valid: true };
  try {
    const sesi = await prisma.sesiUjianSiswa.findUnique({ 
      where: { id: sesiId },
      include: { jadwal: { select: { waktuSelesai: true } } }
    });
    if (!sesi) {
      // Sesi dihapus oleh proktor (Hapus & Mulai Ulang) atau Admin (Reset Global)
      return { valid: false, reason: 'DELETED' };
    }
    if (sesi.status === 'FINISHED') {
      // Sesi diselesaikan paksa oleh proktor
      return { valid: false, reason: 'FINISHED' };
    }
    // Jika waktu jadwal sudah berakhir, finalisasi otomatis dan arahkan keluar
    if (sesi.jadwal?.waktuSelesai && new Date() >= sesi.jadwal.waktuSelesai) {
      await submitExam(sesiId);
      return { valid: false, reason: 'FINISHED' };
    }
    return { valid: true };
  } catch (error) {
    // Jika ada kendala koneksi sementara, jangan logout siswa
    return { valid: true };
  }
}

// Untuk melogout siswa secara paksa dari client component
export async function forceLogout() {
  await logoutSiswa();
}
