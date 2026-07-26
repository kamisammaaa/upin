'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Trash2, Edit, Users, KeyRound } from 'lucide-react';
import { deleteRuangan } from '@/app/actions/ruangan';
import { useRouter } from 'next/navigation';

type Ruangan = {
  id: number;
  nama: string;
  kapasitas: number;
  token: string | null;
  _count: { siswas: number };
};

export default function DataRuanganClient({ ruangans }: { ruangans: Ruangan[] }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus ruangan "${nama}"?`)) return;
    setIsDeleting(id);
    const res = await deleteRuangan(id);
    if (res.error) alert(res.error);
    else router.refresh();
    setIsDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-crypto-accent" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Data Ruangan Ujian</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Kelola ruangan ujian beserta kapasitasnya. Token dikelola oleh Proktor.
          </p>
        </div>
        <Link
          href="/admin/master/ruangan/tambah"
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Ruangan
        </Link>
      </div>

      {ruangans.length === 0 ? (
        <div className="bg-crypto-card rounded-2xl border border-crypto-border p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Belum ada data ruangan</p>
          <p className="text-gray-500 text-sm mt-1">Tambahkan ruangan ujian untuk memulai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ruangans.map((r) => (
            <div
              key={r.id}
              className="bg-crypto-card rounded-2xl border border-crypto-border p-5 flex flex-col gap-4 hover:bg-crypto-card-hover hover:-translate-y-1 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{r.nama}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">Kapasitas: {r.kapasitas} kursi</p>
                </div>
                <Building2 className="w-8 h-8 text-crypto-accent opacity-40" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 rounded-xl p-3 border border-crypto-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Siswa</p>
                  </div>
                  <p className="text-lg font-bold text-white">{r._count.siswas}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-3 border border-crypto-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <KeyRound className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Token</p>
                  </div>
                  <p className="text-sm font-mono font-bold text-crypto-accent">
                    {r.token || '—'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-crypto-border">
                <Link
                  href={`/admin/master/ruangan/${r.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(r.id, r.nama)}
                  disabled={isDeleting === r.id || r._count.siswas > 0}
                  title={r._count.siswas > 0 ? 'Masih ada siswa terdaftar' : 'Hapus Ruangan'}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting === r.id ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
