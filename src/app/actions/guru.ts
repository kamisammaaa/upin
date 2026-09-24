'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import { hashPassword } from '@/lib/hash';

export async function createGuru(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const nama = formData.get('nama') as string;

  if (!username || !password || !nama) {
    return { error: 'Semua field wajib diisi' };
  }

  try {
    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nama,
        role: 'GURU'
      }
    });

    await logAudit('SYSTEM', 'CREATE_GURU', 'Guru', `Tambah guru: ${nama} (${username})`);
    revalidatePath('/admin/master/guru');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Username sudah digunakan' };
    }
    return { error: 'Gagal menambahkan guru' };
  }
}

export async function updateGuru(id: number, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const nama = formData.get('nama') as string;

  if (!username || !nama) {
    return { error: 'Username dan Nama wajib diisi' };
  }

  try {
    const data: any = { username, nama };
    if (password) {
      const isHashed = password.startsWith('$2a$') || password.startsWith('$2b$');
      data.password = isHashed ? password : await hashPassword(password);
    }

    await prisma.user.update({
      where: { id },
      data
    });

    await logAudit('SYSTEM', 'UPDATE_GURU', 'Guru', `Edit guru ID ${id}: ${nama}`);
    revalidatePath('/admin/master/guru');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Username sudah digunakan' };
    }
    return { error: 'Gagal mengubah data guru' };
  }
}

export async function deleteGuru(id: number) {
  try {
    // Check if guru has BankSoal
    const guru = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bankSoals: true }
        }
      }
    });

    if (!guru) {
      return { error: 'Guru tidak ditemukan' };
    }

    if (guru._count.bankSoals > 0) {
      return { error: 'Tidak dapat menghapus Guru karena sudah memiliki Bank Soal yang terdaftar.' };
    }

    await prisma.user.delete({
      where: { id }
    });

    await logAudit('SYSTEM', 'DELETE_GURU', 'Guru', `Hapus guru ID ${id}: ${guru.nama}`);
    revalidatePath('/admin/master/guru');
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal menghapus guru' };
  }
}

export async function deleteGuruMassal(ids: number[]) {
  if (!ids || ids.length === 0) return { error: 'Tidak ada guru yang dipilih' };
  
  try {
    // Cari guru yang memiliki bank soal, mereka tidak boleh dihapus
    const gurusWithBankSoals = await prisma.user.findMany({
      where: {
        id: { in: ids },
        bankSoals: { some: {} }
      },
      select: { id: true, nama: true }
    });

    const restrictedIds = gurusWithBankSoals.map(g => g.id);
    const validIds = ids.filter(id => !restrictedIds.includes(id));

    if (validIds.length === 0) {
      return { error: 'Semua guru yang dipilih memiliki bank soal dan tidak dapat dihapus.' };
    }

    const { count } = await prisma.user.deleteMany({
      where: {
        id: { in: validIds },
        role: 'GURU'
      }
    });

    await logAudit('SYSTEM', 'DELETE_GURU_MASSAL', 'Guru', `Hapus massal ${count} guru`);
    revalidatePath('/admin/master/guru');
    
    if (restrictedIds.length > 0) {
      return { 
        success: true, 
        message: `Berhasil menghapus ${count} guru. ${restrictedIds.length} guru dilewati karena memiliki bank soal.` 
      };
    }
    
    return { success: true, message: `Berhasil menghapus ${count} guru.` };
  } catch (error: any) {
    return { error: 'Terjadi kesalahan saat menghapus data massal' };
  }
}

export async function exportDataGuru(search?: string) {
  const where: any = { role: 'GURU' };
  if (search) {
    where.OR = [
      { nama: { contains: search } },
      { username: { contains: search } }
    ];
  }

  const gurus = await prisma.user.findMany({
    where,
    orderBy: { nama: 'asc' }
  });

  return gurus.map(g => ({
    NIP_Username: g.username,
    Nama_Lengkap: g.nama,
    Password: g.password || ''
  }));
}

export async function importGuru(data: { username: string; nama: string; password?: string }[]) {
  try {
    const processedData = await Promise.all(
      data.map(async (guru) => {
        const rawPassword = guru.password || guru.username;
        const isHashed = rawPassword.startsWith('$2a$') || rawPassword.startsWith('$2b$');
        const hashedPassword = isHashed ? rawPassword : await hashPassword(rawPassword);
        return {
          username: guru.username,
          nama: guru.nama,
          hashedPassword,
          hasPassword: !!guru.password
        };
      })
    );

    await prisma.$transaction(
      processedData.map((guru) => 
        prisma.user.upsert({
          where: { username: guru.username },
          update: {
            nama: guru.nama,
            ...(guru.hasPassword ? { password: guru.hashedPassword } : {})
          },
          create: {
            username: guru.username,
            nama: guru.nama,
            password: guru.hashedPassword,
            role: 'GURU'
          }
        })
      )
    );
    
    await logAudit('SYSTEM', 'IMPORT_GURU', 'Guru', `Import massal ${data.length} guru`);
    revalidatePath('/admin/master/guru');
    return { success: true, message: `Berhasil mengimpor ${data.length} guru.` };
  } catch (error: any) {
    return { error: 'Gagal mengimpor data guru. Pastikan format benar dan NIP/Username unik.' };
  }
}

