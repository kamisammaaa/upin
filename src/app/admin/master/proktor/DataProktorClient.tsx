'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Trash2, Edit, ChevronLeft, ChevronRight, Download, Upload, X } from 'lucide-react';
import { deleteProktor, deleteProktorMassal, exportDataProktor, importProktor } from '@/app/actions/proktor';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

type Proktor = {
  id: number;
  username: string;
  nama: string;
};

export default function DataProktorClient({ 
  initialProktors,
  total,
  search,
  page,
  perPage
}: { 
  initialProktors: Proktor[];
  total: number;
  search: string;
  page: number;
  perPage: number;
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(search);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(total / perPage);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput === search) return;
      const params = new URLSearchParams();
      if (searchInput) params.set('search', searchInput);
      params.set('page', '1');
      router.push(`/admin/master/proktor?${params.toString()}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, router, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    params.set('page', '1');
    router.push(`/admin/master/proktor?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    params.set('page', newPage.toString());
    router.push(`/admin/master/proktor?${params.toString()}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus proktor ini?')) return;
    
    setIsDeleting(id);
    const res = await deleteProktor(id);
    if (res.error) {
      alert(res.error);
    } else {
      router.refresh();
    }
    setIsDeleting(null);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Yakin ingin menghapus ${selectedIds.length} proktor yang dipilih?`)) return;
    
    setIsBulkDeleting(true);
    const res = await deleteProktorMassal(selectedIds);
    if (res.error) {
      alert(res.error);
    } else {
      alert(res.message);
      setSelectedIds([]);
      router.refresh();
    }
    setIsBulkDeleting(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === initialProktors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(initialProktors.map(p => p.id));
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportDataProktor(searchInput);
      if (data.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
      }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Proktor');
      XLSX.writeFile(wb, 'Export_Data_Proktor.xlsx');
    } catch (err) {
      alert('Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        const validData = [];
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const username = String(row.Username || row.username || '').trim();
          const nama = String(row.Nama_Lengkap || row.Nama || row.nama || '').trim();
          const password = String(row.Password || row.password || '').trim();

          if (!username || !nama) {
            setImportError(`Baris ${i + 2}: Data tidak lengkap (Username, Nama wajib diisi)`);
            setImportLoading(false);
            return;
          }

          validData.push({
            username,
            nama,
            password: password || username
          });
        }

        if (validData.length === 0) {
          setImportError('File kosong atau tidak ada data yang valid.');
          setImportLoading(false);
          return;
        }

        const res = await importProktor(validData);
        if (res.error) {
          setImportError(res.error);
        } else {
          setIsImportModalOpen(false);
          router.refresh();
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

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Username: 'proktor01', Nama_Lengkap: 'Budi Proktor', Password: '123' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TemplateProktor');
    XLSX.writeFile(wb, 'Template_Data_Proktor.xlsx');
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center bg-crypto-card p-4 rounded-2xl border border-crypto-border shadow-sm">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Cari nama atau username..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-crypto-border rounded-xl text-white focus:outline-none focus:border-crypto-accent transition-colors"
          />
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
        </form>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-crypto-accent bg-transparent border border-crypto-accent rounded-xl hover:bg-crypto-accent/10 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isExporting ? 'Proses...' : 'Export Excel'}</span>
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-crypto-accent bg-transparent border border-crypto-accent rounded-xl hover:bg-crypto-accent/10 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import Excel</span>
          </button>
          <Link 
            href="/admin/master/proktor/tambah"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Proktor</span>
          </Link>
        </div>
      </div>

      <div className="bg-crypto-card rounded-2xl shadow-sm border border-crypto-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-crypto-border text-sm">
                <th className="px-4 py-3 w-12">
                  <input 
                    type="checkbox" 
                    checked={initialProktors.length > 0 && selectedIds.length === initialProktors.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-crypto-accent focus:ring-crypto-accent focus:ring-offset-gray-900"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-gray-400 w-16">No</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Username</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Nama Lengkap</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border text-sm text-gray-300">
              {initialProktors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {search ? 'Data tidak ditemukan.' : 'Belum ada data proktor.'}
                  </td>
                </tr>
              ) : (
                initialProktors.map((p, index) => (
                  <tr key={p.id} className="hover:bg-crypto-card-hover transition-colors">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-crypto-accent focus:ring-crypto-accent focus:ring-offset-gray-900"
                      />
                    </td>
                    <td className="px-4 py-3">{(page - 1) * perPage + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{p.username}</td>
                    <td className="px-4 py-3">{p.nama}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/master/proktor/${p.id}/edit`}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={isDeleting === p.id}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-crypto-border flex items-center justify-between bg-black/20">
            <div className="text-sm text-gray-400">
              Menampilkan {((page - 1) * perPage) + 1} - {Math.min(page * perPage, total)} dari {total} data
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-xl bg-crypto-card border border-crypto-border text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-4 py-2 rounded-xl bg-crypto-card border border-crypto-border text-sm font-medium text-white">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-xl bg-crypto-card border border-crypto-border text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar for Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-crypto-card border border-crypto-border shadow-neon p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 text-white font-medium">
            <span className="bg-crypto-accent/20 text-crypto-accent px-2 py-0.5 rounded-md">{selectedIds.length}</span>
            <span className="hidden sm:inline">Proktor Dipilih</span>
          </div>
          <div className="hidden sm:block h-6 w-px bg-crypto-border"></div>
          <button 
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isBulkDeleting ? 'Menghapus...' : 'Hapus Terpilih'}
          </button>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#09090b] rounded-2xl border border-crypto-border shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-crypto-border flex justify-between items-center bg-black/40">
              <h3 className="font-semibold text-white">Import Data Proktor</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm text-gray-300">
              {importError && (
                <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl">
                  {importError}
                </div>
              )}
              
              <p>
                Anda dapat mengimpor data proktor massal menggunakan file Excel (.xlsx). Jika Username sudah ada, data akan di-update.
              </p>
              
              <div className="p-4 bg-crypto-accent/10 border border-crypto-accent/20 rounded-xl">
                <p className="font-medium text-crypto-accent mb-2">Pastikan kolom header:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li><strong>Username</strong> (Wajib unik)</li>
                  <li><strong>Nama_Lengkap</strong></li>
                  <li><strong>Password</strong> (Opsional, jika kosong = Username)</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={downloadTemplate}
                  className="w-full px-4 py-2.5 text-crypto-accent bg-transparent border border-crypto-accent rounded-xl hover:bg-crypto-accent/10 font-medium transition-colors"
                >
                  Download Template Excel
                </button>

                <label className={`w-full flex items-center justify-center px-4 py-2.5 font-medium text-white bg-crypto-accent rounded-xl transition-all cursor-pointer ${importLoading ? 'opacity-70' : 'hover:bg-crypto-accent-hover hover:neon-accent'}`}>
                  <Upload className="w-4 h-4 mr-2" />
                  {importLoading ? 'Memproses...' : 'Pilih File & Import'}
                  <input 
                    type="file" 
                    accept=".xlsx,.xls" 
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
    </div>
  );
}
