'use client';

import { useState } from 'react';
import { PlusCircle, FileText, Trash2, Upload, Pencil, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteSoal } from '@/app/actions/bank-soal';
import ImportSoalModal from '@/app/admin/components/ImportSoalModal';
import PreviewSoalModal from '@/app/admin/components/PreviewSoalModal';
import { renderMathInHtml } from '@/app/utils/mathRenderer';

export default function GuruBankSoalDetailClient({ bankSoal, soals }: { bankSoal: any, soals: any[] }) {
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
    <>
      <div className="flex justify-between items-center bg-crypto-card p-4 rounded-xl border border-crypto-border shadow-sm">
        <div className="flex items-center gap-3 text-white">
          <FileText className="w-5 h-5 text-crypto-accent" />
          <span className="font-medium">Total Soal: {soals.length} Butir</span>
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
            href={`/admin/guru/bank-soal/${bankSoal.id}/tambah`}
            className="flex items-center gap-2 bg-crypto-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-crypto-accent-hover transition hover:neon-accent"
          >
            <PlusCircle className="w-5 h-4" />
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
        {soals.map((soal, index) => {
          const opsi = JSON.parse(soal.opsi);
          return (
            <div key={soal.id} className="bg-crypto-card p-6 rounded-xl border border-crypto-border shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-crypto-accent/20 text-crypto-accent rounded-full font-bold text-sm">
                  {index + 1}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPreviewSoal(soal)}
                    className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition" 
                    title="Preview Soal"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <Link 
                    href={`/admin/guru/bank-soal/${bankSoal.id}/edit/${soal.id}`}
                    className="p-2 text-crypto-accent hover:bg-crypto-accent/20 rounded-lg transition" 
                    title="Edit Soal"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => handleDelete(soal.id)}
                    disabled={loadingId === soal.id}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition disabled:opacity-50" 
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div 
                className="text-gray-300 font-medium mb-4 prose prose-sm prose-invert max-w-none prose-img:rounded-lg prose-img:max-h-48 prose-img:w-auto"
                dangerouslySetInnerHTML={{ __html: renderMathInHtml(soal.pertanyaan) }}
              />

              <div className="space-y-2 pl-4">
                {opsi.map((opt: string, i: number) => {
                  const label = String.fromCharCode(65 + i); // A, B, C...
                  const isCorrect = label === soal.kunciJawaban;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${isCorrect ? 'bg-crypto-success/10 border-crypto-success/30' : 'bg-black/20 border-crypto-border/50'}`}>
                      <span className={`font-bold ${isCorrect ? 'text-crypto-success' : 'text-gray-500'}`}>{label}.</span>
                      <div 
                        className={`flex-1 prose prose-sm prose-invert max-w-none prose-p:my-0 prose-img:rounded-lg prose-img:max-h-32 prose-img:w-auto ${isCorrect ? 'text-crypto-success font-medium' : 'text-gray-400'}`}
                        dangerouslySetInnerHTML={{ __html: renderMathInHtml(opt) }}
                      />
                      {isCorrect && (
                        <span className="text-[10px] font-bold text-crypto-success bg-crypto-success/20 px-2 py-1 rounded-full uppercase border border-crypto-success/30">Kunci</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {soals.length === 0 && (
          <div className="text-center py-12 bg-crypto-card rounded-xl border border-crypto-border border-dashed">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Belum ada soal.</p>
            <p className="text-sm text-gray-500 mt-1">Gunakan tombol Import Excel atau Tambah Soal untuk menambahkan butir soal.</p>
          </div>
        )}
      </div>
    </>
  );
}
