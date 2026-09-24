'use server';

import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { autoFinalizeExpiredSessions } from './exam';

const KKM = 70;

export async function getHasilUjianOverview() {
  noStore();
  await autoFinalizeExpiredSessions();

  const pengaturan = await prisma.pengaturan.findUnique({ where: { id: 1 } });

  const jadwals = await prisma.jadwalUjian.findMany({
    include: {
      bankSoal: { include: { mapel: true } },
      kelas: true,
      sesiSiswa: {
        where: { status: 'FINISHED' },
        include: { siswa: { include: { kelas: true } } }
      },
    },
    orderBy: { waktuMulai: 'desc' }
  });

  const jadwalsWithResults = jadwals.filter(j => j.sesiSiswa.length > 0);
  const allSesi = jadwalsWithResults.flatMap(j => j.sesiSiswa);
  const nilaiArr = allSesi
    .filter(s => s.nilaiAkhir !== null)
    .map(s => s.nilaiAkhir as number);

  const totalSesiUjian = nilaiArr.length;
  const uniqueSiswaIds = new Set(allSesi.map(s => s.siswaId));
  const totalSiswa = uniqueSiswaIds.size;

  const rataRata = totalSesiUjian > 0
    ? nilaiArr.reduce((a, b) => a + b, 0) / totalSesiUjian
    : 0;
  const nilaiTertinggi = totalSesiUjian > 0 ? Math.max(...nilaiArr) : 0;
  const nilaiTerendah = totalSesiUjian > 0 ? Math.min(...nilaiArr) : 0;
  const jumlahLulus = nilaiArr.filter(n => n >= KKM).length;
  const persentaseLulus = totalSesiUjian > 0
    ? (jumlahLulus / totalSesiUjian) * 100
    : 0;

  const distribusi = [
    { range: '0–20', count: nilaiArr.filter(n => n >= 0 && n <= 20).length, color: '#ef4444' },
    { range: '21–40', count: nilaiArr.filter(n => n > 20 && n <= 40).length, color: '#f97316' },
    { range: '41–60', count: nilaiArr.filter(n => n > 40 && n <= 60).length, color: '#eab308' },
    { range: '61–80', count: nilaiArr.filter(n => n > 60 && n <= 80).length, color: '#22c55e' },
    { range: '81–100', count: nilaiArr.filter(n => n > 80 && n <= 100).length, color: '#10b981' },
  ];

  const jadwalSummary = jadwalsWithResults.map(j => {
    const nilaiJadwal = j.sesiSiswa
      .filter(s => s.nilaiAkhir !== null)
      .map(s => s.nilaiAkhir as number);
    const avg = nilaiJadwal.length > 0
      ? nilaiJadwal.reduce((a, b) => a + b, 0) / nilaiJadwal.length
      : 0;
    const lulus = nilaiJadwal.filter(n => n >= KKM).length;

    return {
      id: j.id,
      nama: j.nama,
      mapel: j.bankSoal.mapel.nama,
      kelas: j.kelas.map((k: any) => k.nama),
      totalPeserta: j.sesiSiswa.length,
      rataRata: avg,
      nilaiTertinggi: nilaiJadwal.length > 0 ? Math.max(...nilaiJadwal) : 0,
      nilaiTerendah: nilaiJadwal.length > 0 ? Math.min(...nilaiJadwal) : 0,
      persentaseLulus: nilaiJadwal.length > 0
        ? (lulus / nilaiJadwal.length) * 100
        : 0,
      waktuMulai: j.waktuMulai,
      waktuSelesai: j.waktuSelesai,
    };
  });

  // Fetch all students who participated in finished exam sessions to compute average-based ranking per tingkat
  const siswasWithExams = await prisma.siswa.findMany({
    include: {
      kelas: { include: { tingkat: true } },
      sesiUjian: {
        where: { status: 'FINISHED', nilaiAkhir: { not: null } },
        select: { nilaiAkhir: true }
      }
    }
  });

  const getTopRankingByLevel = (level: string) => {
    return siswasWithExams
      .filter(s => {
        const lvl = s.kelas?.tingkat?.level || (s.kelas?.nama?.startsWith('X ') ? 'X' : s.kelas?.nama?.startsWith('XI ') ? 'XI' : s.kelas?.nama?.startsWith('XII ') ? 'XII' : '');
        return lvl === level && s.sesiUjian.length > 0;
      })
      .map(s => {
        const total = s.sesiUjian.reduce((acc, curr) => acc + (curr.nilaiAkhir ?? 0), 0);
        const avg = total / s.sesiUjian.length;
        return {
          id: s.id,
          nis: s.nis,
          nama: s.nama,
          kelas: s.kelas?.nama ?? '-',
          tingkat: level,
          jumlahUjian: s.sesiUjian.length,
          rataRata: Number(avg.toFixed(1)),
          totalNilai: total,
          nilaiAkhir: Number(avg.toFixed(1)), // compatible with previous UI field
          status: avg >= KKM ? 'LULUS' : 'TIDAK LULUS',
        };
      })
      .sort((a, b) => b.rataRata - a.rataRata || b.totalNilai - a.totalNilai)
      .slice(0, 10)
      .map((s, idx) => ({
        peringkat: idx + 1,
        ...s,
      }));
  };

  const topRankingX = getTopRankingByLevel('X');
  const topRankingXI = getTopRankingByLevel('XI');

  return {
    pengaturan: pengaturan ? {
      namaSekolah: pengaturan.namaSekolah,
      namaSistem: pengaturan.namaSistem,
      tahunAjaran: pengaturan.tahunAjaran,
      semester: pengaturan.semester,
      logoUrl: pengaturan.logoUrl,
    } : null,
    totalJadwal: jadwalsWithResults.length,
    totalSiswa,
    totalSesiUjian,
    totalPeserta: totalSiswa,
    rataRata,
    nilaiTertinggi,
    nilaiTerendah,
    jumlahLulus,
    jumlahTidakLulus: totalSesiUjian - jumlahLulus,
    persentaseLulus,
    distribusi,
    jadwalSummary,
    topRankingX,
    topRankingXI,
    topRanking: [...topRankingX, ...topRankingXI],
    kkm: KKM,
  };
}

