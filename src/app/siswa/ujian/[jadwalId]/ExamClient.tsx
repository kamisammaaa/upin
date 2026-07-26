'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { saveAnswer, submitExam, reportCheat, checkSessionStatus, forceLogout } from '@/app/actions/exam';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, Send, Maximize, Minimize, Type, ZoomIn, X, Flag, CheckCircle2, HelpCircle, FileText, Wifi, WifiOff, RefreshCw, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Fungsi seeded random sederhana
function seededRandom(seed: number) {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function shuffleArray<T>(array: T[], seed: number): T[] {
  const newArr = [...array];
  let m = newArr.length, t, i;
  let currentSeed = seed;
  while (m) {
    i = Math.floor(seededRandom(currentSeed++) * m--);
    t = newArr[m];
    newArr[m] = newArr[i];
    newArr[i] = t;
  }
  return newArr;
}

export default function ExamClient({ 
  sesiId, 
  jadwal, 
  soals, 
  initialAnswers,
  initialPelanggaran,
  siswaNama,
  acakSoal,
  acakOpsi
}: {
  sesiId: number;
  jadwal: any;
  soals: any[];
  initialAnswers: Record<number, string>;
  initialPelanggaran?: number;
  siswaNama: string;
  acakSoal?: boolean;
  acakOpsi?: boolean;
}) {
  const router = useRouter();
  
  // Hitung urutan soal dan opsi yang diacak (stabil selama sesiId tidak berubah)
  const processedSoals = useMemo(() => {
    let finalSoals = soals;
    if (acakSoal) {
      finalSoals = shuffleArray(finalSoals, sesiId);
    }
    
    if (acakOpsi) {
      finalSoals = finalSoals.map((s, i) => ({
        ...s,
        // Gunakan seed gabungan dari sesiId dan id soal agar opsi tiap soal teracak berbeda
        opsi: shuffleArray(s.opsi, sesiId + s.id)
      }));
    }
    return finalSoals;
  }, [soals, sesiId, acakSoal, acakOpsi]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cheatWarning, setCheatWarning] = useState(initialPelanggaran || 0);
  const [showCheatModal, setShowCheatModal] = useState<number | null>(null);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const lastCheatReportTimeRef = useRef<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  // Aksesibilitas & UI (Point 3)
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Navigasi & Fitur Ragu-Ragu (Point 1)
  const [raguState, setRaguState] = useState<Record<number, boolean>>({});
  const [navFilter, setNavFilter] = useState<'all' | 'unanswered' | 'answered' | 'ragu'>('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [agreeSubmit, setAgreeSubmit] = useState(false);

  // Ketahanan Jaringan & Auto-Save (Point 2)
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initial Load: Merge LocalStorage Backup + Load Ragu & Pending Queue
  useEffect(() => {
    // Detect initial online status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const savedFont = localStorage.getItem('cbt_font_size') as 'sm' | 'md' | 'lg' | 'xl';
    if (savedFont && ['sm', 'md', 'lg', 'xl'].includes(savedFont)) {
      setFontSize(savedFont);
    }

    try {
      // 1. Merge Local Answers dengan Server Initial Answers
      const localAnsRaw = localStorage.getItem(`cbt_answers_${sesiId}`);
      const localAns = localAnsRaw ? JSON.parse(localAnsRaw) : {};
      const mergedAnswers = { ...initialAnswers, ...localAns };
      setAnswers(mergedAnswers);
      localStorage.setItem(`cbt_answers_${sesiId}`, JSON.stringify(mergedAnswers));

      // 2. Load Ragu State
      const savedRagu = localStorage.getItem(`cbt_ragu_${sesiId}`);
      if (savedRagu) {
        setRaguState(JSON.parse(savedRagu));
      }

      // 3. Load Pending Sync Queue Count
      const pendingRaw = localStorage.getItem(`cbt_pending_${sesiId}`);
      if (pendingRaw) {
        const pendingObj = JSON.parse(pendingRaw);
        setPendingSyncCount(Object.keys(pendingObj).length);
      }
    } catch { /* ignore parse error */ }
  }, [sesiId, initialAnswers]);

  // Flush Queue Auto-Sync ke Server
  const flushPendingQueue = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    try {
      const pendingRaw = localStorage.getItem(`cbt_pending_${sesiId}`);
      if (!pendingRaw) return;
      
      const pending: Record<number, string> = JSON.parse(pendingRaw);
      const soalIds = Object.keys(pending);
      if (soalIds.length === 0) {
        setPendingSyncCount(0);
        return;
      }

      setIsSyncing(true);
      const currentPending = { ...pending };

      for (const soalIdStr of soalIds) {
        const soalId = parseInt(soalIdStr);
        const opsi = currentPending[soalId];
        try {
          const res = await saveAnswer(sesiId, soalId, opsi);
          if (res.success) {
            delete currentPending[soalId];
          }
        } catch {
          // Koneksi putus saat request, hentikan sementara
          break;
        }
      }

      localStorage.setItem(`cbt_pending_${sesiId}`, JSON.stringify(currentPending));
      const remainingCount = Object.keys(currentPending).length;
      setPendingSyncCount(remainingCount);
    } catch { /* ignore */ } finally {
      setIsSyncing(false);
    }
  }, [sesiId]);

  // Event Listener Online/Offline & Interval Auto-Sync tiap 8 detik
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushPendingQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        flushPendingQueue();
      }
    }, 8000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [flushPendingQueue]);

  const toggleRagu = (soalId: number) => {
    setRaguState(prev => {
      const next = { ...prev, [soalId]: !prev[soalId] };
      localStorage.setItem(`cbt_ragu_${sesiId}`, JSON.stringify(next));
      return next;
    });
  };

  const changeFontSize = (size: 'sm' | 'md' | 'lg' | 'xl') => {
    setFontSize(size);
    localStorage.setItem('cbt_font_size', size);
  };

  const currentSoal = processedSoals[currentIdx];

  // Deteksi apakah sudah berjalan sebagai PWA (standalone)
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    
    // eslint-disable-next-line
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


  const handleAutoSubmit = useCallback(async () => {
    setIsSubmitting(true);
    await submitExam(sesiId);
    router.replace('/siswa');
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
  }, [jadwal.waktuSelesai, handleAutoSubmit]);

  // Fungsi Lapor Kecurangan dengan Throttling
  const triggerCheatReport = useCallback(async () => {
    const now = Date.now();
    // Throttle 2.5 detik untuk cegah double report saat blur & visibilitychange bersamaan
    if (now - lastCheatReportTimeRef.current < 2500) return;
    lastCheatReportTimeRef.current = now;

    const res = await reportCheat(sesiId);
    if (res.count !== undefined) {
      setCheatWarning(res.count);
    }
    
    if (res.forcedSubmit) {
      alert('Ujian Anda dihentikan secara paksa karena terdeteksi keluar dari aplikasi 3 kali!');
      router.replace('/siswa');
    } else {
      setShowCheatModal(res.count || 1);
    }
  }, [sesiId, router]);

  // Anti-Cheat: Deteksi pindah tab, minimize, blur, & pencegahan screenshot
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
        triggerCheatReport();
      } else {
        setIsWindowBlurred(false);
      }
    };

    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
      triggerCheatReport();
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    // Pencegahan Tombol Screenshot (PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5, Ctrl+P, F12)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      // PrintScreen
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('');
        }
        triggerCheatReport();
        return;
      }

      // Kombinasi Shortcut Screenshot / DevTools / Print / Save
      if (
        e.key === 'F12' ||
        (isCmdOrCtrl && e.shiftKey && ['S', 's', 'I', 'i', 'C', 'c', '3', '4', '5'].includes(e.key)) ||
        (isCmdOrCtrl && ['p', 'P', 's', 'S', 'u', 'U'].includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerCheatReport();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown);

    // Cegah klik kanan & copy
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
    };
  }, [triggerCheatReport]);

  const handleSelectOption = async (opsi: string) => {
    const soalId = currentSoal.id;

    // 1. Update state lokal React secara instan
    setAnswers(prev => ({ ...prev, [soalId]: opsi }));

    // 2. Simpan cadangan ke LocalStorage (Offline Resilience)
    try {
      const localAnsRaw = localStorage.getItem(`cbt_answers_${sesiId}`);
      const localAns = localAnsRaw ? JSON.parse(localAnsRaw) : {};
      localAns[soalId] = opsi;
      localStorage.setItem(`cbt_answers_${sesiId}`, JSON.stringify(localAns));

      // Tambahkan ke antrean pending sync
      const pendingRaw = localStorage.getItem(`cbt_pending_${sesiId}`);
      const pending = pendingRaw ? JSON.parse(pendingRaw) : {};
      pending[soalId] = opsi;
      localStorage.setItem(`cbt_pending_${sesiId}`, JSON.stringify(pending));
      setPendingSyncCount(Object.keys(pending).length);
    } catch { /* ignore */ }
    
    // 3. Kirim ke Server jika online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const saveRes = await saveAnswer(sesiId, soalId, opsi);
        if (saveRes.success) {
          // Hapus dari antrean pending sync
          const pendingRaw = localStorage.getItem(`cbt_pending_${sesiId}`);
          if (pendingRaw) {
            const pending = JSON.parse(pendingRaw);
            delete pending[soalId];
            localStorage.setItem(`cbt_pending_${sesiId}`, JSON.stringify(pending));
            setPendingSyncCount(Object.keys(pending).length);
          }
        } else if (saveRes.error) {
          alert(saveRes.error);
          router.replace('/siswa');
        }
      } catch {
        // Gagal terkirim (koneksi terputus di tengah jalan), akan dicoba lagi oleh auto-sync
      }
    }
  };

  // Delegasi klik gambar pada konten soal / opsi untuk membuka Lightbox Preview
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const src = (target as HTMLImageElement).src;
      if (src) {
        setPreviewImage(src);
      }
    }
  };

  // Utility class untuk ukuran font soal dan opsi
  const getQuestionFontClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-base leading-relaxed';
      case 'lg': return 'text-xl leading-relaxed';
      case 'xl': return 'text-2xl leading-relaxed';
      default: return 'text-lg leading-relaxed';
    }
  };

  const getOptionFontClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  // Statistik Jawaban untuk Modal Submit
  const totalSoalCount = processedSoals.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalSoalCount - answeredCount;
  const raguCount = Object.values(raguState).filter(Boolean).length;



  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-crypto-bg flex flex-col font-sans select-none relative text-gray-200">
      
      {/* CSS Shield: Sembunyikan Konten Ujian Jika Dicetak / Di-print */}
      <style dangerouslySetInnerHTML={{ __html: `@media print { body { display: none !important; } }` }} />

      {/* MULTI-ROW WATERMARK OVERLAY */}
      <div className="fixed inset-0 z-50 pointer-events-none grid grid-cols-2 grid-rows-3 gap-8 items-center justify-items-center overflow-hidden opacity-[0.04] select-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="transform -rotate-30 text-4xl sm:text-6xl font-black text-white whitespace-nowrap tracking-widest uppercase">
            {siswaNama} • {jadwal.nama}
          </div>
        ))}
      </div>

      {/* Blackout Overlay Saat Jendela Ujian Kehilangan Fokus / Screenshot Attempt */}
      {isWindowBlurred && (
        <div 
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-100 cursor-pointer"
        >
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-500/40 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">LAYAR UJIAN DIROSEK / DI-BLACKOUT</h2>
          <p className="text-sm text-gray-300 max-w-md mb-4 leading-relaxed">
            Terdeteksi percobaan tangkapan layar atau jendela ujian kehilangan fokus. Layar disembunyikan untuk menjaga keamanan soal.
          </p>
          <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold">
            Klik di mana saja atau kembalikan fokus ke layar untuk melanjutkan ujian.
          </div>
        </div>
      )}

      {/* Banner Toast Notifikasi Offline */}
      {!isOnline && (
        <div className="bg-red-600/90 backdrop-blur-md text-white px-4 py-2 flex items-center justify-between text-xs font-medium z-30 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 flex-shrink-0 animate-bounce" />
            <span>Koneksi internet terputus! Jawaban Anda tetap tersimpan aman di perangkat ini dan akan otomatis dikirim begitu jaringan terhubung kembali.</span>
          </div>
          {pendingSyncCount > 0 && (
            <span className="bg-black/30 px-2 py-0.5 rounded-full font-bold">
              {pendingSyncCount} Belum Tersinkron
            </span>
          )}
        </div>
      )}

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
          {/* Indikator Status Koneksi & Sync Real-time */}
          {!isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse" title="Koneksi terputus! Jawaban tersimpan di memori perangkat ini.">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline ({pendingSyncCount})</span>
            </div>
          ) : isSyncing || pendingSyncCount > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" title="Mengirim cadangan jawaban ke server...">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Sync ({pendingSyncCount})</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl bg-crypto-success/10 text-crypto-success border border-crypto-success/20" title="Terhubung & Seluruh Jawaban Tersimpan di Server">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </div>
          )}

          {cheatWarning > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/20 px-2.5 py-1 rounded-xl border border-red-500/40 shadow-sm animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Peringatan: {cheatWarning}/3</span>
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
      <main className="flex-1 flex flex-col lg:flex-row w-full p-4 sm:p-6 gap-6">
        
        {/* Soal Area */}
        <div className="flex-1 bg-crypto-card rounded-2xl shadow-xl border border-crypto-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-crypto-border bg-black/40 flex justify-between items-center">
            <span className="font-semibold text-gray-300 tracking-wider uppercase text-sm">Soal Nomor {currentIdx + 1}</span>
            
            {/* Pengatur Ukuran Font (A-, A, A+) */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-gray-500 flex items-center gap-1">
                <Type className="w-3.5 h-3.5" /> Ukuran Teks:
              </span>
              <div className="flex items-center bg-black/60 border border-crypto-border rounded-lg p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => changeFontSize('sm')}
                  title="Ukuran Kecil"
                  className={`px-2 py-0.5 rounded transition-colors ${fontSize === 'sm' ? 'bg-crypto-accent text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => changeFontSize('md')}
                  title="Ukuran Normal"
                  className={`px-2 py-0.5 rounded transition-colors ${fontSize === 'md' ? 'bg-crypto-accent text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => changeFontSize('lg')}
                  title="Ukuran Besar"
                  className={`px-2 py-0.5 rounded transition-colors ${fontSize === 'lg' ? 'bg-crypto-accent text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => changeFontSize('xl')}
                  title="Ukuran Sangat Besar"
                  className={`px-2 py-0.5 rounded transition-colors ${fontSize === 'xl' ? 'bg-crypto-accent text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  A++
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto" onClick={handleContentClick}>
            <div 
              className={`text-gray-200 mb-8 prose prose-invert max-w-none prose-img:max-h-64 sm:prose-img:max-h-80 prose-img:w-auto prose-img:object-contain prose-img:rounded-xl prose-img:border prose-img:border-gray-700 prose-img:cursor-zoom-in prose-img:hover:opacity-90 prose-img:transition-opacity ${getQuestionFontClass()}`}
              dangerouslySetInnerHTML={{ __html: currentSoal.pertanyaan }}
            />
            
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
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 flex-shrink-0 ${
                      isSelected ? 'border-crypto-accent' : 'border-gray-600'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-crypto-accent" />}
                    </div>
                    <div 
                      className={`flex-1 prose prose-invert max-w-none prose-p:my-0 prose-img:max-h-24 sm:prose-img:max-h-32 prose-img:w-auto prose-img:object-contain prose-img:my-1 prose-img:rounded-lg prose-img:cursor-zoom-in prose-img:hover:opacity-90 ${getOptionFontClass()} ${isSelected ? 'text-white font-medium' : 'text-gray-400'}`}
                      dangerouslySetInnerHTML={{ __html: opt }}
                    />
                  </label>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 bg-black/40 border-t border-crypto-border flex flex-wrap items-center justify-between gap-3">
            <button 
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-300 bg-transparent border border-crypto-border rounded-xl hover:bg-crypto-card-hover disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Sebelumnya
            </button>
            
            {/* Tombol Ragu-Ragu */}
            <button
              type="button"
              onClick={() => toggleRagu(currentSoal.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
                raguState[currentSoal.id]
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                  : 'bg-black/40 text-gray-400 border-crypto-border hover:text-yellow-400 hover:border-yellow-500/30'
              }`}
            >
              <Flag className={`w-4 h-4 ${raguState[currentSoal.id] ? 'fill-yellow-400' : ''}`} />
              <span>Ragu-Ragu</span>
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
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-crypto-success rounded-xl hover:bg-crypto-success-hover disabled:opacity-70 shadow-lg transition-all hover:neon-success"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Menyimpan...' : 'Selesai Ujian'}
              </button>
            )}
          </div>
        </div>

        {/* Nomor Navigasi (Mobile -> scroll horizontal, Desktop -> Grid box) */}
        <div className="bg-crypto-card rounded-2xl shadow-xl border border-crypto-border p-4 lg:w-72 flex-shrink-0 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-white tracking-wide text-sm">Navigasi Soal</h3>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="lg:hidden text-xs text-crypto-success font-semibold underline"
            >
              Selesai Ujian
            </button>
          </div>

          {/* Filter Navigasi Soal (Semua, Belum, Dijawab, Ragu) */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-black/50 border border-crypto-border rounded-xl mb-3 text-[11px] font-medium text-center">
            <button
              onClick={() => setNavFilter('all')}
              className={`py-1 rounded-lg transition-colors ${navFilter === 'all' ? 'bg-crypto-accent text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setNavFilter('answered')}
              className={`py-1 rounded-lg transition-colors ${navFilter === 'answered' ? 'bg-crypto-success text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Dijawab
            </button>
            <button
              onClick={() => setNavFilter('unanswered')}
              className={`py-1 rounded-lg transition-colors ${navFilter === 'unanswered' ? 'bg-gray-700 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Belum
            </button>
            <button
              onClick={() => setNavFilter('ragu')}
              className={`py-1 rounded-lg transition-colors ${navFilter === 'ragu' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Ragu ({raguCount})
            </button>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2 max-h-40 lg:max-h-[440px] overflow-y-auto p-1 custom-scrollbar flex-1">
            {processedSoals.map((s, idx) => {
              const isAnswered = !!answers[s.id];
              const isRagu = !!raguState[s.id];
              const isCurrent = currentIdx === idx;

              // Filter logic
              if (navFilter === 'answered' && !isAnswered) return null;
              if (navFilter === 'unanswered' && isAnswered) return null;
              if (navFilter === 'ragu' && !isRagu) return null;
              
              let btnClass = "w-10 h-10 rounded-xl font-semibold text-sm border-2 transition-all flex items-center justify-center relative ";
              
              if (isCurrent) {
                btnClass += "border-crypto-accent bg-crypto-accent/30 text-white shadow-[0_0_15px_rgba(112,0,255,0.5)] ring-2 ring-crypto-accent ";
              } else if (isRagu) {
                btnClass += "border-yellow-500/60 bg-yellow-500/20 text-yellow-400 font-bold shadow-[0_0_10px_rgba(234,179,8,0.2)] ";
              } else if (isAnswered) {
                btnClass += "border-crypto-success/50 bg-crypto-success/10 text-crypto-success ";
              } else {
                btnClass += "border-crypto-border bg-black/40 text-gray-400 hover:border-gray-500 ";
              }
              
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={btnClass}
                >
                  {idx + 1}
                  {isRagu && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-black" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Legend Navigasi */}
          <div className="mt-4 pt-3 border-t border-crypto-border flex flex-col gap-1.5 text-xs text-gray-400 hidden lg:flex">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded border border-crypto-success bg-crypto-success/10" />
              <span>Sudah Dijawab ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded border border-yellow-500 bg-yellow-500/20" />
              <span>Ragu-Ragu ({raguCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded border border-crypto-border bg-black/40" />
              <span>Belum Dijawab ({unansweredCount})</span>
            </div>
          </div>
        </div>

      </main>

      {/* Lightbox Preview Modal Gambar Soal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:inline">Klik di mana saja untuk menutup</span>
            <button
              onClick={() => setPreviewImage(null)}
              className="p-2 bg-crypto-card border border-crypto-border rounded-xl text-gray-300 hover:text-white hover:bg-crypto-card-hover transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="max-w-4xl max-h-[85vh] p-2 relative flex items-center justify-center">
            <img 
              src={previewImage} 
              alt="Zoomed Preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-crypto-border shadow-2xl"
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-crypto-accent font-medium">
            <ZoomIn className="w-4 h-4" /> Mode Perbesar Gambar
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Selesai Ujian (Submit Summary Modal) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] rounded-2xl border border-crypto-border shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-crypto-border bg-black/40 flex justify-between items-center">
              <div className="flex items-center gap-2 text-white font-bold">
                <FileText className="w-5 h-5 text-crypto-accent" />
                <span>Konfirmasi Penyelesaian Ujian</span>
              </div>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-gray-300">
                Berikut adalah ringkasan progres ujian Anda sebelum mengakhiri sesi:
              </p>

              {/* Grid Statistik Ringkasan */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-crypto-success/10 border border-crypto-success/30 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-crypto-success">{answeredCount}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Sudah Dijawab</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-yellow-400">{raguCount}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Ragu-Ragu</div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-300">{unansweredCount}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Belum Dijawab</div>
                </div>
              </div>

              {/* Peringatan jika masih ada soal belum dijawab / ragu-ragu */}
              {(unansweredCount > 0 || raguCount > 0) && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    {unansweredCount > 0 && <p>Masih ada <strong>{unansweredCount} soal</strong> yang belum dijawab.</p>}
                    {raguCount > 0 && <p>Masih ada <strong>{raguCount} soal</strong> berstatus ragu-ragu.</p>}
                  </div>
                </div>
              )}

              {/* Checkbox Konfirmasi */}
              <label className="flex items-start gap-3 p-3 bg-black/40 border border-crypto-border rounded-xl cursor-pointer hover:bg-black/60 transition-colors">
                <input
                  type="checkbox"
                  checked={agreeSubmit}
                  onChange={(e) => setAgreeSubmit(e.target.value !== undefined ? e.target.checked : false)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-700 text-crypto-accent focus:ring-crypto-accent"
                />
                <span className="text-xs text-gray-300 leading-relaxed">
                  Saya telah memeriksa seluruh jawaban dan secara sadar yakin ingin menyelesaikan ujian ini.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-300 bg-transparent border border-crypto-border rounded-xl hover:bg-crypto-card-hover transition-colors"
                >
                  Periksa Kembali
                </button>
                <button
                  type="button"
                  disabled={!agreeSubmit || isSubmitting}
                  onClick={() => {
                    setShowSubmitModal(false);
                    handleAutoSubmit();
                  }}
                  className="flex-1 py-2.5 px-4 text-sm font-bold text-white bg-crypto-success rounded-xl hover:bg-crypto-success-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all hover:neon-success flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Memproses...' : 'Ya, Selesaikan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Peringatan Kecurangan Siswa */}
      {showCheatModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#09090b] rounded-2xl border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] w-full max-w-md overflow-hidden animate-in zoom-in-95 p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/40 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">PERINGATAN KECURANGAN!</h3>
            
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              Anda terdeteksi keluar dari layar ujian atau membuka aplikasi lain. 
            </p>

            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-6 text-red-400 text-sm font-semibold">
              Jumlah Pelanggaran: <span className="text-lg font-extrabold">{cheatWarning} / 3</span>
            </div>

            <p className="text-xs text-gray-400 mb-6">
              Perhatian: Jika Anda keluar layar sebanyak 3 kali, ujian Anda akan <strong>otomatis dihentikan dan di-submit secara paksa</strong> oleh sistem!
            </p>

            <button
              type="button"
              onClick={() => setShowCheatModal(null)}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-red-500/20"
            >
              Saya Mengerti & Lanjutkan Ujian
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
