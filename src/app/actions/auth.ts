'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginSiswa(prevState: any, formData: FormData) {
  const nis = formData.get('nis') as string;
  const password = formData.get('password') as string;

  if (!nis || !password) {
    return { error: 'NIS dan Password harus diisi' };
  }

  const siswa = await prisma.siswa.findUnique({
    where: { nis }
  });

  if (!siswa || siswa.password !== password) {
    return { error: 'NIS atau Password salah' };
  }

  const cookieStore = await cookies();
  cookieStore.set('siswaId', siswa.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 1 day
  });

  redirect('/siswa');
}

export async function loginAdmin(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username dan Password wajib diisi' };
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user || user.password !== password) {
    return { error: 'Username atau Password salah' };
  }

  // Create simple JWT-like object (in real app use true JWT or session storage)
  // We'll store user ID and Role in cookie
  const payload = JSON.stringify({
    id: user.id,
    role: user.role,
    nama: user.nama
  });

  // Base64 encode the payload to prevent tampering with basic string
  const token = Buffer.from(payload).toString('base64');

  (await cookies()).set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 1 day
  });

  return { success: true, role: user.role };
}

export async function logoutAdmin() {
  (await cookies()).delete('admin_token');
}

export async function logoutSiswa() {
  const cookieStore = await cookies();
  cookieStore.delete('siswaId');
  redirect('/login');
}

export async function verifyToken(prevState: any, formData: FormData) {
  const token = formData.get('token') as string;
  const jadwalIdStr = formData.get('jadwalId') as string;
  const jadwalId = parseInt(jadwalIdStr);

  const cookieStore = await cookies();
  const siswaIdStr = cookieStore.get('siswaId')?.value;

  if (!siswaIdStr || !jadwalId) return { error: 'Akses ditolak.' };

  const siswaId = parseInt(siswaIdStr);

  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
    include: { ruangan: true }
  });

  if (!siswa || !siswa.ruangan) {
    return { error: 'Anda belum terdaftar di Ruangan manapun.' };
  }

  if (siswa.ruangan.token !== token) {
    return { error: 'Token ruangan tidak valid!' };
  }

  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId }
  });

  if (!jadwal) {
    return { error: 'Jadwal tidak ditemukan.' };
  }

  // Cek sesi ada?
  let sesi = await prisma.sesiUjianSiswa.findUnique({
    where: {
      siswaId_jadwalId: {
        siswaId,
        jadwalId
      }
    }
  });

  if (!sesi) {
    // Buat sesi baru
    sesi = await prisma.sesiUjianSiswa.create({
      data: {
        siswaId,
        jadwalId,
        status: 'ONGOING'
      }
    });
  } else if (sesi.status === 'FINISHED') {
    return { error: 'Anda sudah menyelesaikan ujian ini.' };
  }

  redirect(`/siswa/ujian/${jadwalId}`);
}
