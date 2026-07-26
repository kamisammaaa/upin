'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';

export async function createProktor(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const nama = formData.get('nama') as string;

  if (!username || !password || !nama) {
    return { error: 'Semua field wajib diisi' };
  }

  try {
    await prisma.user.create({
      data: {
        username,
        password,
        nama,
        role: 'PROCTOR'
      }
    });

    await logAudit('SYSTEM', 'CREATE_PROKTOR', 'Proktor', `Tambah proktor: ${nama} (${username})`);
    revalidatePath('/admin/master/proktor');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Username sudah digunakan' };
    }
    return { error: 'Gagal menambahkan proktor' };
  }
}

export async function updateProktor(id: number, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const nama = formData.get('nama') as string;

  if (!username || !nama) {
    return { error: 'Username dan Nama wajib diisi' };
  }

  try {
    const data: any = { username, nama };
    if (password) {
      data.password = password;
    }

    await prisma.user.update({
      where: { id },
      data
    });

    await logAudit('SYSTEM', 'UPDATE_PROKTOR', 'Proktor', `Edit proktor ID ${id}: ${nama}`);
    revalidatePath('/admin/master/proktor');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Username sudah digunakan' };
    }
    return { error: 'Gagal mengubah data proktor' };
  }
}

export async function deleteProktor(id: number) {
  try {
    const proktor = await prisma.user.findUnique({
      where: { id }
    });

    if (!proktor) {
      return { error: 'Proktor tidak ditemukan' };
    }

    await prisma.user.delete({
      where: { id }
    });

    await logAudit('SYSTEM', 'DELETE_PROKTOR', 'Proktor', `Hapus proktor ID ${id}: ${proktor.nama}`);
    revalidatePath('/admin/master/proktor');
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal menghapus proktor' };
  }
}

export async function deleteProktorMassal(ids: number[]) {
  if (!ids || ids.length === 0) return { error: 'Tidak ada proktor yang dipilih' };
  
  try {
    const { count } = await prisma.user.deleteMany({
      where: {
        id: { in: ids },
        role: 'PROCTOR'
      }
    });

    await logAudit('SYSTEM', 'DELETE_PROKTOR_MASSAL', 'Proktor', `Hapus massal ${count} proktor`);
    revalidatePath('/admin/master/proktor');
    return { success: true, message: `Berhasil menghapus ${count} proktor.` };
  } catch (error: any) {
    return { error: 'Terjadi kesalahan saat menghapus data massal' };
  }
}

export async function exportDataProktor(search?: string) {
  const where: any = { role: 'PROCTOR' };
  if (search) {
    where.OR = [
      { nama: { contains: search } },
      { username: { contains: search } }
    ];
  }

  const proktors = await prisma.user.findMany({
    where,
    orderBy: { nama: 'asc' }
  });

  return proktors.map(p => ({
    Username: p.username,
    Nama_Lengkap: p.nama,
    Password: p.password || ''
  }));
}

export async function importProktor(data: { username: string; nama: string; password?: string }[]) {
  try {
    await prisma.$transaction(
      data.map((proktor) => 
        prisma.user.upsert({
          where: { username: proktor.username },
          update: {
            nama: proktor.nama,
            ...(proktor.password ? { password: proktor.password } : {})
          },
          create: {
            username: proktor.username,
            nama: proktor.nama,
            password: proktor.password || proktor.username,
            role: 'PROCTOR'
          }
        })
      )
    );
    
    await logAudit('SYSTEM', 'IMPORT_PROKTOR', 'Proktor', `Import massal ${data.length} proktor`);
    revalidatePath('/admin/master/proktor');
    return { success: true, message: `Berhasil mengimpor ${data.length} proktor.` };
  } catch (error: any) {
    return { error: 'Gagal mengimpor data proktor. Pastikan format benar dan Username unik.' };
  }
}
