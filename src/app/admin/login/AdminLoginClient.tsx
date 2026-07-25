'use client';

import { useState } from 'react';
import { loginAdmin } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { Lock, UserCircle, Loader2 } from 'lucide-react';

export default function AdminLoginClient({ pengaturan }: { pengaturan: any }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await loginAdmin(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      if (result.role === 'ADMIN') {
        router.push('/admin');
      } else if (result.role === 'PROCTOR') {
        router.push('/admin/proktor');
      } else {
        router.push('/admin/guru');
      }
    }
  };

  return (
    <div className="min-h-screen bg-crypto-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-crypto-card rounded-2xl shadow-[0_0_40px_rgba(112,0,255,0.1)] overflow-hidden border border-crypto-border relative">
        <div className="absolute inset-0 bg-gradient-to-br from-crypto-accent/10 to-transparent pointer-events-none"></div>
        <div className="bg-black/40 p-8 text-center border-b border-crypto-border relative z-10">
          {pengaturan?.logoUrl ? (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 shadow-[0_0_15px_rgba(112,0,255,0.4)]">
              <img src={pengaturan.logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain rounded-full" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-crypto-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-crypto-accent/20 shadow-[0_0_15px_rgba(112,0,255,0.4)]">
              <Lock className="w-8 h-8 text-crypto-accent" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white mb-2 tracking-widest neon-accent">
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
             {' '}Portal
          </h1>
          <p className="text-gray-400 text-sm">Masuk sebagai Admin atau Proktor</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 relative z-10">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm text-center font-medium border border-red-500/20 shadow-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5 tracking-wide">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-all outline-none"
                  placeholder="Masukkan username"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5 tracking-wide">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-black/40 border border-crypto-border rounded-xl focus:ring-2 focus:ring-crypto-accent focus:border-transparent text-white placeholder-gray-600 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-crypto-accent text-white font-bold tracking-wide py-3 rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent disabled:opacity-70 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              'Masuk ke Dasbor'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
