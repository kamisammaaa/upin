'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function parseLocalDateTime(val: string): Date {
  if (!val) return new Date(NaN);
  const trimmed = val.trim();
  if (!trimmed.includes('+') && !trimmed.includes('Z') && !/-\d\d:\d\d$/.test(trimmed)) {
    return new Date(`${trimmed}+07:00`);
  }
  return new Date(trimmed);
}

export async function createJadwalUjian(formData: FormData) {
  try {
    const nama = formData.get('nama') as string;
    const bankSoalId = Number(formData.get('bankSoalId'));
    const waktuMulai = parseLocalDateTime(formData.get('waktuMulai') as string);
    const waktuSelesai = parseLocalDateTime(formData.get('waktuSelesai') as string);
    const acakSoal = formData.get('acakSoal') === 'true';
    const acakOpsi = formData.get('acakOpsi') === 'true';
    const tipeUjian = (formData.get('tipeUjian') as string) || 'REGULER';
    
    // Multi-select classes (can be multiple hidden inputs or array)
    const kelasIdsStr = formData.getAll('kelasIds') as string[];
    let kelasIds = kelasIdsStr.map(id => Number(id)).filter(id => !isNaN(id));

    // Siswa khusus (untuk susulan lintas kelas)
    const siswaIdsStr = formData.getAll('siswaIds') as string[];
    const siswaIds = siswaIdsStr.map(id => Number(id)).filter(id => !isNaN(id));

    if (tipeUjian === 'REGULER' && kelasIds.length === 0) {
      return { success: false, message: 'Pilih minimal satu kelas target untuk ujian reguler.' };
    }

    if (tipeUjian === 'SUSULAN' && siswaIds.length === 0 && kelasIds.length === 0) {
      return { success: false, message: 'Pilih minimal satu siswa susulan atau kelas target.' };
    }

    if (waktuMulai >= waktuSelesai) {
      return { success: false, message: 'Waktu selesai harus lebih besar dari waktu mulai.' };
    }

    // Untuk ujian reguler, cegah duplikasi bank soal. Untuk ujian susulan, perbolehkan penggunaan bank soal yang sama!
    if (tipeUjian === 'REGULER') {
      const existingJadwal = await prisma.jadwalUjian.findFirst({
        where: { bankSoalId, tipeUjian: 'REGULER' }
      });
      if (existingJadwal) {
        return { success: false, message: 'Bank soal ini sudah digunakan pada jadwal ujian reguler lain. Untuk jadwal susulan, pilih tipe Ujian Susulan.' };
      }
    }

    // Jika susulan dengan siswa khusus tapi kelas belum terpilih, otomatis hubungkan kelas siswa tersebut
    if (siswaIds.length > 0 && kelasIds.length === 0) {
      const siswas = await prisma.siswa.findMany({
        where: { id: { in: siswaIds } },
        select: { kelasId: true }
      });
      kelasIds = Array.from(new Set(siswas.map(s => s.kelasId)));
    }

    const newJadwal = await prisma.jadwalUjian.create({
      data: {
        nama,
        bankSoalId,
        waktuMulai,
        waktuSelesai,
        acakSoal,
        acakOpsi,
        tipeUjian,
        kelas: {
          connect: kelasIds.map(id => ({ id }))
        },
        siswaKhusus: {
          connect: siswaIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath('/admin/jadwal');
    revalidatePath('/admin/jadwal/tambah');
    revalidatePath('/admin/guru/jadwal');
    revalidatePath('/admin/bank-soal');
    revalidatePath('/admin/guru/bank-soal');
    revalidatePath('/siswa');
    return { success: true, message: 'Jadwal berhasil dibuat', id: newJadwal.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function createJadwalSusulanQuick(data: {
  parentJadwalId: number;
  nama: string;
  waktuMulaiStr: string;
  waktuSelesaiStr: string;
  siswaIds: number[];
}) {
  try {
    const parent = await prisma.jadwalUjian.findUnique({
      where: { id: data.parentJadwalId },
      include: { kelas: true }
    });
    if (!parent) return { success: false, message: 'Jadwal utama tidak ditemukan.' };

    if (!data.siswaIds || data.siswaIds.length === 0) {
      return { success: false, message: 'Pilih minimal 1 siswa untuk jadwal susulan.' };
    }

    const waktuMulai = parseLocalDateTime(data.waktuMulaiStr);
    const waktuSelesai = parseLocalDateTime(data.waktuSelesaiStr);

    if (isNaN(waktuMulai.getTime()) || isNaN(waktuSelesai.getTime())) {
      return { success: false, message: 'Format tanggal atau waktu tidak valid.' };
    }

    if (waktuMulai >= waktuSelesai) {
      return { success: false, message: 'Waktu selesai harus lebih besar dari waktu mulai.' };
    }

    // Ambil daftar kelas dari siswa yang mengikuti susulan
    const siswas = await prisma.siswa.findMany({
      where: { id: { in: data.siswaIds } },
      select: { kelasId: true }
    });
    const derivedKelasIds = Array.from(new Set(siswas.map(s => s.kelasId)));

    const newJadwal = await prisma.jadwalUjian.create({
      data: {
        nama: data.nama || `${parent.nama} (SUSULAN)`,
        bankSoalId: parent.bankSoalId,
        waktuMulai,
        waktuSelesai,
        acakSoal: parent.acakSoal,
        acakOpsi: parent.acakOpsi,
        tipeUjian: 'SUSULAN',
        kelas: {
          connect: derivedKelasIds.map(id => ({ id }))
        },
        siswaKhusus: {
          connect: data.siswaIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath('/admin/jadwal');
    revalidatePath(`/admin/jadwal/${data.parentJadwalId}`);
    revalidatePath(`/admin/jadwal/${newJadwal.id}`);
    revalidatePath('/siswa');

    return { 
      success: true, 
      message: 'Jadwal ujian susulan berhasil dibuat!', 
      id: newJadwal.id 
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal membuat jadwal susulan.' };
  }
}

export async function updateJadwalUjian(id: number, formData: FormData) {
  try {
    const nama = (formData.get('nama') as string)?.trim();
    const bankSoalId = Number(formData.get('bankSoalId'));
    const waktuMulai = parseLocalDateTime(formData.get('waktuMulai') as string);
    const waktuSelesai = parseLocalDateTime(formData.get('waktuSelesai') as string);
    const acakSoal = formData.get('acakSoal') === 'true';
    const acakOpsi = formData.get('acakOpsi') === 'true';
    const currentJadwal = await prisma.jadwalUjian.findUnique({
      where: { id },
      include: { siswaKhusus: true }
    });
    if (!currentJadwal) {
      return { success: false, message: 'Jadwal ujian tidak ditemukan.' };
    }

    const tipeUjian = (formData.get('tipeUjian') as string) || (currentJadwal as any).tipeUjian || 'REGULER';

    if (!nama) {
      return { success: false, message: 'Nama jadwal tidak boleh kosong.' };
    }

    if (isNaN(bankSoalId)) {
      return { success: false, message: 'Pilih bank soal yang valid.' };
    }

    const kelasIdsStr = formData.getAll('kelasIds') as string[];
    let kelasIds = kelasIdsStr.map(kid => Number(kid)).filter(kid => !isNaN(kid));

    const siswaIdsStr = formData.getAll('siswaIds') as string[];
    const siswaIds = siswaIdsStr.map(kid => Number(kid)).filter(kid => !isNaN(kid));

    if (tipeUjian === 'REGULER' && kelasIds.length === 0) {
      return { success: false, message: 'Pilih minimal satu kelas target untuk ujian reguler.' };
    }

    if (tipeUjian === 'SUSULAN' && siswaIds.length === 0 && kelasIds.length === 0 && (!(currentJadwal as any).siswaKhusus || (currentJadwal as any).siswaKhusus.length === 0)) {
      return { success: false, message: 'Pilih minimal satu siswa susulan atau kelas target.' };
    }

    if (isNaN(waktuMulai.getTime()) || isNaN(waktuSelesai.getTime())) {
      return { success: false, message: 'Format waktu mulai atau selesai tidak valid.' };
    }

    if (waktuMulai >= waktuSelesai) {
      return { success: false, message: 'Waktu selesai harus lebih besar dari waktu mulai.' };
    }

    if (tipeUjian === 'REGULER') {
      const existingJadwal = await prisma.jadwalUjian.findFirst({
        where: { 
          bankSoalId,
          tipeUjian: 'REGULER',
          id: { not: id }
        }
      });
      if (existingJadwal) {
        return { success: false, message: 'Bank soal ini sudah digunakan pada jadwal ujian reguler lain.' };
      }
    }

    if (siswaIds.length > 0 && kelasIds.length === 0) {
      const siswas = await prisma.siswa.findMany({
        where: { id: { in: siswaIds } },
        select: { kelasId: true }
      });
      kelasIds = Array.from(new Set(siswas.map(s => s.kelasId)));
    }

    const updateData: any = {
      nama,
      bankSoalId,
      waktuMulai,
      waktuSelesai,
      acakSoal,
      acakOpsi,
      tipeUjian,
      kelas: {
        set: kelasIds.map(kid => ({ id: kid }))
      }
    };

    if (formData.has('siswaIds')) {
      updateData.siswaKhusus = {
        set: siswaIds.map(sid => ({ id: sid }))
      };
    }

    await prisma.jadwalUjian.update({
      where: { id },
      data: updateData
    });

    try {
      revalidatePath('/admin/jadwal');
      revalidatePath(`/admin/jadwal/${id}`);
      revalidatePath(`/admin/jadwal/${id}/edit`);
      revalidatePath('/admin/jadwal/tambah');
      revalidatePath('/admin/guru/jadwal');
      revalidatePath('/admin/bank-soal');
      revalidatePath('/admin/guru/bank-soal');
      revalidatePath('/siswa');
    } catch {}
    
    return { success: true, message: 'Jadwal ujian berhasil diperbarui' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Gagal memperbarui jadwal ujian.' };
  }
}

export async function deleteJadwalUjian(id: number) {
  try {
    await prisma.jadwalUjian.delete({
      where: { id }
    });
    revalidatePath('/admin/jadwal');
    revalidatePath('/admin/guru/jadwal');
    revalidatePath('/siswa');
    return { success: true, message: 'Jadwal berhasil dihapus' };
  } catch (error: any) {
    return { success: false, message: 'Gagal menghapus jadwal. Pastikan tidak ada data ujian siswa yang terkait.' };
  }
}
