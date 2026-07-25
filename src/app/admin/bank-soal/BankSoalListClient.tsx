'use client';

import { BookOpen, FileQuestion, Plus, Trash2, Edit3, Settings } from 'lucide-react';
import Link from 'next/link';
import { deleteBankSoal } from '@/app/actions/bank-soal';
import { useState } from 'react';

export default function BankSoalListClient({ bankSoals }: { bankSoals: any[] }) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus bank soal ini beserta seluruh soal di dalamnya?')) {
      setLoadingId(id);
      await deleteBankSoal(id);
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <BookOpen className="w-6 h-6 text-crypto-accent" />
            Bank Soal
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Daftar paket soal yang telah disusun oleh para guru dan admin.
          </p>
        </div>
        
        <Link 
          href="/admin/bank-soal/tambah"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent"
        >
          <Plus className="w-4 h-4" />
          Tambah Bank Soal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bankSoals.map((bank) => (
          <div key={bank.id} className="bg-crypto-card p-6 rounded-2xl border border-crypto-border transition-all hover:bg-crypto-card-hover hover:-translate-y-1 hover:neon-accent flex flex-col h-full group">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 text-xs font-semibold text-crypto-accent bg-crypto-accent/10 rounded-full border border-crypto-accent/20">
                {bank.mapel.nama}
              </span>
              <span className="text-xs text-gray-500 font-medium group-hover:text-gray-400 transition-colors">
                {new Date(bank.createdAt).toLocaleDateString('id-ID')}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-crypto-accent transition-colors">
              {bank.judul}
            </h3>
            
            <p className="text-sm text-gray-400 mb-6 flex items-center gap-2 flex-grow">
              <span className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-bold text-crypto-accent border border-crypto-border">
                {bank.guru.nama.charAt(0)}
              </span>
              <span>Oleh: <span className="font-medium text-gray-300">{bank.guru.nama}</span></span>
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-crypto-border mb-4">
              <div className="flex items-center gap-1.5 text-crypto-success bg-crypto-success/10 px-2.5 py-1 rounded-md border border-crypto-success/20">
                <FileQuestion className="w-4 h-4" />
                <span className="text-sm font-semibold">{bank._count.soals} Soal</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              <Link 
                href={`/admin/bank-soal/${bank.id}`}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-crypto-accent/20 border border-crypto-accent/30 rounded-xl hover:bg-crypto-accent hover:text-white transition-all hover:neon-accent"
              >
                <Settings className="w-3.5 h-3.5" />
                Kelola Soal
              </Link>
              <button
                onClick={() => handleDelete(bank.id)}
                disabled={loadingId === bank.id}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {loadingId === bank.id ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        ))}
        
        {bankSoals.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-crypto-card rounded-2xl border border-dashed border-crypto-border">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="font-medium text-gray-400">Belum ada bank soal</p>
            <p className="text-sm mt-1">Silakan tambahkan bank soal pertama Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
