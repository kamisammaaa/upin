'use server';

import prisma from '@/lib/prisma';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import { submitExam, autoFinalizeExpiredSessions } from './exam';

// Memetakan status DB ke label UI
function normalizeStatus(dbStatus: string | null | undefined): string {
  if (!dbStatus) return 'BELUM MULAI';
  if (dbStatus === 'ONGOING')   return 'MENGERJAKAN';
  if (dbStatus === 'FINISHED')  return 'SELESAI';
  return dbStatus; // fallback jika sudah cocok
}

export async function getJadwalMonitorData(jadwalId: number) {
  noStore();
  
  // Otomatis finalisasi & nilai sesi siswa jika waktu jadwal ujian sudah lewat
  await autoFinalizeExpiredSessions(jadwalId);

  // Ambil detail jadwal
  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: {
      bankSoal: { include: { mapel: true, _count: { select: { soals: true } } } },
      kelas: true,
      siswaKhusus: { include: { kelas: true } }
    }
  });

  if (!jadwal) return null;

  // Jika jadwal bertipe SUSULAN dan memiliki siswa khusus, tampilkan siswa khusus tersebut
  let semuaSiswa: any[] = [];
  if (jadwal.tipeUjian === 'SUSULAN' && jadwal.siswaKhusus && jadwal.siswaKhusus.length > 0) {
    semuaSiswa = [...jadwal.siswaKhusus].sort((a, b) => a.nama.localeCompare(b.nama));
  } else {
    // Ambil data siswa yang seharusnya ikut jadwal ini (berdasarkan kelas)
    const kelasIds = jadwal.kelas.map((k: any) => k.id);
    semuaSiswa = await prisma.siswa.findMany({
      where: { kelasId: { in: kelasIds } },
      include: { kelas: true },
      orderBy: { nama: 'asc' }
    });
  }

  // Ambil progres/sesi yang sudah ada
  const sesiUjian = await prisma.sesiUjianSiswa.findMany({
    where: { jadwalId },
    include: { 
      siswa: true,
      _count: { select: { jawabans: true } }
    }
  });

  const totalSoal = jadwal.bankSoal._count?.soals ?? 0;

  // Gabungkan data
  const result = semuaSiswa.map(siswa => {
    const sesi = sesiUjian.find(s => s.siswaId === siswa.id);
    return {
      siswaId: siswa.id,
      nis: siswa.nis,
      nama: siswa.nama,
      kelas: siswa.kelas.nama,
      status: normalizeStatus(sesi?.status),
      pelanggaran: sesi ? sesi.pelanggaran : 0,
      waktuMulai: sesi?.waktuMulai,
      waktuSelesai: sesi?.waktuSelesai,
      nilaiAkhir: sesi?.nilaiAkhir,
      sesiId: sesi?.id || null,
      jumlahDijawab: sesi ? (sesi as any)._count?.jawabans ?? 0 : 0,
      totalSoal: totalSoal
    };
  });

  return { jadwal, peserta: result };
}
export async function getAnalisisSoalData(jadwalId: number) {
  noStore();
  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: {
      bankSoal: {
        include: {
          soals: {
            include: { jawabans: true }
          }
        }
      }
    }
  });

  if (!jadwal) return null;

  // Sesi ujian untuk menghitung total peserta yang sudah mengerjakan
  const totalPesertaSelesai = await prisma.sesiUjianSiswa.count({
    where: { jadwalId, status: 'FINISHED' }
  });

  const sesiIds = (await prisma.sesiUjianSiswa.findMany({
    where: { jadwalId },
    select: { id: true }
  })).map(s => s.id);

  const totalPesertaAktif = sesiIds.length;

  const analisis = jadwal.bankSoal.soals.map(s => {
    const jawabans = s.jawabans.filter(j => sesiIds.includes(j.sesiId));
    const benar = jawabans.filter(j => j.isBenar).length;
    const salah = jawabans.filter(j => !j.isBenar && j.opsiDipilih).length;
    const kosong = Math.max(0, totalPesertaAktif - (benar + salah));
    const total = totalPesertaAktif;

    return {
      id: s.id,
      pertanyaan: s.pertanyaan,
      benar,
      salah,
      kosong,
      total,
      persentase: total > 0 ? (benar / total) * 100 : 0
    };
  });

  return { totalPesertaSelesai, analisis };
}

