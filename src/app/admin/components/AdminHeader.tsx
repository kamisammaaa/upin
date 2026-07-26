'use client';

import { Menu, Bell, ChevronRight, CalendarDays } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminHeader({ 
  nama, 
  role,
  pengaturan,
  setIsMobileMenuOpen 
}: { 
  nama: string, 
  role: string,
  pengaturan?: any,
  setIsMobileMenuOpen: (val: boolean) => void 
}) {
  const pathname = usePathname();

  // Helper untuk generate breadcrumbs dari pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(p => p !== '');
    if (paths.length === 0) return [];
    
    return paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      // Format teks agar lebih rapi (capitalize dan hapus dash)
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      return { href, label };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-[#09090b]/80 backdrop-blur-md border-b border-crypto-border sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden text-gray-400 hover:text-white"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Breadcrumb - Hidden di mobile kecil */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400 font-medium">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <div key={crumb.href} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-600" />}
                {isLast ? (
                  <span className="text-white font-semibold tracking-wide neon-accent">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-crypto-accent transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <h1 className="text-lg font-bold text-white tracking-widest sm:hidden neon-accent">
          {pengaturan?.namaSistem || 'PintarCBT'}
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Badge Sesi Akademik */}
        {(pengaturan?.tahunAjaran || pengaturan?.semester) && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-crypto-accent/10 border border-crypto-accent/20 text-xs font-semibold text-crypto-accent">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>T.A {pengaturan?.tahunAjaran || '2024/2025'} – {pengaturan?.semester || 'Ganjil'}</span>
          </div>
        )}
        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-crypto-card rounded-full transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-crypto-success rounded-full border border-[#09090b] neon-success"></span>
        </button>
      </div>
    </header>
  );
}
