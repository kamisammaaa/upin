'use client';

import { useState } from 'react';
import { createMapel, updateMapel, deleteMapel } from '@/app/actions/mapel';
import { PlusCircle, Search, Edit2, Trash2, LibraryBig, X } from 'lucide-react';

type Mapel = {
  id: number;
  nama: string;
};

export default function MapelClient({ initialData }: { initialData: Mapel[] }) {
  const [data, setData] = useState<Mapel[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedMapel, setSelectedMapel] = useState<Mapel | null>(null);
  const [loading, setLoading] = useState(false);

  // Search filter
  const filteredData = data.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedMapel(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mapel: Mapel) => {
    setModalMode('edit');
    setSelectedMapel(mapel);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMapel(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let res;
    if (modalMode === 'create') {
      res = await createMapel(formData);
    } else {
      res = await updateMapel(selectedMapel!.id, formData);
    }

    if (res.success) {
      alert(res.message);
      window.location.reload(); 
    } else {
      alert(res.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus mata pelajaran ini? Semua soal yang terkait mungkin akan terpengaruh.')) {
      const res = await deleteMapel(id);
      if (res.success) {
        alert(res.message);
        setData(data.filter(m => m.id !== id));
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <LibraryBig className="w-6 h-6 text-crypto-accent" />
            Data Mata Pelajaran
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Kelola daftar mata pelajaran yang tersedia di sistem.
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Tambah Mapel
        </button>
      </div>

      <div className="bg-crypto-card rounded-2xl border border-crypto-border overflow-hidden">
        <div className="p-4 border-b border-crypto-border flex items-center justify-between bg-black/40">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Cari mata pelajaran..."
              className="block w-full pl-10 pr-4 py-2 text-sm bg-black/40 border border-crypto-border rounded-xl focus:border-crypto-accent focus:ring-1 focus:ring-crypto-accent outline-none text-white placeholder-gray-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-sm text-gray-400 hidden sm:block">Total: {filteredData.length} data</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-crypto-border text-sm">
                <th className="px-6 py-4 font-semibold text-gray-400 w-16">No</th>
                <th className="px-6 py-4 font-semibold text-gray-400">Nama Mata Pelajaran</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border text-sm">
              {filteredData.length > 0 ? (
                filteredData.map((mapel, index) => (
                  <tr key={mapel.id} className="hover:bg-crypto-card-hover transition-colors">
                    <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 text-white font-medium">{mapel.nama}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => openEditModal(mapel)}
                        className="p-2 text-crypto-accent bg-crypto-accent/10 rounded-lg hover:bg-crypto-accent/20 transition-colors border border-crypto-accent/20"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(mapel.id)}
                        className="p-2 text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-400 bg-black/40">
                    Tidak ada data mata pelajaran ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#09090b] rounded-2xl border border-crypto-border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-crypto-border flex justify-between items-center bg-black/40">
              <h3 className="font-semibold text-white">
                {modalMode === 'create' ? 'Tambah Mata Pelajaran' : 'Edit Mata Pelajaran'}
              </h3>
              <button 
                type="button" 
                onClick={closeModal} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  name="nama"
                  required
                  defaultValue={selectedMapel?.nama || ''}
                  className="w-full px-4 py-2 text-sm bg-black/40 border border-crypto-border rounded-xl focus:border-crypto-accent focus:ring-1 focus:ring-crypto-accent outline-none text-white transition-colors"
                  placeholder="Contoh: Matematika, Bahasa Indonesia"
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-crypto-card border border-crypto-border rounded-xl hover:bg-crypto-card-hover hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-crypto-accent hover:bg-crypto-accent-hover rounded-xl disabled:opacity-50 transition-all hover:neon-accent"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
