'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, Loader2, Download } from 'lucide-react';
import { importBulkSoal } from '@/app/actions/soal';
import { useRouter } from 'next/navigation';

interface ImportSoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankSoalId: number;
}

export default function ImportSoalModal({ isOpen, onClose, bankSoalId }: ImportSoalModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Pertanyaan: 'Siapakah presiden pertama Indonesia?',
        'Opsi A': 'Soekarno',
        'Opsi B': 'Soeharto',
        'Opsi C': 'B.J. Habibie',
        'Opsi D': 'Abdurrahman Wahid',
        'Opsi E': 'Megawati Soekarnoputri',
        'Kunci Jawaban (A/B/C/D/E)': 'A',
        Bobot: 1
      },
      {
        Pertanyaan: 'Jika diketahui persamaan linear $2x + 6 = 16$, maka nilai dari $x$ adalah...',
        'Opsi A': '$x = 5$',
        'Opsi B': '$x = 10$',
        'Opsi C': '$x = 4$',
        'Opsi D': '$x = 3$',
        'Opsi E': '$x = 2$',
        'Kunci Jawaban (A/B/C/D/E)': 'A',
        Bobot: 1
      },
      {
        Pertanyaan: 'Akar-akar dari persamaan kuadrat $x^2 - 5x + 6 = 0$ dengan rumus $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$ adalah...',
        'Opsi A': '$x = 2$ atau $x = 3$',
        'Opsi B': '$x = -2$ atau $x = -3$',
        'Opsi C': '$x = 1$ atau $x = 6$',
        'Opsi D': '$x = -1$ atau $x = -6$',
        'Opsi E': '$x = 0$ atau $x = 5$',
        'Kunci Jawaban (A/B/C/D/E)': 'A',
        Bobot: 1
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Soal');
    XLSX.writeFile(wb, 'template_soal.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        throw new Error('File Excel kosong');
      }

      // Map format excel ke format db
      const formattedData = jsonData.map((row, index) => {
        const pertanyaan = row['Pertanyaan'] || row['pertanyaan'] || row['PERTANYAAN'];
        const opsiA = row['Opsi A'] || row['opsi A'] || row['opsi a'] || row['OPSI A'];
        const opsiB = row['Opsi B'] || row['opsi B'] || row['opsi b'] || row['OPSI B'];
        const opsiC = row['Opsi C'] || row['opsi C'] || row['opsi c'] || row['OPSI C'] || '';
        const opsiD = row['Opsi D'] || row['opsi D'] || row['opsi d'] || row['OPSI D'] || '';
        const opsiE = row['Opsi E'] || row['opsi E'] || row['opsi e'] || row['OPSI E'] || '';
        const kunci = row['Kunci Jawaban (A/B/C/D/E)'] || row['Kunci'] || row['kunci'] || row['KUNCI'];
        const bobot = parseInt(row['Bobot'] || row['bobot'] || row['BOBOT'] || '1');

        if (!pertanyaan || !opsiA || !opsiB || !kunci) {
          throw new Error(`Data tidak lengkap pada baris ${index + 2} (Setelah Header)`);
        }

        const validKunci = ['A', 'B', 'C', 'D', 'E'].includes(kunci.toString().trim().toUpperCase()) 
          ? kunci.toString().trim().toUpperCase() 
          : 'A';

        // Wrap dalam tag p karena rich text editor akan menampilkannya dengan benar
        return {
          pertanyaan: `<p>${pertanyaan}</p>`,
          opsiA: `<p>${opsiA}</p>`,
          opsiB: `<p>${opsiB}</p>`,
          opsiC: opsiC ? `<p>${opsiC}</p>` : '',
          opsiD: opsiD ? `<p>${opsiD}</p>` : '',
          opsiE: opsiE ? `<p>${opsiE}</p>` : '',
          kunciJawaban: validKunci,
          bobot: isNaN(bobot) ? 1 : bobot,
        };
      });

      const result = await importBulkSoal(bankSoalId, formattedData);
      
      if (result.success) {
        setSuccess(`Berhasil mengimpor ${formattedData.length} soal!`);
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1500);
      } else {
        throw new Error(result.error || 'Gagal menyimpan ke database');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memproses file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Import Soal Excel</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium border border-green-100">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center gap-2 p-3 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition"
            >
              <Download className="w-4 h-4" />
              Download Template Excel
            </button>

            <div className="p-3.5 bg-purple-50 text-purple-900 rounded-xl text-xs border border-purple-200 flex items-start gap-2.5">
              <span className="font-serif font-bold text-sm leading-none mt-0.5 text-purple-700">∑</span>
              <div className="space-y-1">
                <span className="font-bold text-purple-950">Mendukung Rumus Matematika (LaTeX):</span>
                <p className="text-purple-800 leading-relaxed">
                  Ketik rumus dengan tanda <code className="bg-purple-100/80 px-1 py-0.5 rounded font-mono text-purple-900 border border-purple-200">$rumus$</code> di kolom Pertanyaan / Opsi. Contoh: <code className="bg-purple-100/80 px-1 py-0.5 rounded font-mono text-purple-900 border border-purple-200">{'$x^2 + \\sqrt{y}$'}</code> atau pecahan <code className="bg-purple-100/80 px-1 py-0.5 rounded font-mono text-purple-900 border border-purple-200">{'$\\frac{a}{b}$'}</code>.
                </p>
              </div>
            </div>

            <div className="relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={`w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl transition ${
                  isLoading 
                    ? 'border-gray-200 bg-gray-50 cursor-wait' 
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                    <span className="text-sm font-medium text-gray-500">Memproses file...</span>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">Pilih atau Drag File Excel</p>
                      <p className="text-xs text-gray-500 mt-1">Hanya mendukung format .xlsx</p>
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
