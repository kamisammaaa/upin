'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetSemuaSesiSiswa } from '@/app/actions/pengaturan';

export default function ResetSesiButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (confirm('PERINGATAN!\n\nApakah Anda YAKIN ingin mereset seluruh sesi ujian siswa yang sedang berlangsung? Ini akan membuat mereka harus login ulang dan memulai ulang sesi (jawaban yang sudah tersimpan mungkin aman, tapi akses ujian akan terhenti saat ini).')) {
      setIsLoading(true);
      const res = await resetSemuaSesiSiswa();
      
      if (res?.error) {
        alert(res.error);
      } else {
        alert('Seluruh sesi siswa berhasil direset!');
        router.refresh();
      }
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleReset}
      disabled={isLoading}
      className="px-4 py-2 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50"
    >
      {isLoading ? 'Mereset...' : 'Reset Seluruh Sesi Ujian Siswa'}
    </button>
  );
}
