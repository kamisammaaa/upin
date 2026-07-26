'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Trash2, Edit, ChevronLeft, ChevronRight, CheckSquare, Download, Upload, X } from 'lucide-react';
import { deleteGuru, deleteGuruMassal, exportDataGuru, importGuru } from '@/app/actions/guru';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

type Guru = {
  id: number;
  username: string;
  nama: string;
  _count: { bankSoals: number };
};

export default function DataGuruClient({ 
  gurus, 
  currentPage,
  totalPages,
  totalGuru,
  search
}: { 
  gurus: Guru[];
  currentPage: number;
  totalPages: number;
  totalGuru: number;
  search: string;
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput === search) return;
      const params = new URLSearchParams();
      if (searchInput) params.set('search', searchInput);
      params.set('page', '1');
      router.push(`/admin/master/guru?${params.toString()}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, router, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    router.push(`/admin/master/guru?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', newPage.toString());
    router.push(`/admin/master/guru?${params.toString()}`);
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus guru ${nama}?`)) return;
    
    setIsDeleting(id);
    const res = await deleteGuru(id);
    
    if (res.error) {
      alert(res.error);
    } else {
      router.refresh();
      setSelectedIds(prev => prev.filter(selId => selId !== id));
    }
    setIsDeleting(null);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Yakin ingin menghapus ${selectedIds.length} guru yang dipilih? Guru yang memiliki bank soal tidak akan dihapus.`)) return;
    
    setIsBulkDeleting(true);
    const res = await deleteGuruMassal(selectedIds);
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
    if (selectedIds.length === gurus.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(gurus.map(g => g.id));
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportDataGuru(searchInput);
      if (data.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
      }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Guru');
      XLSX.writeFile(wb, 'Export_Data_Guru.xlsx');
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
          const username = String(row.NIP_Username || row.Username || row.username || '').trim();
          const nama = String(row.Nama_Lengkap || row.Nama || row.nama || '').trim();
          const password = String(row.Password || row.password || '').trim();

          if (!username || !nama) {
            setImportError(`Baris ${i + 2}: Data tidak lengkap (NIP/Username, Nama wajib diisi)`);
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

        const res = await importGuru(validData);
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
      { NIP_Username: '198001012005011001', Nama_Lengkap: 'Budi Santoso, S.Pd', Password: '123' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TemplateGuru');
    XLSX.writeFile(wb, 'Template_Data_Guru.xlsx');
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-crypto-accent" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Data Guru</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Total {totalGuru} guru terdaftar.
          </p>
        </div>
        
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
            href="/admin/master/guru/tambah"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Guru</span>
          </Link>
        </div>
      </div>

      <div className="bg-crypto-card rounded-2xl border border-crypto-border overflow-hidden">
        <div className="p-4 border-b border-crypto-border bg-black/40 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearch} className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Cari nama atau NIP..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-black/40 border border-crypto-border rounded-xl focus:border-crypto-accent focus:ring-1 focus:ring-crypto-accent outline-none w-full text-white placeholder-gray-500 transition-colors"
            />
            <button type="submit" className="hidden">Search</button>
          </form>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-crypto-border text-sm">
                <th className="px-4 py-3 w-12">
                  <input 
                    type="checkbox" 
                    checked={gurus.length > 0 && selectedIds.length === gurus.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-crypto-accent focus:ring-crypto-accent focus:ring-offset-gray-900"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-gray-400">Nama Lengkap</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Username/NIP</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Bank Soal</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border text-sm text-gray-300">
              {gurus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {search ? 'Data tidak ditemukan.' : 'Belum ada data guru.'}
                  </td>
                </tr>
              ) : (
                gurus.map((g) => (
                  <tr key={g.id} className="hover:bg-crypto-card-hover transition-colors">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(g.id)}
                        onChange={() => toggleSelect(g.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-crypto-accent focus:ring-crypto-accent focus:ring-offset-gray-900"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{g.nama}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-md">
                        {g.username}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {g._count.bankSoals} Soal
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link 
                        href={`/admin/master/guru/${g.id}/edit`}
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Link>
                      
                      <button 
                        onClick={() => handleDelete(g.id, g.nama)}
                        disabled={isDeleting === g.id || g._count.bankSoals > 0}
                        className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={g._count.bankSoals > 0 ? "Tidak bisa dihapus karena memiliki Bank Soal" : "Hapus Guru"}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {isDeleting === g.id ? 'Loading...' : 'Hapus'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-crypto-border flex items-center justify-between bg-black/40">
            <p className="text-sm text-gray-400">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-crypto-border bg-crypto-card text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-crypto-border bg-crypto-card text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar for Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:ml-32 bg-crypto-card border border-crypto-border shadow-neon p-4 rounded-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 text-white font-medium">
            <CheckSquare className="w-5 h-5 text-crypto-accent" />
            <span>{selectedIds.length} Guru Dipilih</span>
          </div>
          <div className="h-6 w-px bg-crypto-border"></div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isBulkDeleting ? 'Menghapus...' : 'Hapus Massal'}
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#09090b] rounded-2xl border border-crypto-border shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-crypto-border flex justify-between items-center bg-black/40">
              <h3 className="font-semibold text-white">Import Data Guru</h3>
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
                Anda dapat mengimpor data guru secara massal menggunakan file Excel (.xlsx). Jika Username/NIP sudah ada, data akan di-update.
              </p>
              
              <div className="p-4 bg-crypto-accent/10 border border-crypto-accent/20 rounded-xl">
                <p className="font-medium text-crypto-accent mb-2">Pastikan kolom header:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li><strong>NIP_Username</strong> (Wajib unik)</li>
                  <li><strong>Nama_Lengkap</strong></li>
                  <li><strong>Password</strong> (Opsional, jika kosong = NIP)</li>
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
