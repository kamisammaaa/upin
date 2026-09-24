'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetSemuaSesiSiswa } from '@/app/actions/pengaturan';

export default function ResetSesiButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (confirm('PERINGATAN PENTING!\n\nApakah Anda YAKIN ingin mereset seluruh sesi ujian siswa?\n\nTindakan ini akan MENGHAPUS PERMANEN seluruh sesi ujian, jawaban, dan nilai akhir siswa dari simulasi/ujian sebelumnya agar sistem bersih untuk ujian berikutnya.\n\nData master siswa, kelas, guru, dan bank soal TIDAK akan terhapus.\n\nPastikan Anda SUDAH MENGUNDUH Backup Database (.db) atau Rekap Nilai Excel sebelum melanjutkan!')) {
      setIsLoading(true);
      const res = await resetSemuaSesiSiswa();
      
      if (res?.error) {
        alert(res.error);
      } else {
        alert('Seluruh sesi siswa berhasil direset! Siswa kini dapat memulai ujian dari awal.');
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
