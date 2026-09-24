'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayoutClient({ 
  children, 
  user,
  pengaturan,
  initialMobileMenuOpen = false
}: { 
  children: React.ReactNode, 
  user: { nama: string, role: string },
  pengaturan?: any,
  initialMobileMenuOpen?: boolean
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpenState] = useState(initialMobileMenuOpen);

  // Sync state dari cookie / sessionStorage jika ada update
  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|;\s*)admin_sidebar_mobile=([^;]+)/);
      if (match) {
        setIsMobileMenuOpenState(match[1] === 'open');
      } else {
        const saved = sessionStorage.getItem('admin_sidebar_mobile');
        if (saved !== null) {
          setIsMobileMenuOpenState(saved === 'true');
        }
      }
    } catch (e) {}
  }, []);

  const setIsMobileMenuOpen = (val: boolean) => {
    setIsMobileMenuOpenState(val);
    try {
      document.cookie = `admin_sidebar_mobile=${val ? 'open' : 'closed'}; path=/; max-age=86400; SameSite=Lax`;
      sessionStorage.setItem('admin_sidebar_mobile', String(val));
    } catch (e) {}
  };

  return (
    <div className="flex h-screen bg-crypto-bg text-gray-100 font-sans print:h-auto print:bg-white print:text-black print:block">
      <div className="print:hidden">
        <AdminSidebar 
          user={user} 
          pengaturan={pengaturan}
          isMobileMenuOpen={isMobileMenuOpen} 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
        <div className="print:hidden">
          <AdminHeader 
            nama={user.nama} 
            role={user.role}
            pengaturan={pengaturan}
            setIsMobileMenuOpen={setIsMobileMenuOpen} 
          />
        </div>

        <main className="flex-1 overflow-y-auto p-6 bg-crypto-bg print:bg-white print:p-0 print:overflow-visible print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
