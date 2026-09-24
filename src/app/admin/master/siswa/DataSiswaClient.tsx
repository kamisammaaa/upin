'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Upload, X, Download, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importSiswa, exportDataSiswa, deleteSiswaMassal, updateKelasMassal, updateRuanganMassal } from '@/app/actions/siswa';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

type Kelas = { id: number; nama: string };
type Ruangan = { id: number; nama: string };
type Siswa = {
  id: number;
  nis: string;
  nama: string;
  kelas: Kelas;
  ruangan?: { nama: string } | null;
};

export default function DataSiswaClient({ 
  siswas,
  kelass,
  ruangans = [],
  currentPage = 1,
  totalPages = 1,
  totalSiswa = 0,
  search = '',
  kelasId = '',
  ruanganId = ''
}: { 
  siswas: Siswa[];
  kelass: Kelas[];
  ruangans?: Ruangan[];
  currentPage?: number;
  totalPages?: number;
  totalSiswa?: number;
  search?: string;
  kelasId?: string;
  ruanganId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState(search);
  const [filterKelasId, setFilterKelasId] = useState<string>(kelasId);
  const [filterRuanganId, setFilterRuanganId] = useState<string>(ruanganId);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpgrading, setIsBulkUpgrading] = useState(false);
  const [bulkUpgradeKelasId, setBulkUpgradeKelasId] = useState<string>('');
  const [isBulkRoomUpdating, setIsBulkRoomUpdating] = useState(false);
  const [bulkUpgradeRuanganId, setBulkUpgradeRuanganId] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery === search) return; // avoid initial loop
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) params.set('search', searchQuery);
      else params.delete('search');
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, pathname, router, searchParams, search]);

  const handleKelasChange = (newKelasId: string) => {
    setFilterKelasId(newKelasId);
    const params = new URLSearchParams(searchParams.toString());
    if (newKelasId) params.set('kelasId', newKelasId);
    else params.delete('kelasId');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleRuanganChange = (newRuanganId: string) => {
    setFilterRuanganId(newRuanganId);
    const params = new URLSearchParams(searchParams.toString());
    if (newRuanganId) params.set('ruanganId', newRuanganId);
    else params.delete('ruanganId');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportDataSiswa(searchQuery, filterKelasId, filterRuanganId);
      if (data.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
      }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
      XLSX.writeFile(wb, 'Export_Data_Siswa.xlsx');
    } catch (err) {
      alert('Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === siswas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(siswas.map(s => s.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Yakin ingin menghapus ${selectedIds.length} siswa yang dipilih?`)) return;
    
    setIsBulkDeleting(true);
    const res = await deleteSiswaMassal(selectedIds);
    if (res.error) {
      alert(res.error);
    } else {
      alert(res.message);
      setSelectedIds([]);
      router.refresh();
    }
    setIsBulkDeleting(false);
  };

  const handleBulkUpgrade = async () => {
    if (!bulkUpgradeKelasId) {
      alert("Pilih kelas tujuan terlebih dahulu");
      return;
    }
    if (!confirm(`Yakin ingin memindahkan ${selectedIds.length} siswa ke kelas baru?`)) return;
    
    setIsBulkUpgrading(true);
    const res = await updateKelasMassal(selectedIds, parseInt(bulkUpgradeKelasId));
    if (res.error) {
      alert(res.error);
    } else {
      alert(res.message);
      setSelectedIds([]);
      setBulkUpgradeKelasId('');
      router.refresh();
    }
    setIsBulkUpgrading(false);
  };

  const handleBulkRuangan = async () => {
    if (bulkUpgradeRuanganId === '') {
      alert("Pilih ruangan tujuan terlebih dahulu");
      return;
    }
    const targetRoomName = bulkUpgradeRuanganId === 'null' ? 'Kosongkan Ruangan' : ruangans.find(r => r.id === parseInt(bulkUpgradeRuanganId))?.nama;
    if (!confirm(`Yakin ingin mengatur ruangan ${selectedIds.length} siswa ke: ${targetRoomName}?`)) return;

    setIsBulkRoomUpdating(true);
    const res = await updateRuanganMassal(
      selectedIds, 
      bulkUpgradeRuanganId === 'null' ? null : parseInt(bulkUpgradeRuanganId)
    );
    if (res.error) {
      alert(res.error);
    } else {
      alert(res.message);
      setSelectedIds([]);
      setBulkUpgradeRuanganId('');
      router.refresh();
    }
    setIsBulkRoomUpdating(false);
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
          const nis = String(row.NIS || row.nis || '').trim();
          const nama = String(row.Nama || row.nama || '').trim();
          const password = String(row.Password || row.password || '').trim();
          const kelasNama = String(row.Kelas || row.kelas || '').trim();
          const ruangNama = String(row.Ruangan || row.ruangan || row.Ruang || row.ruang || '').trim();

          if (!nis || !nama || !password || !kelasNama) {
            setImportError(`Baris ${i + 2}: Data tidak lengkap (NIS, Nama, Password, Kelas wajib diisi)`);
            setImportLoading(false);
            return;
          }

          const normalizeName = (s: string) => (s || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

          const matchedKelas = kelass.find(k => normalizeName(k.nama) === normalizeName(kelasNama));
          if (!matchedKelas) {
            setImportError(`Baris ${i + 2}: Kelas "${kelasNama}" tidak ditemukan di database.`);
            setImportLoading(false);
            return;
          }

          let ruanganId: number | null = null;
          if (ruangNama && ruangNama !== '-' && ruangNama.toLowerCase() !== 'null') {
            const matchedRuangan = ruangans.find(r => normalizeName(r.nama) === normalizeName(ruangNama));
            if (!matchedRuangan) {
              setImportError(`Baris ${i + 2}: Ruangan "${ruangNama}" tidak ditemukan di database. Pastikan ruangan telah ditambahkan pada Master Ruangan.`);
              setImportLoading(false);
              return;
            }
            ruanganId = matchedRuangan.id;
          }

          validData.push({
            nis,
            nama,
            password,
            kelasId: matchedKelas.id,
            ruanganId
          });
        }

        if (validData.length === 0) {
          setImportError('File kosong atau tidak ada data yang valid.');
          setImportLoading(false);
          return;
        }

        const res = await importSiswa(validData);
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
      { 
        NIS: '1001', 
        Nama: 'Budi Santoso', 
        Password: '123', 
        Kelas: kelass[0]?.nama || 'X TJKT 1',
        Ruangan: ruangans[0]?.nama || 'Ruang 1'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TemplateSiswa');
    XLSX.writeFile(wb, 'Template_Data_Siswa.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-crypto-accent" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Data Siswa</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Kelola data siswa yang terdaftar dalam sistem CBT.
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <Link
            href="/admin/kartu-ujian"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <Printer className="w-4 h-4" />
            Cetak Kartu Ujian
          </Link>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-crypto-accent bg-transparent border border-crypto-accent rounded-xl hover:bg-crypto-accent/10 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Proses...' : 'Export Excel'}
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-crypto-accent bg-transparent border border-crypto-accent rounded-xl hover:bg-crypto-accent/10 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <Link 
            href="/admin/master/siswa/tambah"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </Link>
        </div>
      </div>

      <div className="bg-crypto-card rounded-2xl border border-crypto-border overflow-hidden">
        <div className="p-4 border-b border-crypto-border flex flex-col sm:flex-row gap-3 bg-black/40">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Cari nama atau NIS..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-black/40 border border-crypto-border rounded-xl focus:border-crypto-accent focus:ring-1 focus:ring-crypto-accent outline-none w-full text-white placeholder-gray-500 transition-colors"
            />
          </div>
          <select
            value={filterKelasId}
            onChange={(e) => handleKelasChange(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-black/40 border border-crypto-border rounded-xl focus:border-crypto-accent focus:ring-1 focus:ring-crypto-accent outline-none text-white transition-colors"
          >
            <option value="" className="bg-crypto-bg text-white">Semua Kelas</option>
            {kelass.map(k => (
              <option key={k.id} value={k.id} className="bg-crypto-bg text-white">{k.nama}</option>
            ))}
          </select>
          <select
            value={filterRuanganId}
            onChange={(e) => handleRuanganChange(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-black/40 border border-crypto-border rounded-xl focus:border-crypto-accent focus:ring-1 focus:ring-crypto-accent outline-none text-white transition-colors"
          >
            <option value="" className="bg-crypto-bg text-white">Semua Ruangan</option>
            <option value="null" className="bg-crypto-bg text-white">-- Belum Diatur --</option>
            {ruangans.map(r => (
              <option key={r.id} value={r.id.toString()} className="bg-crypto-bg text-white">{r.nama}</option>
            ))}
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-crypto-border text-sm">
                <th className="px-4 py-3 w-12">
                  <input 
                    type="checkbox" 
                    checked={siswas.length > 0 && selectedIds.length === siswas.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-crypto-accent focus:ring-crypto-accent focus:ring-offset-gray-900"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-gray-400">No</th>
                <th className="px-4 py-3 font-semibold text-gray-400">NIS</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Nama Lengkap</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Kelas</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Ruangan</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border text-sm text-gray-300">
              {siswas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {searchQuery ? 'Data tidak ditemukan.' : 'Belum ada data siswa.'}
                  </td>
                </tr>
              ) : (
                siswas.map((s, index) => (
                  <tr key={s.id} className="hover:bg-crypto-card-hover transition-colors">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-crypto-accent focus:ring-crypto-accent focus:ring-offset-gray-900"
                      />
                    </td>
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{s.nis}</td>
                    <td className="px-4 py-3">{s.nama}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-md">
                        {s.kelas.nama}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.ruangan ? (
                        <span className="inline-block px-2.5 py-1 text-xs font-medium text-crypto-success bg-crypto-success/10 border border-crypto-success/20 rounded-md">
                          {s.ruangan.nama}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">Belum diatur</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link 
                        href={`/admin/master/siswa/${s.id}/edit`}
                        className="text-crypto-accent hover:text-crypto-accent-hover font-medium transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-crypto-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/40">
            <p className="text-sm text-gray-400">
              Menampilkan <span className="font-medium text-white">{siswas.length}</span> dari <span className="font-medium text-white">{totalSiswa}</span> data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 border border-crypto-border rounded-lg bg-crypto-bg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-300 font-medium px-2">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 border border-crypto-border rounded-lg bg-crypto-bg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#09090b] rounded-2xl border border-crypto-border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-crypto-border flex justify-between items-center bg-black/40">
              <h3 className="font-semibold text-white">Import Data Siswa</h3>
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
                Anda dapat mengimpor data siswa secara massal menggunakan file Excel (.xlsx).
              </p>
              
              <div className="p-4 bg-crypto-accent/10 border border-crypto-accent/20 rounded-xl">
                <p className="font-medium text-crypto-accent mb-2">Pastikan kolom header:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li><strong>NIS</strong> (Nomor Induk Siswa - Wajib)</li>
                  <li><strong>Nama</strong> (Nama Lengkap Siswa - Wajib)</li>
                  <li><strong>Password</strong> (Sandi Ujian - Wajib)</li>
                  <li><strong>Kelas</strong> (Persis seperti nama kelas, misal: {kelass[0]?.nama || 'X TJKT 1'} - Wajib)</li>
                  <li><strong>Ruangan</strong> (Nama ruangan ujian, misal: {ruangans[0]?.nama || 'Ruang 1'} - Opsional)</li>
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

      {/* Floating Action Bar for Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-crypto-card border border-crypto-border shadow-neon p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 text-white font-medium">
            <span className="bg-crypto-accent/20 text-crypto-accent px-2 py-0.5 rounded-md">{selectedIds.length}</span>
            <span className="hidden sm:inline">Siswa Dipilih</span>
          </div>
          
          <div className="hidden sm:block h-6 w-px bg-crypto-border"></div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-crypto-border">
              <select 
                value={bulkUpgradeKelasId}
                onChange={(e) => setBulkUpgradeKelasId(e.target.value)}
                className="bg-transparent text-sm text-white outline-none px-2 py-1 max-w-[120px] sm:max-w-none"
              >
                <option value="" className="bg-crypto-bg">Pilih Kelas Baru...</option>
                {kelass.map(k => (
                  <option key={k.id} value={k.id} className="bg-crypto-bg">{k.nama}</option>
                ))}
              </select>
              <button 
                onClick={handleBulkUpgrade}
                disabled={isBulkUpgrading || !bulkUpgradeKelasId}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {isBulkUpgrading ? 'Proses...' : 'Pindah'}
              </button>
            </div>

            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-crypto-border">
              <select 
                value={bulkUpgradeRuanganId}
                onChange={(e) => setBulkUpgradeRuanganId(e.target.value)}
                className="bg-transparent text-sm text-white outline-none px-2 py-1 max-w-[120px] sm:max-w-none"
              >
                <option value="" className="bg-crypto-bg">Atur Ruangan...</option>
                <option value="null" className="bg-crypto-bg">-- Kosongkan Ruangan --</option>
                {ruangans.map(r => (
                  <option key={r.id} value={r.id} className="bg-crypto-bg">{r.nama}</option>
                ))}
              </select>
              <button 
                onClick={handleBulkRuangan}
                disabled={isBulkRoomUpdating || !bulkUpgradeRuanganId}
                className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {isBulkRoomUpdating ? 'Proses...' : 'Atur'}
              </button>
            </div>

            <button 
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors disabled:opacity-50"
            >
              {isBulkDeleting ? 'Proses...' : 'Hapus'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
