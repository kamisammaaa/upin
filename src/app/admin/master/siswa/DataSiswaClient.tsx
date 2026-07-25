'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importSiswa } from '@/app/actions/siswa';
import { useRouter } from 'next/navigation';

type Kelas = { id: number; nama: string };
type Siswa = {
  id: number;
  nis: string;
  nama: string;
  kelas: Kelas;
  ruangan?: { nama: string } | null;
};

export default function DataSiswaClient({ 
  siswas,
  kelass
}: { 
  siswas: Siswa[];
  kelass: Kelas[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelasId, setFilterKelasId] = useState<string>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSiswas = siswas.filter(s => {
    const matchSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       s.nis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKelas = filterKelasId === '' ? true : s.kelas.id.toString() === filterKelasId;
    return matchSearch && matchKelas;
  });

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

          if (!nis || !nama || !password || !kelasNama) {
            setImportError(`Baris ${i + 2}: Data tidak lengkap (NIS, Nama, Password, Kelas wajib diisi)`);
            setImportLoading(false);
            return;
          }

          const matchedKelas = kelass.find(k => k.nama.toLowerCase() === kelasNama.toLowerCase());
          if (!matchedKelas) {
            setImportError(`Baris ${i + 2}: Kelas "${kelasNama}" tidak ditemukan di database.`);
            setImportLoading(false);
            return;
          }

          validData.push({
            nis,
            nama,
            password,
            kelasId: matchedKelas.id
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
      { NIS: '1001', Nama: 'Budi Santoso', Password: '123', Kelas: kelass[0]?.nama || 'X TJKT 1' }
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
        
        <div className="flex gap-2 w-full sm:w-auto">
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
            onChange={(e) => setFilterKelasId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-black/40 border border-crypto-border rounded-xl focus:border-crypto-accent focus:ring-1 focus:ring-crypto-accent outline-none text-white transition-colors"
          >
            <option value="" className="bg-crypto-bg text-white">Semua Kelas</option>
            {kelass.map(k => (
              <option key={k.id} value={k.id} className="bg-crypto-bg text-white">{k.nama}</option>
            ))}
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-crypto-border text-sm">
                <th className="px-4 py-3 font-semibold text-gray-400">No</th>
                <th className="px-4 py-3 font-semibold text-gray-400">NIS</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Nama Lengkap</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Kelas</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Ruangan</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border text-sm text-gray-300">
              {filteredSiswas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {searchQuery ? 'Data tidak ditemukan.' : 'Belum ada data siswa.'}
                  </td>
                </tr>
              ) : (
                filteredSiswas.map((s, index) => (
                  <tr key={s.id} className="hover:bg-crypto-card-hover transition-colors">
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
                  <li><strong>NIS</strong> (Nomor Induk Siswa)</li>
                  <li><strong>Nama</strong> (Nama Lengkap)</li>
                  <li><strong>Password</strong> (Sandi Ujian)</li>
                  <li><strong>Kelas</strong> (Persis seperti nama kelas, misal: X TJKT 1)</li>
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