export async function getHasilUjianDetail(jadwalId: number) {
  noStore();
  await autoFinalizeExpiredSessions(jadwalId);

  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: {
      bankSoal: {
        include: {
          mapel: true,
          soals: { include: { jawabans: true } }
        }
      },
      kelas: true,
      sesiSiswa: {
        include: {
          siswa: { include: { kelas: true } },
        }
      }
    }
  });

  if (!jadwal) return null;

  const sesiFinished = jadwal.sesiSiswa.filter(s => s.status === 'FINISHED');
  const nilaiArr = sesiFinished
    .filter(s => s.nilaiAkhir !== null)
    .map(s => s.nilaiAkhir as number);

  const sorted = [...nilaiArr].sort((a, b) => a - b);

  // Mean
  const mean = sorted.length > 0
    ? sorted.reduce((a, b) => a + b, 0) / sorted.length
    : 0;

  // Median
  const median = sorted.length > 0
    ? (sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)])
    : 0;

  // Modus
  const freq: Record<number, number> = {};
  sorted.forEach(n => {
    const r = Math.round(n);
    freq[r] = (freq[r] || 0) + 1;
  });
  let modus = 0;
  let maxFreq = 0;
  for (const [val, count] of Object.entries(freq)) {
    if (count > maxFreq) {
      maxFreq = count;
      modus = Number(val);
    }
  }

  // Standar Deviasi
  const variance = sorted.length > 0
    ? sorted.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / sorted.length
    : 0;
  const stdDev = Math.sqrt(variance);

  // Distribusi nilai
  const distribusi = [
    { range: '0–20', count: nilaiArr.filter(n => n >= 0 && n <= 20).length, color: '#ef4444' },
    { range: '21–40', count: nilaiArr.filter(n => n > 20 && n <= 40).length, color: '#f97316' },
    { range: '41–60', count: nilaiArr.filter(n => n > 40 && n <= 60).length, color: '#eab308' },
    { range: '61–80', count: nilaiArr.filter(n => n > 60 && n <= 80).length, color: '#22c55e' },
    { range: '81–100', count: nilaiArr.filter(n => n > 80 && n <= 100).length, color: '#10b981' },
  ];

  // Perbandingan per kelas
  const perKelas = jadwal.kelas.map((k: any) => {
    const sesiKelas = sesiFinished.filter(s => s.siswa.kelasId === k.id);
    const nilaiKelas = sesiKelas
      .filter(s => s.nilaiAkhir !== null)
      .map(s => s.nilaiAkhir as number);
    const avg = nilaiKelas.length > 0
      ? nilaiKelas.reduce((a, b) => a + b, 0) / nilaiKelas.length
      : 0;
    const lulus = nilaiKelas.filter(n => n >= KKM).length;

    return {
      id: k.id,
      nama: k.nama,
      totalPeserta: sesiKelas.length,
      rataRata: avg,
      persentaseLulus: nilaiKelas.length > 0
        ? (lulus / nilaiKelas.length) * 100
        : 0,
      nilaiTertinggi: nilaiKelas.length > 0 ? Math.max(...nilaiKelas) : 0,
      nilaiTerendah: nilaiKelas.length > 0 ? Math.min(...nilaiKelas) : 0,
    };
  });

  // Ranking peserta
  const peserta = sesiFinished
    .sort((a, b) => (b.nilaiAkhir ?? 0) - (a.nilaiAkhir ?? 0))
    .map((s, index) => ({
      peringkat: index + 1,
      siswaId: s.siswaId,
      nis: s.siswa.nis,
      nama: s.siswa.nama,
      kelas: s.siswa.kelas.nama,
      nilaiAkhir: Math.round(s.nilaiAkhir ?? 0),
      status: (s.nilaiAkhir ?? 0) >= KKM ? 'LULUS' : 'TIDAK LULUS',
      pelanggaran: s.pelanggaran,
    }));

  // Analisis butir soal
  const sesiIds = jadwal.sesiSiswa.map(s => s.id);
  const totalResponden = sesiIds.length;

  const analisisSoal = jadwal.bankSoal.soals.map((soal: any) => {
    const jawabans = soal.jawabans.filter((j: any) => sesiIds.includes(j.sesiId));
    const benar = jawabans.filter((j: any) => j.isBenar).length;
    const salah = jawabans.filter((j: any) => !j.isBenar && j.opsiDipilih).length;
    const kosong = Math.max(0, totalResponden - (benar + salah));

    return {
      id: soal.id,
      pertanyaan: soal.pertanyaan,
      benar,
      salah,
      kosong,
      total: totalResponden,
      persentaseBenar: totalResponden > 0 ? (benar / totalResponden) * 100 : 0,
    };
  });

  const soalTermudah = [...analisisSoal]
    .sort((a, b) => b.persentaseBenar - a.persentaseBenar)
    .slice(0, 5);
  const soalTersulit = [...analisisSoal]
    .sort((a, b) => a.persentaseBenar - b.persentaseBenar)
    .slice(0, 5);

  const lulus = nilaiArr.filter(n => n >= KKM).length;

  return {
    jadwal: {
      id: jadwal.id,
      nama: jadwal.nama,
      mapel: jadwal.bankSoal.mapel.nama,
      kelas: jadwal.kelas.map((k: any) => k.nama),
      waktuMulai: jadwal.waktuMulai,
      waktuSelesai: jadwal.waktuSelesai,
      totalSoal: jadwal.bankSoal.soals.length,
    },
    totalPeserta: jadwal.sesiSiswa.length,
    totalSelesai: sesiFinished.length,
    mean,
    median,
    modus,
    stdDev,
    nilaiTertinggi: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
    nilaiTerendah: sorted.length > 0 ? sorted[0] : 0,
    jumlahLulus: lulus,
    jumlahTidakLulus: nilaiArr.length - lulus,
    persentaseLulus: nilaiArr.length > 0 ? (lulus / nilaiArr.length) * 100 : 0,
    distribusi,
    perKelas,
    peserta,
    soalTermudah,
    soalTersulit,
    kkm: KKM,
  };
}
