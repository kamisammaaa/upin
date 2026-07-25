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
    <div className="flex h-screen bg-crypto-bg text-gray-100 font-sans">
      <AdminSidebar 
        user={user} 
        pengaturan={pengaturan}
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          nama={user.nama} 
          role={user.role}
          pengaturan={pengaturan}
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
        />

        <main className="flex-1 overflow-y-auto p-6 bg-crypto-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
