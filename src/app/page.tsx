import prisma from '@/lib/prisma';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Zap, Globe, LogIn } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const pengaturan = await prisma.pengaturan.findUnique({
    where: { id: 1 }
  });

  return (
    <div className="min-h-screen bg-crypto-dark flex flex-col font-sans text-gray-300 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-crypto-accent/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-crypto-accent-hover/20 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navbar / Header */}
      <header className="relative z-10 border-b border-crypto-border bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {pengaturan?.logoUrl ? (
              <img src={pengaturan.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-full shadow-[0_0_15px_rgba(112,0,255,0.4)]" />
            ) : (
              <div className="w-12 h-12 bg-crypto-accent/20 rounded-full flex items-center justify-center border border-crypto-accent/50 shadow-[0_0_15px_rgba(112,0,255,0.4)]">
                <GraduationCap className="w-6 h-6 text-crypto-accent" />
              </div>
            )}
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-widest neon-accent">
              {pengaturan?.namaSistem || 'PintarCBT'}
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="https://smkba.sch.id" 
              target="_blank"
              className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Website Utama
            </Link>
            <Link 
              href="/admin/login"
              className="px-4 py-2 text-sm font-semibold text-crypto-accent hover:text-crypto-accent-hover transition-colors"
            >
              Login Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex items-center justify-center py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-crypto-accent/10 border border-crypto-accent/20 text-crypto-accent font-semibold text-sm mb-8 animate-fade-in-up">
            <Zap className="w-4 h-4" />
            <span>Sistem Ujian Berbasis Komputer Generasi Baru</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Selamat Datang di <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-crypto-accent to-blue-400">
              {pengaturan?.namaSekolah || 'SMK Banjar Asri'}
            </span>
          </h2>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Aplikasi Ujian CBT (Computer Based Test) resmi untuk pelaksanaan penilaian harian, tengah semester, maupun akhir semester dengan sistem yang cepat, aman, dan transparan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link 
              href="/login"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent shadow-lg flex items-center justify-center gap-2 group"
            >
              <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Mulai Ujian (Siswa)
            </Link>
            
            <Link 
              href="https://smkba.sch.id" 
              target="_blank"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-gray-300 bg-crypto-card rounded-xl border border-crypto-border hover:border-crypto-accent/50 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Globe className="w-5 h-5" />
              smkba.sch.id
            </Link>
          </div>
        </div>
      </main>

      {/* Features / Footer */}
      <footer className="relative z-10 border-t border-crypto-border bg-black/40 py-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-crypto-accent/10 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-crypto-accent" />
            </div>
            <h3 className="text-white font-semibold">Keamanan Terjamin</h3>
            <p className="text-sm text-gray-500">Mencegah kecurangan dengan sistem token dinamis dan browser lock.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-crypto-accent/10 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-crypto-accent" />
            </div>
            <h3 className="text-white font-semibold">Cepat & Responsif</h3>
            <p className="text-sm text-gray-500">Dibangun dengan teknologi modern menjamin kelancaran ujian.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-crypto-accent/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-crypto-accent" />
            </div>
            <h3 className="text-white font-semibold">Fokus pada Siswa</h3>
            <p className="text-sm text-gray-500">Antarmuka yang bersih dan ramah untuk kenyamanan mengerjakan soal.</p>
          </div>
        </div>
        <div className="text-center mt-12 text-sm text-gray-600">
          &copy; {new Date().getFullYear()} {pengaturan?.namaSekolah || 'SMK Banjar Asri'}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
