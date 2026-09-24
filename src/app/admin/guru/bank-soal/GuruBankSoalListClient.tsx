'use client';

import { BookOpen, FileQuestion, Plus, Trash2, Settings, Eye, CalendarDays, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteBankSoal } from '@/app/actions/bank-soal';
import { useState } from 'react';

export default function GuruBankSoalListClient({ bankSoals }: { bankSoals: any[] }) {
  const [items, setItems] = useState<any[]>(bankSoals);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    const bank = items.find(b => b.id === id);
    const hasJadwal = (bank?._count?.jadwals || 0) > 0;

    const confirmMsg = hasJadwal
      ? `PERINGATAN: Bank soal "${bank?.judul}" sedang digunakan pada jadwal ujian aktif. Menghapus bank soal ini juga akan menghapus jadwal ujian terkait serta sesi ujian siswa di dalamnya.\n\nApakah Anda yakin ingin melanjutkan?`
      : `Apakah Anda yakin ingin menghapus bank soal "${bank?.judul}" beserta seluruh butir soal di dalamnya?`;

    if (!confirm(confirmMsg)) return;

    setLoadingId(id);
    const res = await deleteBankSoal(id);
    setLoadingId(null);

    if (res.success) {
      setItems(prev => prev.filter(b => b.id !== id));
      alert(res.message || 'Bank soal berhasil dihapus.');
      router.refresh();
    } else {
      alert(res.error || res.message || 'Gagal menghapus bank soal.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <BookOpen className="w-6 h-6 text-crypto-accent" />
            Bank Soal Saya
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Daftar paket bank soal yang Anda kelola dan susun butir soalnya.
          </p>
        </div>

        <Link 
          href="/admin/guru/bank-soal/tambah"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Bank Soal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((bank) => (
          <div key={bank.id} className="bg-crypto-card p-6 rounded-2xl border border-crypto-border transition-all hover:bg-crypto-card-hover hover:-translate-y-1 hover:neon-accent flex flex-col h-full group">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 text-xs font-semibold text-crypto-accent bg-crypto-accent/10 rounded-full border border-crypto-accent/20">
                {bank.mapel?.nama || 'Mata Pelajaran'}
              </span>
              <span className="text-xs text-gray-500 font-medium group-hover:text-gray-400 transition-colors">
                {new Date(bank.createdAt).toLocaleDateString('id-ID')}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-4 leading-tight group-hover:text-crypto-accent transition-colors">
              {bank.judul}
            </h3>

            <div className="flex items-center justify-between pt-4 border-t border-crypto-border mb-4 mt-auto">
              <div className="flex items-center gap-1.5 text-crypto-success bg-crypto-success/10 px-2.5 py-1 rounded-md border border-crypto-success/20">
                <FileQuestion className="w-4 h-4" />
                <span className="text-sm font-semibold">{bank._count?.soals || 0} Butir Soal</span>
              </div>
              {(bank._count?.jadwals || 0) > 0 && (
                <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-md border border-yellow-500/20 text-xs font-semibold" title="Sedang digunakan dalam jadwal ujian">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{bank._count.jadwals} Jadwal</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto">
              <Link 
                href={`/admin/guru/bank-soal/${bank.id}`}
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold text-white bg-crypto-accent/20 border border-crypto-accent/30 rounded-xl hover:bg-crypto-accent hover:text-white transition-all hover:neon-accent"
              >
                <Settings className="w-3.5 h-3.5" />
                Kelola
              </Link>
              <Link 
                href={`/admin/guru/bank-soal/${bank.id}/preview`}
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </Link>
              <Link 
                href={`/admin/guru/bank-soal/${bank.id}/edit`}
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500 hover:text-black transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Link>
              <button
                onClick={() => handleDelete(bank.id)}
                disabled={loadingId === bank.id}
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {loadingId === bank.id ? 'Hapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-crypto-card rounded-2xl border border-dashed border-crypto-border">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="font-medium text-gray-400">Belum ada bank soal</p>
            <p className="text-sm mt-1">Silakan klik "Tambah Bank Soal" untuk membuat paket soal baru.</p>
          </div>
        )}
      </div>
    </div>
  );
}
