'use client';

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayoutClient({ 
  children, 
  user,
  pengaturan
}: { 
  children: React.ReactNode, 
  user: { nama: string, role: string },
  pengaturan?: any
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
