'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveAnswer, submitExam, reportCheat, checkSessionStatus, forceLogout } from '@/app/actions/exam';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, Send, Maximize, Minimize } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExamClient({ 
  sesiId, 
  jadwal, 
  soals, 
  initialAnswers,
  siswaNama
}: {
  sesiId: number;
  jadwal: any;
  soals: any[];
  initialAnswers: Record<number, string>;
  siswaNama: string;
}) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cheatWarning, setCheatWarning] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  const currentSoal = soals[currentIdx];

  // Deteksi apakah sudah berjalan sebagai PWA (standalone)
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsPWA(standalone);

    // Jika bukan PWA/standalone, coba minta fullscreen (Android)
    if (!standalone && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    // Pantau perubahan fullscreen
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const requestFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // Polling session status every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await checkSessionStatus(sesiId);
      if (!res.valid) {
        clearInterval(interval);
        if (res.reason === 'DELETED') {
          alert('Sesi Anda telah di-reset oleh Proktor atau Admin. Anda akan di-logout.');
          await forceLogout();
        } else if (res.reason === 'FINISHED') {
          alert('Ujian Anda telah diselesaikan secara paksa oleh Proktor.');
          router.replace('/siswa');
        }
      }
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, [sesiId, router]);


  // Hitung mundur waktu
  useEffect(() => {
    const end = new Date(jadwal.waktuSelesai).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;
      
      if (distance <= 0) {
        clearInterval(interval);
        handleAutoSubmit();
      } else {
        setTimeLeft(distance);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [jadwal.waktuSelesai]);

  // Anti-Cheat: Cegah pindah tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setCheatWarning(prev => prev + 1);
        const res = await reportCheat(sesiId);
        if (res.forcedSubmit) {
          alert('Ujian Anda dihentikan secara paksa karena terlalu sering keluar aplikasi!');
          router.replace('/siswa');
        } else {
          alert('PERINGATAN KECURANGAN!\nAnda terdeteksi keluar dari layar ujian. Jangan ulangi hal ini.');
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cegah klik kanan & copy
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
    };
  }, [sesiId, router]);

  const handleSelectOption = async (opsi: string) => {
    // Update state lokal biar UI langsung bereaksi
    setAnswers(prev => ({ ...prev, [currentSoal.id]: opsi }));
    
    // Autosave ke server
    const saveRes = await saveAnswer(sesiId, currentSoal.id, opsi);
    if (!saveRes.success && saveRes.error) {
       alert(saveRes.error);
       router.replace('/siswa');
    }
  };

  const handleAutoSubmit = useCallback(async () => {
    setIsSubmitting(true);
    await submitExam(sesiId);
    router.replace('/siswa');
  }, [sesiId, router]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-crypto-bg flex flex-col font-sans select-none relative text-gray-200">
      
      {/* WATERMARK OVERLAY */}
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.03]">
        <div className="transform -rotate-45 text-[150px] font-black text-white whitespace-nowrap">
          {siswaNama} - {jadwal.nama}
        </div>
      </div>

      {/* Banner: Belum Fullscreen / Belum PWA */}
      {!isPWA && !isFullscreen && (
        <div className="bg-yellow-500 text-white px-4 py-2.5 flex items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Maximize className="w-4 h-4 flex-shrink-0" />
            <span>Untuk pengalaman terbaik & anti-kecurangan, gunakan mode layar penuh.</span>
          </div>
          <button
            onClick={requestFullscreen}
            className="flex-shrink-0 px-3 py-1 bg-white text-yellow-700 text-xs font-bold rounded-full hover:bg-yellow-50 transition"
          >
            Layar Penuh
          </button>
        </div>
      )}

      {/* Header Sticky */}
      <header className="bg-[#09090b]/80 backdrop-blur-md shadow-sm sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b border-crypto-border">
        <div>
          <h1 className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{jadwal.nama}</h1>
          <p className="text-xs text-crypto-accent">{siswaNama}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {cheatWarning > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
              <AlertTriangle className="w-4 h-4" />
              Peringatan: {cheatWarning}/3
            </div>
          )}
          {/* Tombol Fullscreen (hanya tampil jika browser mendukung & belum fullscreen) */}
          {!isPWA && (
            <button
              onClick={isFullscreen
                ? () => document.exitFullscreen?.().catch(() => {})
                : requestFullscreen
              }
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              className={`p-1.5 rounded-lg transition-colors border ${
                isFullscreen
                  ? 'text-crypto-success bg-crypto-success/10 border-crypto-success/20 hover:bg-crypto-success/20'
                  : 'text-gray-400 bg-crypto-card border-crypto-border hover:bg-crypto-card-hover'
              }`}
            >
              {isFullscreen
                ? <Minimize className="w-4 h-4" />
                : <Maximize className="w-4 h-4" />
              }
            </button>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold border ${
            timeLeft < 300000 ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 'bg-crypto-card text-gray-300 border-crypto-border'
          }`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-6xl w-full mx-auto p-4 gap-4">
        
        {/* Soal Area */}
        <div className="flex-1 bg-crypto-card rounded-2xl shadow-xl border border-crypto-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-crypto-border bg-black/40 flex justify-between items-center">
            <span className="font-semibold text-gray-300 tracking-wider uppercase text-sm">Soal Nomor {currentIdx + 1}</span>
            <span className="text-xs text-gray-500">Pilihan Ganda</span>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <p className="text-lg text-gray-200 mb-8 whitespace-pre-wrap leading-relaxed">
              {currentSoal.pertanyaan}
            </p>
            
            <div className="space-y-3">
              {currentSoal.opsi.map((opt: string, idx: number) => {
                const isSelected = answers[currentSoal.id] === opt;
                return (
                  <label 
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-crypto-accent bg-crypto-accent/10 neon-accent' 
                        : 'border-crypto-border hover:border-crypto-accent/50 hover:bg-crypto-card-hover'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${
                      isSelected ? 'border-crypto-accent' : 'border-gray-600'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-crypto-accent" />}
                    </div>
                    <span className={`text-base ${isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 bg-black/40 border-t border-crypto-border flex justify-between">
            <button 
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-300 bg-transparent border border-crypto-border rounded-xl hover:bg-crypto-card-hover disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Sebelumnya
            </button>
            
            {currentIdx < soals.length - 1 ? (
              <button 
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent"
              >
                Selanjutnya
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                disabled={isSubmitting}
                onClick={() => {
                  if(confirm('Apakah Anda yakin ingin menyelesaikan ujian? Anda tidak bisa kembali!')) {
                    handleAutoSubmit();
                  }
                }}
                className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-crypto-success rounded-xl hover:bg-crypto-success-hover disabled:opacity-70 shadow-lg transition-all hover:neon-success"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Menyimpan...' : 'Selesai Ujian'}
              </button>
            )}
          </div>
        </div>

        {/* Nomor Navigasi (Mobile -> scroll horizontal, Desktop -> Grid box) */}
        <div className="bg-crypto-card rounded-2xl shadow-xl border border-crypto-border p-4 lg:w-72 flex-shrink-0">
          <h3 className="font-bold text-white mb-4 hidden lg:block tracking-wide">Navigasi Soal</h3>
          
          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2 max-h-32 lg:max-h-[500px] overflow-y-auto p-1 custom-scrollbar">
            {soals.map((s, idx) => {
              const isAnswered = !!answers[s.id];
              const isCurrent = currentIdx === idx;
              
              let btnClass = "w-10 h-10 rounded-xl font-semibold text-sm border-2 transition-all flex items-center justify-center ";
              
              if (isCurrent) {
                btnClass += "border-crypto-accent bg-crypto-accent/20 text-white shadow-[0_0_15px_rgba(112,0,255,0.4)]";
              } else if (isAnswered) {
                btnClass += "border-crypto-success/50 bg-crypto-success/10 text-crypto-success";
              } else {
                btnClass += "border-crypto-border bg-black/40 text-gray-400 hover:border-gray-500";
              }
              
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={btnClass}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t border-crypto-border flex flex-col gap-2 text-xs text-gray-400 hidden lg:flex">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-crypto-success bg-crypto-success/10" />
              <span>Sudah Dijawab</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-crypto-border bg-black/40" />
              <span>Belum Dijawab</span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-red-400 font-medium">
              <AlertTriangle className="w-4 h-4" />
              <span>Peringatan: {cheatWarning}/3</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
