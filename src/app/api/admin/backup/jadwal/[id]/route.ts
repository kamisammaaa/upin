import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/jwt';
import * as XLSX from 'xlsx';
import { autoFinalizeExpiredSessions } from '@/app/actions/exam';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const payload = await verifyAdminToken(adminToken);
    if (!payload || !['ADMIN', 'GURU', 'PROCTOR'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const jadwalId = parseInt(resolvedParams.id);
    if (isNaN(jadwalId)) {
      return NextResponse.json({ error: 'ID jadwal tidak valid' }, { status: 400 });
    }

    // Ambil data jadwal lengkap dengan bank soal dan soal-soalnya
    const jadwal = await prisma.jadwalUjian.findUnique({
      where: { id: jadwalId },
      include: {
        bankSoal: {
          include: {
            mapel: true,
            soals: {
              orderBy: { id: 'asc' }
            }
          }
        },
        kelas: {
          orderBy: { nama: 'asc' }
        }
      }
    });

    if (!jadwal) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 });
    }

    // Jika user adalah Guru, pastikan bank soal miliknya
    if (payload.role === 'GURU') {
      const guruBank = await prisma.bankSoal.findFirst({
        where: { id: jadwal.bankSoalId, guruId: payload.id }
      });
      if (!guruBank) {
        return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses ke jadwal ini' }, { status: 403 });
      }
    }

    const kelasIds = jadwal.kelas.map(k => k.id);
    const siswas = await prisma.siswa.findMany({
      where: { kelasId: { in: kelasIds } },
      include: {
        kelas: true,
        ruangan: true,
      },
      orderBy: [
        { kelas: { nama: 'asc' } },
        { nama: 'asc' }
      ]
    });

    await autoFinalizeExpiredSessions(jadwalId);

    const sesis = await prisma.sesiUjianSiswa.findMany({
      where: { jadwalId },
      include: {
        jawabans: true
      }
    });

    const soals = jadwal.bankSoal.soals;
    const totalSoal = soals.length;

    // --- SHEET 1: Rekap Nilai Siswa ---
    const sheet1Data = siswas.map((siswa, idx) => {
      const sesi = sesis.find(s => s.siswaId === siswa.id);
      const jawabans = sesi?.jawabans || [];
      const totalDijawab = jawabans.filter(j => j.opsiDipilih && j.opsiDipilih.trim() !== '').length;
      const totalBenar = jawabans.filter(j => j.isBenar).length;
      const totalSalah = totalDijawab - totalBenar;

      let statusDisplay = 'BELUM MULAI';
      if (sesi) {
        if (sesi.status === 'FINISHED') statusDisplay = 'SELESAI';
        else if (sesi.status === 'ONGOING') statusDisplay = 'SEDANG MENGERJAKAN';
      }

      const formatTanggal = (d?: Date | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      };

      return {
        'No': idx + 1,
        'NIS': siswa.nis,
        'Nama Siswa': siswa.nama,
        'Kelas': siswa.kelas?.nama || '-',
        'Ruangan': siswa.ruangan?.nama || '-',
        'Status Ujian': statusDisplay,
        'Waktu Mulai': formatTanggal(sesi?.waktuMulai),
        'Waktu Selesai': formatTanggal(sesi?.waktuSelesai),
        'Total Soal': totalSoal,
        'Soal Dijawab': totalDijawab,
        'Jawaban Benar': totalBenar,
        'Jawaban Salah': totalSalah,
        'Nilai Akhir': sesi?.nilaiAkhir !== null && sesi?.nilaiAkhir !== undefined ? sesi.nilaiAkhir : '-',
        'Pelanggaran (Kali)': sesi?.pelanggaran || 0,
      };
    });

    // --- SHEET 2: Matriks Jawaban Siswa per Butir Soal ---
    const sheet2Data = siswas.map((siswa, idx) => {
      const sesi = sesis.find(s => s.siswaId === siswa.id);
      const row: Record<string, any> = {
        'No': idx + 1,
        'NIS': siswa.nis,
        'Nama Siswa': siswa.nama,
        'Kelas': siswa.kelas?.nama || '-',
      };

      soals.forEach((soal, sIdx) => {
        const jwb = sesi?.jawabans.find(j => j.soalId === soal.id);
        const nomorHeader = `No ${sIdx + 1}`;
        if (!jwb || !jwb.opsiDipilih) {
          row[nomorHeader] = '-';
        } else {
          row[nomorHeader] = `${jwb.opsiDipilih} ${jwb.isBenar ? '(✓)' : '(✗)'}`;
        }
      });

      return row;
    });

    // --- SHEET 3: Kunci Jawaban & Bobot Soal ---
    const sheet3Data = soals.map((soal, idx) => ({
      'Nomor Soal': idx + 1,
      'Tipe Soal': 'Pilihan Ganda',
      'Kunci Jawaban': soal.kunciJawaban || '-',
      'Bobot Nilai': soal.bobot,
    }));

    // --- SHEET 4: Analisis Butir Soal ---
    const sheet4Data = soals.map((soal, idx) => {
      let jumlahBenar = 0;
      let jumlahSalah = 0;
      let jumlahKosong = 0;

      sesis.forEach(sesi => {
        const jwb = sesi.jawabans.find(j => j.soalId === soal.id);
        if (!jwb || !jwb.opsiDipilih) {
          jumlahKosong++;
        } else if (jwb.isBenar) {
          jumlahBenar++;
        } else {
          jumlahSalah++;
        }
      });

      const totalPesertaSesi = sesis.length;
      const persenKetuntasan = totalPesertaSesi > 0 
        ? ((jumlahBenar / totalPesertaSesi) * 100).toFixed(1) + '%'
        : '0%';

      return {
        'Nomor Soal': idx + 1,
        'Tipe': 'Pilihan Ganda',
        'Kunci': soal.kunciJawaban || '-',
        'Peserta Menjawab Benar': jumlahBenar,
        'Peserta Menjawab Salah': jumlahSalah,
        'Tidak Menjawab': jumlahKosong,
        'Total Peserta': totalPesertaSesi,
        'Tingkat Ketuntasan (%)': persenKetuntasan,
      };
    });

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(wb, ws1, 'Rekap Nilai');

    const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
    XLSX.utils.book_append_sheet(wb, ws2, 'Lembar Jawaban');

    const ws3 = XLSX.utils.json_to_sheet(sheet3Data);
    XLSX.utils.book_append_sheet(wb, ws3, 'Kunci & Bobot');

    const ws4 = XLSX.utils.json_to_sheet(sheet4Data);
    XLSX.utils.book_append_sheet(wb, ws4, 'Analisis Butir Soal');

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const safeName = jadwal.nama.replace(/[^a-zA-Z0-9_-]/g, '_');
    const now = new Date();
    const wibDate = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${wibDate.getUTCFullYear()}${pad(wibDate.getUTCMonth() + 1)}${pad(wibDate.getUTCDate())}_${pad(wibDate.getUTCHours())}${pad(wibDate.getUTCMinutes())}`;
    const filename = `Backup_Hasil_Ujian_${safeName}_${timestamp}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Gagal membuat backup hasil ujian:', error);
    return NextResponse.json({ error: 'Gagal membuat file backup: ' + error?.message }, { status: 500 });
  }
}
