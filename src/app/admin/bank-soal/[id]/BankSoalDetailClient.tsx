'use client';

import { useState } from 'react';
import { Plus, Trash2, FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { deleteSoal } from '@/app/actions/bank-soal';

export default function BankSoalDetailClient({ bankSoal }: { bankSoal: any }) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleDelete = async (soalId: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus butir soal ini?')) {
      setLoadingId(soalId);
      await deleteSoal(soalId, bankSoal.id);
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <FileQuestion className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Soal</p>
            <p className="text-lg font-bold text-gray-900">{bankSoal.soals.length} Butir</p>
          </div>
        </div>
        
        <Link
          href={`/admin/bank-soal/${bankSoal.id}/soal/tambah`}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Soal
        </Link>
      </div>

      <div className="space-y-4">
        {bankSoal.soals.map((soal: any, index: number) => {
          const opsi = JSON.parse(soal.opsi);
          return (
            <div key={soal.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                    {index + 1}
                  </span>
                  <div>
                    <div 
                      className="text-gray-900 font-medium prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: soal.pertanyaan }}
                    />
                    <div className="mt-2 text-xs font-semibold text-gray-500">
                      Bobot: {soal.bobot}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(soal.id)}
                  disabled={loadingId === soal.id}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  title="Hapus Soal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                          ? 'bg-green-50 border-green-200 text-green-900' 
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-gray-500'}`}>
                        {letter}.
                      </span>
                      <div dangerouslySetInnerHTML={{ __html: op }} className="prose prose-sm max-w-none" />
                      {isCorrect && (
                        <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
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
          <div className="py-12 text-center text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <FileQuestion className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-900">Belum ada butir soal</p>
            <p className="text-sm mt-1">Silakan klik tombol Tambah Soal untuk mulai membuat pertanyaan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
