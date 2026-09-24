'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Trash2, Edit, Users, KeyRound, X, ExternalLink, Search } from 'lucide-react';
import { deleteRuangan } from '@/app/actions/ruangan';
import { useRouter } from 'next/navigation';

type SiswaInfo = {
  id: number;
  nis: string;
  nama: string;
  kelas: { nama: string };
};

type Ruangan = {
  id: number;
  nama: string;
  kapasitas: number;
  token: string | null;
  _count: { siswas: number };
  siswas?: SiswaInfo[];
};

export default function DataRuanganClient({ ruangans }: { ruangans: Ruangan[] }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [activeRuangan, setActiveRuangan] = useState<Ruangan | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus ruangan "${nama}"?`)) return;
    setIsDeleting(id);
    const res = await deleteRuangan(id);
    if (res.error) alert(res.error);
    else router.refresh();
    setIsDeleting(null);
  };

  const filteredModalSiswas = (activeRuangan?.siswas || []).filter(
    (s) =>
      s.nama.toLowerCase().includes(modalSearch.toLowerCase()) ||
      s.nis.toLowerCase().includes(modalSearch.toLowerCase()) ||
      s.kelas.nama.toLowerCase().includes(modalSearch.toLowerCase())
  );

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
                <button
                  type="button"
                  onClick={() => {
                    setActiveRuangan(r);
                    setModalSearch('');
                  }}
                  className="bg-black/40 rounded-xl p-3 border border-crypto-border text-left hover:border-crypto-accent/50 hover:bg-crypto-accent/5 transition-all group/box cursor-pointer"
                  title="Klik untuk melihat daftar siswa di ruangan ini"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-500 group-hover/box:text-crypto-accent transition-colors" />
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Siswa</p>
                    </div>
                    <span className="text-[10px] text-crypto-accent opacity-0 group-hover/box:opacity-100 transition-opacity font-medium">
                      Lihat &rarr;
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white group-hover/box:text-crypto-accent transition-colors">
                    {r._count.siswas}
                  </p>
                </button>
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

      {/* Modal Siswa di Ruangan */}
      {activeRuangan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-crypto-card border border-crypto-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-crypto-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-crypto-accent/10 border border-crypto-accent/20 text-crypto-accent">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Daftar Siswa &bull; {activeRuangan.nama}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Total {activeRuangan._count.siswas} siswa terdaftar di ruangan ini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRuangan(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls */}
            <div className="p-4 border-b border-crypto-border bg-black/20 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Cari siswa di ruangan ini..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-black/40 border border-crypto-border rounded-xl text-white placeholder-gray-500 focus:border-crypto-accent focus:ring-1 focus:ring-crypto-accent outline-none"
                />
              </div>
              <Link
                href={`/admin/master/siswa?ruanganId=${activeRuangan.id}`}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-xl hover:bg-crypto-accent/20 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Kelola di Data Siswa
              </Link>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {filteredModalSiswas.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Users className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm">
                    {modalSearch
                      ? 'Tidak ada siswa yang cocok dengan pencarian.'
                      : 'Belum ada siswa yang terdaftar di ruangan ini.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-crypto-border text-xs uppercase text-gray-400">
                      <th className="pb-2.5 font-semibold w-12">No</th>
                      <th className="pb-2.5 font-semibold">NIS</th>
                      <th className="pb-2.5 font-semibold">Nama Siswa</th>
                      <th className="pb-2.5 font-semibold">Kelas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-crypto-border/50 text-sm">
                    {filteredModalSiswas.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 text-gray-500 font-medium">{idx + 1}</td>
                        <td className="py-2.5 font-mono text-crypto-accent font-semibold">{s.nis}</td>
                        <td className="py-2.5 text-white font-medium">{s.nama}</td>
                        <td className="py-2.5 text-gray-400">{s.kelas?.nama || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-crypto-border bg-black/40 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveRuangan(null)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-crypto-card border border-crypto-border rounded-xl hover:bg-crypto-card-hover hover:text-white transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
