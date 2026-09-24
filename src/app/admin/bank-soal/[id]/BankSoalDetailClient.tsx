'use client';

import { useState } from 'react';
import { Plus, Trash2, FileQuestion, Upload, Pencil, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteSoal } from '@/app/actions/bank-soal';
import ImportSoalModal from '@/app/admin/components/ImportSoalModal';
import PreviewSoalModal from '@/app/admin/components/PreviewSoalModal';
import { renderMathInHtml } from '@/app/utils/mathRenderer';

export default function BankSoalDetailClient({ bankSoal }: { bankSoal: any }) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [previewSoal, setPreviewSoal] = useState<any | null>(null);
  const router = useRouter();

  const handleDelete = async (soalId: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus butir soal ini?')) {
      setLoadingId(soalId);
      const res = await deleteSoal(soalId, bankSoal.id);
      setLoadingId(null);
      if (res.success) {
        alert(res.message || 'Butir soal berhasil dihapus.');
        router.refresh();
      } else {
        alert(res.error || 'Gagal menghapus butir soal.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-crypto-card p-4 rounded-xl border border-crypto-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-crypto-accent/10 flex items-center justify-center border border-crypto-accent/20">
            <FileQuestion className="w-5 h-5 text-crypto-accent" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Soal</p>
            <p className="text-lg font-bold text-white">{bankSoal.soals.length} Butir</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-lg hover:bg-crypto-accent/20 transition"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          
          <Link
            href={`/admin/bank-soal/${bankSoal.id}/soal/tambah`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-crypto-accent rounded-lg hover:bg-crypto-accent-hover transition shadow-neon"
          >
            <Plus className="w-4 h-4" />
            Tambah Soal
          </Link>
        </div>
      </div>

      <ImportSoalModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        bankSoalId={bankSoal.id}
      />
      
      <PreviewSoalModal 
        isOpen={!!previewSoal}
        onClose={() => setPreviewSoal(null)}
        soal={previewSoal}
      />

      <div className="space-y-4">
        {bankSoal.soals.map((soal: any, index: number) => {
          const opsi = JSON.parse(soal.opsi);
          return (
            <div key={soal.id} className="bg-crypto-card p-6 rounded-xl border border-crypto-border shadow-sm group">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/40 border border-crypto-border flex items-center justify-center font-bold text-gray-400">
                    {index + 1}
                  </span>
                  <div>
                    <div 
                      className="text-white font-medium prose prose-invert prose-sm max-w-none prose-img:rounded-lg prose-img:max-h-48 prose-img:w-auto"
                      dangerouslySetInnerHTML={{ __html: renderMathInHtml(soal.pertanyaan) }}
                    />
                    <div className="mt-2 text-xs font-semibold text-crypto-accent">
                      Bobot: {soal.bobot}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setPreviewSoal(soal)}
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-crypto-accent hover:bg-crypto-accent/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Preview Soal"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/admin/bank-soal/${bankSoal.id}/soal/edit/${soal.id}`}
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-crypto-accent hover:bg-crypto-accent/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Edit Soal"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(soal.id)}
                    disabled={loadingId === soal.id}
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50 opacity-0 group-hover:opacity-100"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pl-11 space-y-2">
                {opsi.map((op: string, i: number) => {
                  const letter = String.fromCharCode(65 + i); // A, B, C, D, E
                  const isCorrect = letter === soal.kunciJawaban;
                  return (
                    <div 
                      key={i} 
                      className={`flex gap-3 p-3 rounded-lg border ${
                        isCorrect 
                          ? 'bg-crypto-success/10 border-crypto-success/30 text-crypto-success' 
                          : 'bg-black/40 border-crypto-border text-gray-400'
                      }`}
                    >
                      <span className={`font-bold ${isCorrect ? 'text-crypto-success' : 'text-gray-500'}`}>
                        {letter}.
                      </span>
                      <div dangerouslySetInnerHTML={{ __html: renderMathInHtml(op) }} className="prose prose-sm prose-invert max-w-none prose-img:rounded-lg prose-img:max-h-32 prose-img:w-auto" />
                      {isCorrect && (
                        <span className="ml-auto text-xs font-bold text-crypto-success bg-crypto-success/20 px-2 py-1 rounded-md">
                          KUNCI JAWABAN
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {bankSoal.soals.length === 0 && (
          <div className="py-12 text-center text-gray-500 bg-crypto-card rounded-xl border-2 border-dashed border-crypto-border">
            <FileQuestion className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="font-medium text-white">Belum ada butir soal</p>
            <p className="text-sm mt-1 text-gray-400">Silakan klik tombol Tambah Soal untuk mulai membuat pertanyaan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
