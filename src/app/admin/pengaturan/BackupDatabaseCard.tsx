'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  HardDrive, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileArchive,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { 
  getDatabaseBackupInfo, 
  createLocalBackupSnapshot, 
  deleteLocalBackupSnapshot,
  type DatabaseStatusInfo 
} from '@/app/actions/server-backup';

export default function BackupDatabaseCard() {
  const [info, setInfo] = useState<DatabaseStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const data = await getDatabaseBackupInfo();
      setInfo(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const handleDownloadDirect = async () => {
    setIsDownloading(true);
    setMsg(null);
    try {
      // Buka endpoint unduh langsung di browser
      const link = document.createElement('a');
      link.href = '/api/admin/backup/database';
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMsg({ type: 'success', text: 'Permintaan unduhan database sedang diproses browser.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Gagal mengunduh database: ' + err?.message });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setIsCreating(true);
    setMsg(null);
    try {
      const res = await createLocalBackupSnapshot();
      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        await fetchInfo();
      } else {
        setMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Gagal membuat snapshot: ' + err?.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus file backup "${filename}" dari server?`)) return;
    setDeletingFile(filename);
    try {
      const res = await deleteLocalBackupSnapshot(filename);
      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        await fetchInfo();
      } else {
        setMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Gagal menghapus file: ' + err?.message });
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <div className="bg-crypto-card rounded-2xl shadow-xl border border-crypto-border overflow-hidden p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-crypto-border pb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-crypto-accent" />
            Manajemen Cadangan (Backup) Database
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Cadangkan data ujian SQLite (<code className="text-crypto-accent">dev.db</code>) setiap sesi selesai agar data siswa, jawaban, dan nilai aman tersimpan.
          </p>
        </div>

        <button 
          onClick={fetchInfo}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-300 bg-black/40 border border-crypto-border rounded-xl hover:bg-crypto-card-hover transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-crypto-accent' : ''}`} />
          Segarkan Info
        </button>
      </div>

      {msg && (
        <div className={`mt-4 p-4 rounded-xl text-sm flex items-center gap-2 border ${
          msg.type === 'success' 
            ? 'bg-crypto-success/10 border-crypto-success/20 text-crypto-success' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Info Status Database */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-black/30 p-4 rounded-xl border border-crypto-border/60">
          <p className="text-xs text-gray-400 font-medium">Ukuran Database Utama</p>
          <p className="text-xl font-bold text-white mt-1">
            {loading ? '...' : (info?.formattedDbSize || '0 KB')}
          </p>
          <span className="text-[11px] text-gray-500 block mt-0.5">dev.db</span>
        </div>

        <div className="bg-black/30 p-4 rounded-xl border border-crypto-border/60">
          <p className="text-xs text-gray-400 font-medium">Ukuran Log Transaksi (WAL)</p>
          <p className="text-xl font-bold text-crypto-accent mt-1">
            {loading ? '...' : (info?.formattedWalSize || '0 KB')}
          </p>
          <span className="text-[11px] text-gray-500 block mt-0.5">dev.db-wal</span>
        </div>

        <div className="bg-black/30 p-4 rounded-xl border border-crypto-border/60">
          <p className="text-xs text-gray-400 font-medium">Terakhir Diperbarui</p>
          <p className="text-sm font-semibold text-gray-200 mt-1 truncate">
            {loading ? '...' : (info?.lastModified || '-')}
          </p>
          <span className="text-[11px] text-gray-500 block mt-0.5">Waktu modifikasi berkas</span>
        </div>
      </div>

      {/* Tombol Aksi Utama */}
      <div className="flex flex-wrap gap-3 pb-6 border-b border-crypto-border">
        <button
          onClick={handleDownloadDirect}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2.5 bg-crypto-accent text-white rounded-xl font-semibold text-sm hover:bg-crypto-accent-hover hover:neon-accent transition-all shadow-md disabled:opacity-50"
        >
          <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
          {isDownloading ? 'Menyiapkan Unduhan...' : 'Unduh Backup Database (.db)'}
        </button>

        <button
          onClick={handleCreateSnapshot}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2.5 bg-black/40 border border-crypto-border text-gray-200 rounded-xl font-semibold text-sm hover:bg-crypto-card-hover hover:text-white transition-all disabled:opacity-50"
        >
          <HardDrive className={`w-4 h-4 ${isCreating ? 'animate-spin text-crypto-accent' : ''}`} />
          {isCreating ? 'Membuat Snapshot...' : 'Simpan Snapshot ke Server'}
        </button>
      </div>

      {/* Riwayat Snapshot Lokal di Server */}
      <div className="mt-6 space-y-3">
        <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <FileArchive className="w-4 h-4 text-crypto-accent" />
          Daftar Snapshot Cadangan di Server ({info?.backups?.length || 0})
        </h4>

        {loading ? (
          <div className="py-6 text-center text-sm text-gray-500">Memuat riwayat backup...</div>
        ) : !info?.backups || info.backups.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500 bg-black/20 rounded-xl border border-dashed border-crypto-border">
            Belum ada arsip backup di server. Klik tombol &quot;Simpan Snapshot ke Server&quot; untuk membuat arsip pertama.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-crypto-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/40 text-xs text-gray-400 uppercase border-b border-crypto-border">
                <tr>
                  <th className="px-4 py-3">Nama Berkas</th>
                  <th className="px-4 py-3">Ukuran</th>
                  <th className="px-4 py-3">Waktu Pembuatan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crypto-border">
                {info.backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-crypto-card-hover/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-200">
                      {b.filename}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">
                      {b.formattedSize}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {b.createdAt}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <a
                        href={`/api/admin/backup/database?filename=${encodeURIComponent(b.filename)}`}
                        download={b.filename}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-lg hover:bg-crypto-accent hover:text-white transition-all"
                      >
                        <Download className="w-3 h-3" /> Unduh
                      </a>
                      <button
                        onClick={() => handleDelete(b.filename)}
                        disabled={deletingFile === b.filename}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        {deletingFile === b.filename ? '...' : 'Hapus'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Tips Pemulihan */}
      <div className="mt-6 bg-crypto-accent/5 border border-crypto-accent/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-crypto-accent flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-300 space-y-1">
          <p className="font-semibold text-white">Saran Standar Operasional CBT Sekolah:</p>
          <p>
            1. Setiap satu sesi ujian selesai dan siswa keluar ruangan, klik <strong>Unduh Backup Database (.db)</strong> dan simpan di flashdisk khusus operator.
          </p>
          <p>
            2. Anda juga dapat mengunduh berkas <strong>Rekap Nilai Lengkap (.xlsx)</strong> langsung dari menu <em>Jadwal Ujian</em> atau <em>Live Monitor</em>.
          </p>
          <p>
            3. Jika server mengalami gangguan daya atau crash, berkas database cadangan dapat langsung dipulihkan (restore) dengan mengganti file <code className="text-crypto-accent">dev.db</code> pada server.
          </p>
        </div>
      </div>
    </div>
  );
}
