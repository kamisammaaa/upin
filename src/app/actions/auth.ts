'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyPassword } from '@/lib/hash';
import { signAdminToken } from '@/lib/jwt';
import { submitExam } from './exam';

export async function loginSiswa(prevState: any, formData: FormData) {
  const nis = formData.get('nis') as string;
  const password = formData.get('password') as string;

  if (!nis || !password) {
    return { error: 'NIS dan Password harus diisi' };
  }

  const cleanNis = nis.trim();
  const siswa = await prisma.siswa.findUnique({
    where: { nis: cleanNis }
  });

  if (!siswa) {
    // Deteksi jika yang mencoba login adalah Guru, Admin, atau Proktor
    const staffUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanNis },
          { username: cleanNis.toLowerCase() }
        ]
      }
    });

    if (staffUser) {
      const roleLabel = staffUser.role === 'GURU' 
        ? 'Guru Mata Pelajaran' 
        : staffUser.role === 'PROCTOR' 
          ? 'Proktor Ujian' 
          : 'Administrator';

      return {
        error: `Halo Bapak/Ibu ${staffUser.nama}, akun Anda terdaftar sebagai ${roleLabel}. Halaman ini khusus untuk login ujian siswa.`,
        isStaff: true,
        staffName: staffUser.nama,
        staffRole: roleLabel,
        redirectUrl: '/admin/login'
      };
    }

    return { error: 'NIS atau Password salah' };
  }

  if (!(await verifyPassword(password, siswa.password))) {
    return { error: 'NIS atau Password salah' };
  }

  const cookieStore = await cookies();
  cookieStore.set('siswaId', siswa.id.toString(), {
    path: '/',
    httpOnly: true,
    secure: false, // Kompatibel untuk akses HTTP lokal/intranet maupun HTTPS domain di iOS Safari
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

  const cleanUsername = username.trim();

  // Find user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: cleanUsername },
        { username: cleanUsername.toLowerCase() }
      ]
    }
  });

  if (!user) {
    // Deteksi jika yang mencoba login adalah Siswa
    const siswa = await prisma.siswa.findUnique({
      where: { nis: cleanUsername }
    });

    if (siswa) {
      return {
        error: `Halo ${siswa.nama}, akun Anda terdaftar sebagai Siswa (NIS: ${siswa.nis}). Halaman ini khusus untuk login Guru, Proktor, & Admin.`,
        isSiswa: true,
        siswaName: siswa.nama,
        redirectUrl: '/login'
      };
    }

    return { error: 'Username atau Password salah' };
  }

  if (!(await verifyPassword(password, user.password))) {
    return { error: 'Username atau Password salah' };
  }

  // Sign JWT token
  const token = await signAdminToken({
    id: user.id,
    role: user.role,
    nama: user.nama
  });

  (await cookies()).set('admin_token', token, {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
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

  const cleanToken = (token || '').trim().toUpperCase();
  const roomToken = (siswa.ruangan.token || '').trim().toUpperCase();

  if (!cleanToken || roomToken !== cleanToken) {
    return { error: 'Token ruangan tidak valid!' };
  }

  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: {
      kelas: true,
      siswaKhusus: true
    }
  });

  if (!jadwal) {
    return { error: 'Jadwal tidak ditemukan.' };
  }

  // Cek apakah siswa berhak mengikuti jadwal ini
  const isTargetKelas = jadwal.kelas.some(k => k.id === siswa.kelasId);
  const isTargetSiswa = jadwal.siswaKhusus.some(s => s.id === siswa.id);

  if (jadwal.tipeUjian === 'SUSULAN') {
    if (jadwal.siswaKhusus.length > 0 && !isTargetSiswa) {
      return { error: 'Anda tidak terdaftar sebagai peserta pada ujian susulan ini.' };
    }
    if (jadwal.siswaKhusus.length === 0 && !isTargetKelas) {
      return { error: 'Jadwal ujian susulan ini tidak ditujukan untuk kelas Anda.' };
    }
  } else {
    if (!isTargetKelas) {
      return { error: 'Jadwal ujian ini tidak ditujukan untuk kelas Anda.' };
    }
  }

  const now = new Date();
  if (now < jadwal.waktuMulai) {
    return { error: 'Ujian ini belum dimulai sesuai jadwal.' };
  }
  if (now > jadwal.waktuSelesai) {
    const existingSesi = await prisma.sesiUjianSiswa.findUnique({
      where: {
        siswaId_jadwalId: {
          siswaId,
          jadwalId
        }
      }
    });
    if (existingSesi && existingSesi.status === 'ONGOING') {
      await submitExam(existingSesi.id);
    }
    return { error: 'Waktu pelaksanaan ujian ini telah berakhir.' };
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

  // Refresh cookie agar selalu valid saat navigasi ke ujian di iOS Safari
  cookieStore.set('siswaId', siswaId.toString(), {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24
  });

  redirect(`/siswa/ujian/${jadwalId}`);
}
