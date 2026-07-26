'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface PreviewSoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  soal: any;
}

export default function PreviewSoalModal({ isOpen, onClose, soal }: PreviewSoalModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!isOpen || !soal) return null;

  const opsiArray = typeof soal.opsi === 'string' ? JSON.parse(soal.opsi) : soal.opsi;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#09090b] text-[#f4f4f5] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden relative border border-gray-800 flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-black/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h2 className="text-lg font-bold text-gray-200 tracking-wide uppercase">Preview Soal</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulasi Tampilan ExamClient */}
        <div className="p-4 overflow-y-auto flex-1 font-sans">
          <div className="bg-[rgba(255,255,255,0.03)] rounded-2xl border border-[rgba(255,255,255,0.1)] flex flex-col overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[rgba(255,255,255,0.1)] bg-black/40 flex justify-between items-center">
              <span className="font-semibold text-gray-300 tracking-wider uppercase text-sm">Contoh Tampilan Soal</span>
              <span className="text-xs text-gray-500">Pilihan Ganda</span>
            </div>
            
            <div className="p-6">
              <div 
                className="text-lg text-gray-200 mb-8 leading-relaxed prose prose-invert max-w-none prose-img:rounded-xl prose-img:border prose-img:border-gray-700"
                dangerouslySetInnerHTML={{ __html: soal.pertanyaan }}
              />
              
              <div className="space-y-3">
                {opsiArray.map((opt: string, idx: number) => {
                  const isSelected = selectedOption === opt;
                  const label = String.fromCharCode(65 + idx); // A, B, C...
                  
                  return (
                    <label 
                      key={idx}
                      onClick={() => setSelectedOption(opt)}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#7000FF] bg-[rgba(112,0,255,0.1)] shadow-[0_0_15px_rgba(112,0,255,0.3)]' 
                          : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(112,0,255,0.5)] hover:bg-[rgba(255,255,255,0.05)]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${
                        isSelected ? 'border-[#7000FF]' : 'border-gray-600'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#7000FF]" />}
                      </div>
                      
                      <div className="flex-1 flex gap-3">
                         <span className="font-bold text-gray-400">{label}.</span>
                         <div 
                          className="prose prose-invert prose-sm max-w-none prose-p:my-0 prose-img:rounded-lg"
                          dangerouslySetInnerHTML={{ __html: opt }}
                         />
                      </div>

                      {/* Penanda Kunci Jawaban (Khusus Guru/Admin) */}
                      {soal.kunciJawaban === label && (
                        <div className="ml-3 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30">
                          KUNCI
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500 italic">
            Ini adalah simulasi tampilan pada layar siswa (Dark Mode). Interaksi memilih opsi berfungsi untuk melihat efek visual (hover/klik).
          </div>
        </div>

      </div>
    </div>
  );
}
