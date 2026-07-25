'use client';

import { useActionState, useEffect, useState } from 'react';
import { loginSiswa } from '../actions/auth';
import { GraduationCap, LogIn, Smartphone } from 'lucide-react';

export default function LoginClient({ pengaturan }: { pengaturan: any }) {
  const [state, formAction, isPending] = useActionState(loginSiswa, null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Tampilkan banner hanya jika BELUM dalam mode standalone (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (!isStandalone) setShowInstallBanner(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-crypto-bg p-4 font-sans text-gray-200">
      <div className="max-w-md w-full space-y-4">

        {/* Banner Panduan Install PWA */}
        {showInstallBanner && (
          <div className="bg-crypto-card border border-crypto-border rounded-xl p-4 flex gap-3 shadow-lg">
            <Smartphone className="w-6 h-6 text-crypto-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-white mb-1">💡 Tips: Buka sebagai Aplikasi</p>
              <p className="text-gray-400">
                Untuk tampilan layar penuh selama ujian:
              </p>
              <ul className="text-gray-300 mt-1 space-y-0.5 list-disc list-inside">
                <li><strong>Android:</strong> Ketuk menu ⋮ → "Tambahkan ke layar utama"</li>
                <li><strong>iPhone:</strong> Ketuk ikon berbagi □↑ → "Tambahkan ke Layar Utama"</li>
              </ul>
            </div>
          </div>
        )}

        {pengaturan?.pengumuman && (
          <div className="bg-crypto-card border border-crypto-accent/50 rounded-xl p-4 shadow-lg text-center">
            <p className="font-bold text-crypto-accent mb-1">📢 Pengumuman</p>
            <p className="text-gray-300 text-sm">{pengaturan.pengumuman}</p>
          </div>
        )}

        <div className="bg-crypto-card rounded-2xl shadow-[0_0_40px_rgba(112,0,255,0.1)] overflow-hidden border border-crypto-border relative">
        <div className="absolute inset-0 bg-gradient-to-br from-crypto-accent/5 to-transparent pointer-events-none"></div>
        <div className="bg-black/40 p-8 text-center border-b border-crypto-border relative z-10">
          {pengaturan?.logoUrl ? (
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full shadow-[0_0_15px_rgba(112,0,255,0.4)]">
              <img src={pengaturan.logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain rounded-full" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-crypto-accent/10 border border-crypto-accent/20 mb-4 shadow-[0_0_15px_rgba(112,0,255,0.4)]">
              <GraduationCap className="w-8 h-8 text-crypto-accent" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-widest text-white neon-accent">
            {pengaturan?.namaSistem ? (
              // highlight CBT if it ends with CBT, otherwise just render
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
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Portal Ujian {pengaturan?.namaSekolah ? `Siswa ${pengaturan.namaSekolah}` : 'Siswa SMK Banjar Asri'}
          </p>
        </div>
        
        <div className="p-8 relative z-10">
          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                {state.error}
              </div>
            )}
            
            <div>
              <label htmlFor="nis" className="block text-sm font-semibold text-gray-300 mb-1.5 tracking-wide">
                Nomor Induk Siswa (NIS)
              </label>
              <input
                type="text"
                id="nis"
                name="nis"
                required
                placeholder="Masukkan NIS Anda"
                className="w-full px-4 py-3 bg-black/40 rounded-xl border border-crypto-border focus:ring-2 focus:ring-crypto-accent focus:border-transparent outline-none transition-all text-white placeholder-gray-600"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-1.5 tracking-wide">
                Kata Sandi
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-black/40 rounded-xl border border-crypto-border focus:ring-2 focus:ring-crypto-accent focus:border-transparent outline-none transition-all text-white placeholder-gray-600"
              />
            </div>
            
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-crypto-accent hover:bg-crypto-accent-hover text-white font-bold tracking-wide rounded-xl shadow-lg transition-all hover:neon-accent disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? 'Memproses...' : (
                <>
                  <LogIn className="w-5 h-5" />
                  Masuk Sekarang
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-crypto-border text-center">
            <p className="text-sm text-gray-400">
              Lupa kata sandi? Silakan hubungi Proktor ruangan Anda.
            </p>
            <a href="/admin" className="text-xs text-crypto-accent hover:text-white transition-colors mt-4 inline-block">
              Masuk sebagai Admin/Guru &rarr;
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
