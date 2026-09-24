'use client';

import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { renderMathInHtml } from '@/app/utils/mathRenderer';

interface PreviewBankSoalProps {
  bankSoal: any;
  role: 'admin' | 'guru';
}

export default function PreviewBankSoal({ bankSoal, role }: PreviewBankSoalProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-black font-sans print:bg-white">
      {/* Non-printable Header */}
      <div className="bg-gray-100 p-4 print:hidden flex justify-between items-center border-b border-gray-200">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-700 hover:text-black font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Kembali
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
        >
          <Printer className="w-5 h-5" /> Cetak Soal
        </button>
      </div>

      {/* Printable Area (A4 Layout) */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 sm:p-12 print:p-0 print:max-w-none">
        
        {/* KOP Surat / Header Bank Soal */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">BANK SOAL</h1>
          <h2 className="text-xl font-bold uppercase">{bankSoal.judul}</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-semibold">
            <span>Mata Pelajaran: {bankSoal.mapel?.nama}</span>
            <span>Kelas: {bankSoal.tingkat} {bankSoal.jurusan !== 'SEMUA' ? bankSoal.jurusan : ''}</span>
            <span>Guru: {bankSoal.guru?.nama}</span>
          </div>
        </div>

        {/* Daftar Soal */}
        <div className="space-y-8">
          {bankSoal.soals.map((soal: any, index: number) => {
            const opsi = JSON.parse(soal.opsi);
            
            return (
              <div key={soal.id} className="flex gap-4 page-break-inside-avoid">
                {/* Nomor */}
                <div className="font-bold shrink-0">{index + 1}.</div>
                
                {/* Konten Soal */}
                <div className="flex-1 w-full max-w-full overflow-hidden">
                  <div 
                    className="prose prose-sm max-w-none text-black prose-img:max-h-64 prose-img:w-auto prose-p:my-1 mb-4"
                    dangerouslySetInnerHTML={{ __html: renderMathInHtml(soal.pertanyaan) }}
                  />
                  
                  {/* Opsi Jawaban */}
                  <div className="space-y-2 pl-2">
                    {opsi.map((opt: string, optIdx: number) => {
                      const label = String.fromCharCode(65 + optIdx);
                      const isKunci = soal.kunciJawaban === label;
                      
                      return (
                        <div key={optIdx} className="flex gap-3">
                          <span className={`font-bold shrink-0 ${isKunci ? 'text-green-600 underline print:text-black print:no-underline' : ''}`}>
                            {label}.
                          </span>
                          <div 
                            className={`flex-1 prose prose-sm max-w-none text-black prose-img:max-h-40 prose-img:w-auto prose-p:my-0 ${isKunci ? 'font-medium text-green-800 print:text-black' : ''}`}
                            dangerouslySetInnerHTML={{ __html: renderMathInHtml(opt) }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {bankSoal.soals.length === 0 && (
            <div className="text-center italic text-gray-500 py-10">
              Belum ada soal pada bank soal ini.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
