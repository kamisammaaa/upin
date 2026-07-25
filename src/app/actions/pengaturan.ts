'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function upsertPengaturan(formData: FormData) {
  const namaSekolah = formData.get('namaSekolah') as string;
  const namaSistem = formData.get('namaSistem') as string;
  let logoUrl = formData.get('logoUrl') as string;
  const logoFile = formData.get('logoFile') as File | null;
  const alamat = formData.get('alamat') as string;
  const pengumuman = formData.get('pengumuman') as string;
  
  if (!namaSekolah) {
    return { error: 'Nama sekolah wajib diisi' };
  }

  try {
    if (logoFile && logoFile.size > 0) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const ext = path.extname(logoFile.name) || '.png';
      const filename = `logo-${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure upload directory exists
      await mkdir(uploadDir, { recursive: true });
      
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      
      logoUrl = `/uploads/${filename}`;
    }

    await prisma.pengaturan.upsert({
      where: { id: 1 },
      update: {
        namaSekolah,
        namaSistem,
        logoUrl,
        alamat,
        pengumuman,
      },
      create: {
        id: 1,
        namaSekolah,
        namaSistem: namaSistem || 'PintarCBT',
        logoUrl,
        alamat,
        pengumuman,
      }
    });

    revalidatePath('/admin/pengaturan');
    return { success: true };
  } catch (error: any) {
    console.error("Error in upsertPengaturan:", error);
    return { error: 'Gagal menyimpan pengaturan' };
  }
}

export async function resetSemuaSesiSiswa() {
  try {
    // Menghapus semua data SesiUjianSiswa (artinya siswa akan otomatis ter-logout dari ujian)
    await prisma.sesiUjianSiswa.deleteMany({});
    revalidatePath('/admin/pengaturan');
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal mereset sesi ujian siswa' };
  }
}
