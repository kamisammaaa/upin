import { headers, cookies } from 'next/headers';
import AdminLayoutClient from './components/AdminLayoutClient';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { decodeToken } from '@/lib/jwt';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get('x-invoke-path') || '';

  // Untuk login page, biarkan tampil tanpa layout Admin
  // Di Next.js App Router, mengetahui pathname di Server Component Layout agak tricky,
  // tapi kita punya middleware yang akan memisahkan ini, atau kita bisa cek lewat headers jika tersedia.
  // Cara paling aman jika kita butuh layout terpisah adalah memisahkan folder (route groups),
  // tapi untuk saat ini karena strukturnya sudah berjalan, kita render {children} secara penuh
  // jika kita tahu ini adalah login page. Kita asumsikan middleware sudah memastikannya.
  
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  // Jika tidak ada token (dan bukan halaman login, meski middleware sudah handle)
  if (!token) {
    return <>{children}</>;
  }

  let user = { nama: 'Pengguna', role: 'UNKNOWN' };
  const payload = decodeToken(token);
  if (payload) {
    user = {
      nama: payload.nama,
      role: payload.role
    };
  }

  let pengaturan = null;
  try {
    pengaturan = await prisma.pengaturan.findUnique({
      where: { id: 1 }
    });
  } catch (e) {
    // Abaikan error pengaturan
  }

  const isMobileOpen = cookieStore.get('admin_sidebar_mobile')?.value === 'open';

  return (
    <AdminLayoutClient user={user} pengaturan={pengaturan} initialMobileMenuOpen={isMobileOpen}>
      {children}
    </AdminLayoutClient>
  );
}
