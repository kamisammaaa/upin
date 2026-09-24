import prisma from '@/lib/prisma';
import PengaturanClient from './PengaturanClient';
import ResetSesiButton from './ResetSesiButton';
import BackupDatabaseCard from './BackupDatabaseCard';
import { Settings, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PengaturanPage() {
  let pengaturan = await prisma.pengaturan.findUnique({
    where: { id: 1 }
  });

  if (!pengaturan) {
    // Fallback if not exists
    pengaturan = {
      id: 1,
      namaSekolah: 'SMK Banjar Asri',
      namaSistem: 'UPIN',
      logoUrl: '',
      alamat: '',
      pengumuman: '',
      temaWarna: 'blue',
      tahunAjaran: '2024/2025',
      semester: 'Ganjil',
      tampilkanNilaiSiswa: true,
      updatedAt: new Date(),
    };
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
          <Settings className="w-6 h-6 text-crypto-accent" />
          Pengaturan Sistem
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Konfigurasi identitas sekolah dan pengumuman aplikasi ujian.
        </p>
      </div>

      <div className="bg-crypto-card rounded-2xl shadow-xl border border-crypto-border overflow-hidden">
        <PengaturanClient pengaturan={pengaturan} />
      </div>

      <BackupDatabaseCard />

      <div className="bg-red-500/5 rounded-2xl shadow-xl border border-red-500/20 overflow-hidden p-6 mt-8">
        <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5" />
          Zona Bahaya (Danger Zone)
        </h3>
        <p className="text-sm text-red-300/80 mb-4">
          Tindakan di bawah ini bersifat destruktif dan memengaruhi seluruh sistem yang sedang berjalan. Gunakan hanya jika Anda tahu apa yang Anda lakukan.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-red-500/10">
          <ResetSesiButton />
        </div>
      </div>
    </div>
  );
}
