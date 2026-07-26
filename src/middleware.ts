import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek untuk route admin
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin_token')?.value;

    if (pathname === '/admin/login') {
      if (adminToken) {
        // Coba baca role untuk redirect yang sesuai
        try {
          const payload = JSON.parse(Buffer.from(adminToken, 'base64').toString('utf-8'));
          if (payload.role === 'GURU') {
            return NextResponse.redirect(new URL('/admin/guru', request.url));
          }
          if (payload.role === 'PROCTOR') {
            return NextResponse.redirect(new URL('/admin/proktor', request.url));
          }
          return NextResponse.redirect(new URL('/admin', request.url));
        } catch(e) {
          return NextResponse.next();
        }
      }
      return NextResponse.next();
    }

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const payloadString = Buffer.from(adminToken, 'base64').toString('utf-8');
      const payload = JSON.parse(payloadString);

      if (payload.role === 'GURU') {
        const isGuruRoute = pathname.startsWith('/admin/guru');
        // Izin khusus untuk Guru agar bisa melihat Monitor Jadwal (bukan daftar jadwal keseluruhan)
        const isMonitorJadwalRoute = /^\/admin\/jadwal\/\d+/.test(pathname);
        
        if (!isGuruRoute && !isMonitorJadwalRoute && pathname !== '/admin/login') {
          return NextResponse.redirect(new URL('/admin/guru', request.url));
        }
      }

      // Jika dia Proctor, pastikan dia hanya mengakses /admin/proktor
      if (payload.role === 'PROCTOR') {
        const isProctorRoute = pathname.startsWith('/admin/proktor');
        
        if (!isProctorRoute && pathname !== '/admin/login') {
          return NextResponse.redirect(new URL('/admin/proktor', request.url));
        }
      }
    } catch (e) {
      // Jika token tidak valid
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Cek untuk route siswa
  if (pathname.startsWith('/siswa')) {
    const siswaId = request.cookies.get('siswaId')?.value;
    if (!siswaId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/siswa/:path*'],
};
