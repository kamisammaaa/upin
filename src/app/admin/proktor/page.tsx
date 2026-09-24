import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MonitorPlay, Users, MapPin } from 'lucide-react';
import Link from 'next/link';
import { decodeToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export default async function ProktorDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) redirect('/admin/login');

  const payload = decodeToken(token);
  if (!payload) redirect('/admin/login');
  const proctorId = payload.id;

  // Ambil semua ruangan beserta jumlah siswanya
  const ruangans = await prisma.ruangan.findMany({
    include: {
      _count: {
        select: { siswas: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-crypto-card rounded-2xl p-8 border border-crypto-border shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-crypto-accent/10 to-transparent pointer-events-none"></div>
        <h1 className="text-3xl font-bold mb-2 text-white relative z-10">Selamat Datang, {payload.nama}!</h1>
        <p className="text-gray-400 relative z-10">Pusat Komando Pengawasan Ujian Anda.</p>
      </div>

      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <MonitorPlay className="w-5 h-5 text-crypto-accent" />
        Daftar Ruangan Pengawasan Anda
      </h2>

      {ruangans.length === 0 ? (
        <div className="bg-crypto-card p-8 rounded-xl border border-crypto-border text-center">
          <p className="text-gray-400">Tidak ada ruangan yang tersedia di database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ruangans.map((r: any) => (
            <div key={r.id} className="bg-crypto-card rounded-xl shadow-lg border border-crypto-border p-6 flex flex-col transition hover:bg-crypto-card-hover group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2 group-hover:text-crypto-accent transition-colors">
                    <MapPin className="w-5 h-5 text-crypto-accent" />
                    {r.nama}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Kapasitas: {r.kapasitas} Kursi
                  </p>
                </div>
              </div>

              <div className="flex-1 mb-6 bg-black/40 p-4 rounded-lg border border-crypto-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Token Ruangan:</p>
                  <p className="text-lg font-mono font-bold text-crypto-accent tracking-widest">{r.token || 'BELUM DIGENERATE'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Siswa Aktif:</p>
                  <p className="text-lg font-bold text-white">{r._count.siswas} Anak</p>
                </div>
              </div>

              <Link 
                href={`/admin/proktor/monitor/${r.id}`}
                className="w-full flex justify-center items-center gap-2 bg-crypto-accent hover:bg-crypto-accent-hover text-white font-bold py-3 px-4 rounded-lg transition hover:neon-accent shadow-lg"
              >
                <MonitorPlay className="w-5 h-5" />
                Pilih & Awasi Ruangan Ini
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
