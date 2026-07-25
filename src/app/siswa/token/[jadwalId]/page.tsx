'use client';

import { useActionState, use } from 'react';
import { verifyToken } from '@/app/actions/auth';
import { KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function TokenPage({ params }: { params: Promise<{ jadwalId: string }> }) {
  const resolvedParams = use(params);
  const [state, formAction, isPending] = useActionState(verifyToken, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-crypto-dark p-4 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-crypto-accent/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-crypto-accent-hover/20 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full bg-crypto-card rounded-2xl shadow-xl overflow-hidden border border-crypto-border relative z-10 backdrop-blur-sm">
        <div className="bg-black/40 p-8 text-center border-b border-crypto-border relative">
          <div className="absolute inset-0 bg-gradient-to-b from-crypto-accent/10 to-transparent opacity-50 pointer-events-none"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-crypto-accent/20 border border-crypto-accent/50 mb-4 shadow-[0_0_15px_rgba(112,0,255,0.4)] relative z-10">
            <KeyRound className="w-8 h-8 text-crypto-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider neon-accent relative z-10">Masukkan Token</h1>
          <p className="text-gray-400 mt-2 text-sm relative z-10">Token diberikan oleh proktor ruangan Anda</p>
        </div>
        
        <div className="p-8">
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="jadwalId" value={resolvedParams.jadwalId} />
            
            {state?.error && (
              <div className="p-3 text-sm text-red-200 bg-red-900/40 border border-red-500/50 rounded-xl">
                {state.error}
              </div>
            )}
            
            <div>
              <label htmlFor="token" className="block text-sm font-semibold text-gray-300 mb-2">
                Token Ujian
              </label>
              <input
                type="text"
                id="token"
                name="token"
                required
                placeholder="Misal: CBT2026"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-crypto-border focus:ring-2 focus:ring-crypto-accent/50 focus:border-crypto-accent outline-none transition-all text-white font-mono tracking-widest text-center font-bold text-xl uppercase placeholder-gray-600"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 bg-crypto-accent hover:bg-crypto-accent-hover text-white font-bold rounded-xl shadow-lg hover:neon-accent transition-all disabled:opacity-70 disabled:cursor-not-allowed group flex justify-center items-center gap-2"
            >
              {isPending ? 'Memvalidasi...' : 'Mulai Kerjakan'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <Link href="/siswa" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
              &larr; Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
