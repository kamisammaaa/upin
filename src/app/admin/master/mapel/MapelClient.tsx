'use client';

import { useState, useRef } from 'react';
import { createMapel, updateMapel, deleteMapel, deleteManyMapel, importMapel, exportDataMapel } from '@/app/actions/mapel';
import { PlusCircle, Search, Edit2, Trash2, LibraryBig, X, Download, Upload, FileSpreadsheet, CheckSquare } from 'lucide-react';
import * as XLSX from 'xlsx';

type Mapel = {
  id: number;
  nama: string;
};

export default function MapelClient({ initialData }: { initialData: Mapel[] }) {
  const [data, setData] = useState<Mapel[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection state for bulk delete
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedMapel, setSelectedMapel] = useState<Mapel | null>(null);
  const [loading, setLoading] = useState(false);

  // Import / Export state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search filter
  const filteredData = data.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredData.map(m => m.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} mata pelajaran yang dipilih?`)) return;

    setIsBulkDeleting(true);
    const res = await deleteManyMapel(selectedIds);
    if (res.success) {
      alert(res.message);
      if (res.deletedIds && res.deletedIds.length > 0) {
        setData(prev => prev.filter(m => !res.deletedIds.includes(m.id)));
        setSelectedIds(prev => prev.filter(id => !res.deletedIds.includes(id)));
      } else {
        setSelectedIds([]);
      }
    } else {
      alert(res.message);
    }
    setIsBulkDeleting(false);
  };

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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const exportData = await exportDataMapel();
      if (exportData.length === 0) {
        alert('Tidak ada data mata pelajaran untuk diekspor.');
        return;
      }
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Mapel');
      XLSX.writeFile(wb, 'Data_Mata_Pelajaran.xlsx');
    } catch (err) {
      alert('Gagal mengekspor data mata pelajaran.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Nama_Mata_Pelajaran: 'Matematika' },
      { Nama_Mata_Pelajaran: 'Bahasa Indonesia' },
      { Nama_Mata_Pelajaran: 'Bahasa Inggris' },
      { Nama_Mata_Pelajaran: 'Pendidikan Agama Islam' },
      { Nama_Mata_Pelajaran: 'Informatika' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TemplateMapel');
    XLSX.writeFile(wb, 'Template_Mata_Pelajaran.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        const validData: { nama: string }[] = [];
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const nama = String(
            row.Nama_Mata_Pelajaran ||
            row['Nama Mata Pelajaran'] ||
            row.Nama_Mapel ||
            row['Nama Mapel'] ||
            row.Mata_Pelajaran ||
            row['Mata Pelajaran'] ||
            row.Mapel ||
            row.mapel ||
            row.Nama ||
            row.nama ||
            ''
          ).trim();

          if (nama) {
            validData.push({ nama });
          }
        }

        if (validData.length === 0) {
          setImportError('File kosong atau tidak ada kolom Nama Mata Pelajaran yang valid.');
          setImportLoading(false);
          return;
        }

        const res = await importMapel(validData);
        if (!res.success) {
          setImportError(res.message);
        } else {
          alert(res.message);
          setIsImportModalOpen(false);
          window.location.reload();
        }
      } catch (err) {
        setImportError('Terjadi kesalahan saat membaca file Excel.');
      } finally {
        setImportLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
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
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-crypto-accent bg-transparent border border-crypto-accent/40 rounded-xl hover:bg-crypto-accent/10 transition-colors disabled:opacity-50 shadow-sm"
            title="Export ke Excel"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export Excel'}</span>
          </button>
          
          <button 
            onClick={() => {
              setImportError('');
              setIsImportModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-crypto-accent bg-transparent border border-crypto-accent/40 rounded-xl hover:bg-crypto-accent/10 transition-colors shadow-sm"
            title="Import dari Excel"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>

          <button 
            onClick={openCreateModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition shadow-sm hover:neon-accent"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Mapel</span>
          </button>
        </div>
      </div>

      <div className="bg-crypto-card rounded-2xl border border-crypto-border overflow-hidden">
        <div className="p-4 border-b border-crypto-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/40">
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
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {selectedIds.length} Terpilih</span>
              </button>
            )}
            <span className="text-sm text-gray-400">Total: {filteredData.length} data</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-crypto-border text-sm">
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredData.length > 0 && filteredData.every(m => selectedIds.includes(m.id))}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-crypto-accent focus:ring-crypto-accent focus:ring-offset-gray-900 cursor-pointer"
                    title="Pilih Semua"
                  />
                </th>
                <th className="px-4 py-4 font-semibold text-gray-400 w-16">No</th>
                <th className="px-6 py-4 font-semibold text-gray-400">Nama Mata Pelajaran</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border text-sm">
              {filteredData.length > 0 ? (
                filteredData.map((mapel, index) => (
                  <tr 
                    key={mapel.id} 
                    className={`transition-colors ${selectedIds.includes(mapel.id) ? 'bg-crypto-accent/5 hover:bg-crypto-accent/10' : 'hover:bg-crypto-card-hover'}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(mapel.id)}
                        onChange={() => toggleSelect(mapel.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-crypto-accent focus:ring-crypto-accent focus:ring-offset-gray-900 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 text-gray-400">{index + 1}</td>
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
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400 bg-black/40">
                    Tidak ada data mata pelajaran ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] rounded-2xl border border-crypto-border shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-crypto-border flex justify-between items-center bg-black/40">
              <h3 className="font-semibold text-white">
                {modalMode === 'create' ? 'Tambah Mata Pelajaran' : 'Edit Mata Pelajaran'}
              </h3>
              <button 
                type="button" 
                onClick={closeModal} 
                className="text-gray-400 hover:text-white transition-colors"
                title="Tutup"
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
                  autoFocus
                />
              </div>

              {modalMode === 'create' && (
                <div className="pt-2 border-t border-crypto-border flex items-center justify-between text-xs text-gray-400">
                  <span>Ingin tambah banyak mapel sekaligus?</span>
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      setImportError('');
                      setIsImportModalOpen(true);
                    }}
                    className="text-crypto-accent hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import dari Excel
                  </button>
                </div>
              )}

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

      {/* Modal Import Data Mapel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] rounded-2xl border border-crypto-border shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-crypto-border flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-2 font-semibold text-white">
                <FileSpreadsheet className="w-5 h-5 text-crypto-accent" />
                <span>Import Data Mata Pelajaran</span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsImportModalOpen(false)} 
                className="text-gray-400 hover:text-white transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm text-gray-300">
              {importError && (
                <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs">
                  {importError}
                </div>
              )}
              
              <p className="leading-relaxed text-xs text-gray-300">
                Unggah file Excel (.xlsx / .xls) untuk menambahkan data mata pelajaran secara massal. Jika nama mata pelajaran sudah ada di sistem, data akan otomatis dilewati agar tidak duplikat.
              </p>
              
              <div className="p-4 bg-crypto-accent/10 border border-crypto-accent/20 rounded-xl space-y-1.5">
                <p className="font-semibold text-crypto-accent text-xs">Format Kolom Header Excel:</p>
                <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                  <li><strong>Nama_Mata_Pelajaran</strong> (atau <code>Nama</code> / <code>Mapel</code>)</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  type="button"
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/30 rounded-xl hover:bg-crypto-accent/20 font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Template Excel (.xlsx)
                </button>

                <label className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-crypto-accent rounded-xl transition-all cursor-pointer shadow-lg ${importLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-crypto-accent-hover hover:neon-accent'}`}>
                  <Upload className="w-4 h-4" />
                  <span>{importLoading ? 'Memproses Import...' : 'Pilih File & Import Excel'}</span>
                  <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    disabled={importLoading}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar untuk Hapus Massal */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-crypto-card border border-crypto-border shadow-[0_0_30px_rgba(0,0,0,0.8)] p-3.5 sm:p-4 rounded-2xl flex items-center gap-4 sm:gap-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <span className="bg-crypto-accent/20 text-crypto-accent px-2.5 py-0.5 rounded-lg font-bold">
              {selectedIds.length}
            </span>
            <span className="hidden sm:inline">Mata Pelajaran Dipilih</span>
            <span className="sm:hidden">Dipilih</span>
          </div>
          
          <div className="h-6 w-px bg-crypto-border hidden sm:block"></div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg transition-colors border border-crypto-border/50 cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-lg hover:shadow-red-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isBulkDeleting ? 'Menghapus...' : `Hapus (${selectedIds.length})`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