export async function getRuanganMonitorData(ruanganId: number, proctorId: number) {
  noStore();
  await autoFinalizeExpiredSessions();
  const now = new Date();
  
  const pengaturan = await prisma.pengaturan.findUnique({ where: { id: 1 } });

  // 1. Ambil detail ruangan
  const ruangan = await prisma.ruangan.findUnique({
    where: { id: ruanganId }
  });

  if (!ruangan) return null;

  // 2. Ambil semua siswa yang menetap di ruangan ini
  const semuaSiswa = await prisma.siswa.findMany({
    where: { ruanganId },
    include: { kelas: true },
    orderBy: { nama: 'asc' }
  });

  if (semuaSiswa.length === 0) return { ruangan, jadwals: [], peserta: [] };

  const kelasIds = Array.from(new Set(semuaSiswa.map(s => s.kelasId)));

  // 3. Ambil jadwal ujian yang sedang aktif untuk kelas-kelas tersebut
  const jadwals = await prisma.jadwalUjian.findMany({
    where: {
      waktuSelesai: { gte: now },
      waktuMulai: { lte: now },
      kelas: {
        some: { id: { in: kelasIds } }
      }
    },
    include: {
      bankSoal: { include: { mapel: true, _count: { select: { soals: true } } } },
      kelas: true
    }
  });

  // 4. Ambil semua sesi ujian + jumlah jawaban per sesi
  const jadwalIds = jadwals.map((j: any) => j.id);
  const siswaIds = semuaSiswa.map(s => s.id);
  const sesiUjian = await prisma.sesiUjianSiswa.findMany({
    where: { 
      jadwalId: { in: jadwalIds },
      siswaId: { in: siswaIds }
    },
    include: {
      _count: { select: { jawabans: true } }
    }
  });

  // Buat map jumlah soal per jadwal (untuk menghitung persentase)
  const totalSoalPerJadwal: Record<number, number> = {};
  for (const j of jadwals) {
    totalSoalPerJadwal[j.id] = j.bankSoal._count?.soals ?? await prisma.soal.count({ where: { bankSoalId: j.bankSoalId } });
  }

  // 5. Gabungkan Data Siswa dengan Sesi dan Jadwal-nya (Mata Pelajaran)
  const pesertaResult = semuaSiswa.map((siswa: any) => {
    // Cari siswa ini seharusnya ikut ujian mana berdasarkan kelasnya
    let jadwalSiswa = jadwals.find((j: any) => j.kelas.some((k: any) => k.id === siswa.kelasId));
    
    // Cek apakah dia sudah punya sesi aktif
    let sesi = sesiUjian.find((s: any) => s.siswaId === siswa.id);

    // Jika dia punya sesi aktif, set jadwalnya sesuai sesi tersebut
    if (sesi) {
      jadwalSiswa = jadwals.find(j => j.id === sesi.jadwalId) || jadwalSiswa;
    }
    
    // Jika siswa ini tidak ada jadwal aktif saat ini
    if (!jadwalSiswa) {
       return {
          siswaId: siswa.id,
          nis: siswa.nis,
          nama: siswa.nama,
          kelas: siswa.kelas.nama,
          mapel: 'TIDAK ADA UJIAN',
          jadwalId: null,
          sesiId: null,
          status: 'TIDAK AKTIF',
          pelanggaran: 0,
          nilaiAkhir: null,
          jumlahDijawab: 0,
          totalSoal: 0,
       }
    }

    const totalSoal = jadwalSiswa ? (totalSoalPerJadwal[jadwalSiswa.id] ?? 0) : 0;
    const jumlahDijawab = sesi ? (sesi as any)._count?.jawabans ?? 0 : 0;

    return {
      siswaId: siswa.id,
      nis: siswa.nis,
      nama: siswa.nama,
      kelas: siswa.kelas.nama,
      mapel: jadwalSiswa.bankSoal.mapel.nama,
      jadwalId: jadwalSiswa.id,
      sesiId: sesi ? sesi.id : null,
      status: normalizeStatus(sesi?.status),
      pelanggaran: sesi ? sesi.pelanggaran : 0,
      nilaiAkhir: sesi?.nilaiAkhir,
      jumlahDijawab,
      totalSoal,
    };
  });

  return {
    pengaturan,
    ruangan,
    jadwals,
    peserta: pesertaResult
  };
}

export async function forceSubmitSesi(sesiId: number) {
  try {
    const res = await submitExam(sesiId);
    if (!res.success) return { success: false, message: 'Sesi tidak ditemukan' };

    await logAudit('PROKTOR', 'FORCE_SUBMIT', 'SesiUjian', `Force submit sesi ID ${sesiId}, nilai: ${res.nilaiAkhir ?? 0}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function forceSubmitAllActiveInJadwal(jadwalId: number) {
  try {
    const ongoingSessions = await prisma.sesiUjianSiswa.findMany({
      where: {
        jadwalId,
        status: 'ONGOING'
      },
      select: { id: true }
    });

    if (ongoingSessions.length === 0) {
      return { success: true, count: 0 };
    }

    for (const s of ongoingSessions) {
      await submitExam(s.id);
    }

    await logAudit('PROKTOR', 'FORCE_SUBMIT_ALL', 'JadwalUjian', `Force submit all ${ongoingSessions.length} sesi for jadwal ID ${jadwalId}`);

    try {
      revalidatePath(`/admin/jadwal/${jadwalId}`);
      revalidatePath('/admin/jadwal');
      revalidatePath('/admin/guru/nilai');
      revalidatePath(`/admin/guru/nilai/${jadwalId}`);
    } catch {}

    return { success: true, count: ongoingSessions.length };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function resetLoginSiswa(sesiId: number) {
  try {
    await prisma.sesiUjianSiswa.update({
      where: { id: sesiId },
      data: {
        status: 'ONGOING',
        waktuSelesai: null,
        nilaiAkhir: null,
        pelanggaran: 0,
      }
    });
    try {
      revalidatePath('/siswa');
      revalidatePath('/admin/proktor');
    } catch {}
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Hapus & Mulai Ulang: hapus seluruh sesi + semua jawaban
export async function hapusUlangSiswa(sesiId: number) {
  try {
    // Hapus jawaban dulu (child), baru sesi (parent)
    await prisma.jawabanSiswa.deleteMany({ where: { sesiId } });
    await prisma.sesiUjianSiswa.delete({ where: { id: sesiId } });
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function refreshToken(ruanganId: number) {
  try {
    // Buat token 6 karakter random (Huruf kapital dan angka)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newToken = '';
    for (let i = 0; i < 6; i++) {
      newToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    await prisma.ruangan.update({
      where: { id: ruanganId },
      data: { token: newToken }
    });
    
    revalidatePath('/admin/proktor');
    revalidatePath(`/admin/proktor/monitor/${ruanganId}`);

    return { success: true, token: newToken };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

