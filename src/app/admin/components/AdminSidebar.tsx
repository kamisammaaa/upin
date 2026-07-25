'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CalendarDays, 
  Settings, 
  LogOut,
  X,
  GraduationCap,
  Eye
} from 'lucide-react';
import { logoutAdmin } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export default function AdminSidebar({ 
  user, 
  pengaturan,
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: { 
  user: { nama: string, role: string }, 
  pengaturan?: any,
  isMobileMenuOpen: boolean, 
  setIsMobileMenuOpen: (val: boolean) => void 
}) {
  const pathname = usePathname();
  const router = useRouter();
  const role = user.role;

  const adminMenus = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Data Kelas', href: '/admin/master/kelas', icon: GraduationCap },
    { name: 'Data Siswa', href: '/admin/master/siswa', icon: Users },
    { name: 'Bank Soal', href: '/admin/bank-soal', icon: BookOpen },
    { name: 'Jadwal Ujian', href: '/admin/jadwal', icon: CalendarDays },
    { name: 'Pengaturan', href: '/admin/pengaturan', icon: Settings },
  ];

  const guruMenus = [
    { name: 'Dashboard Guru', href: '/admin/guru', icon: LayoutDashboard },
    { name: 'Bank Soal Saya', href: '/admin/guru/bank-soal', icon: BookOpen },
    { name: 'Jadwal Ujian Saya', href: '/admin/guru/jadwal', icon: CalendarDays },
    { name: 'Nilai & Evaluasi', href: '/admin/guru/nilai', icon: Users },
  ];

  const proktorMenus = [
    { name: 'Dashboard Proktor', href: '/admin/proktor', icon: Eye },
  ];

  let sidebarMenus = adminMenus;
  if (role === 'GURU') sidebarMenus = guruMenus;
  if (role === 'PROCTOR') sidebarMenus = proktorMenus;

  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/admin/login');
  };

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';
  const getRoleDisplay = (r: string) => {
    if (r === 'ADMIN') return 'Admin Utama';
    if (r === 'GURU') return 'Guru Mapel';
    if (r === 'PROCTOR') return 'Proktor Ujian';
    return r;
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#09090b] border-r border-crypto-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-crypto-border">
          <div className="flex items-center gap-3">
            {pengaturan?.logoUrl ? (
              <img src={pengaturan.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-full" />
            ) : null}
            <span className="text-xl font-bold text-white tracking-widest neon-accent">
              {pengaturan?.namaSistem ? (
                pengaturan.namaSistem.endsWith('CBT') ? (
                  <>
                    {pengaturan.namaSistem.replace('CBT', '')}
                    <span className="text-crypto-accent">CBT</span>
                  </>
                ) : (
                  pengaturan.namaSistem
                )
              ) : (
                <>Pintar<span className="text-crypto-accent">CBT</span></>
              )}
            </span>
          </div>
          <button 
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="px-3 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">
            {role === 'ADMIN' ? 'Menu Utama' : (role === 'GURU' ? 'Menu Guru' : 'Menu Proktor')}
          </div>
          {sidebarMenus.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin' && item.href !== '/admin/guru');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                  isActive 
                    ? 'bg-crypto-card text-white border-l-4 border-crypto-accent neon-accent' 
                    : 'text-gray-400 hover:bg-crypto-card hover:text-white border-l-4 border-transparent'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'text-crypto-accent scale-110' : 'text-gray-500 group-hover:scale-110'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-crypto-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center text-crypto-accent font-bold border border-crypto-accent/50 flex-shrink-0 neon-accent">
              {getInitial(user.nama)}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-gray-100 truncate">{user.nama}</span>
              <span className="text-xs text-gray-500 truncate">{getRoleDisplay(user.role)}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center w-full gap-3 px-3 py-2.5 font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
