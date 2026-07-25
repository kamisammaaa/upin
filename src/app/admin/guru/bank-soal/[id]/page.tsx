import { getBankSoalDetail, getSoalByBankSoalId } from '@/app/actions/soal';
import { ArrowLeft, PlusCircle, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DetailBankSoalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  
  if (isNaN(id)) redirect('/admin/guru/bank-soal');

  const bankSoal = await getBankSoalDetail(id);
  if (!bankSoal) redirect('/admin/guru/bank-soal');

  const soals = await getSoalByBankSoalId(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/guru/bank-soal" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{bankSoal.judul}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Mata Pelajaran: <span className="font-semibold text-gray-700">{bankSoal.mapel.nama}</span>
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 text-gray-700">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Total Soal: {soals.length} Butir</span>
        </div>
        <Link 
          href={`/admin/guru/bank-soal/${id}/tambah`}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          <PlusCircle className="w-5 h-5" />
          Tambah Soal
        </Link>
      </div>

      <div className="space-y-4">
        {soals.map((soal, index) => {
          const opsi = JSON.parse(soal.opsi);
          return (
            <div key={soal.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                  {index + 1}
                </span>
                <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus Soal">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-gray-900 font-medium mb-4 whitespace-pre-wrap">
                {soal.pertanyaan}
              </div>

              <div className="space-y-2 pl-4">
                {opsi.map((opt: string, i: number) => {
                  const label = String.fromCharCode(65 + i); // A, B, C...
                  const isCorrect = label === soal.kunciJawaban;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                      <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-gray-500'}`}>{label}.</span>
                      <span className={`flex-1 ${isCorrect ? 'text-green-900 font-medium' : 'text-gray-700'}`}>{opt}</span>
                      {isCorrect && (
                        <span className="text-xs font-bold px-2 py-1 bg-green-200 text-green-800 rounded-full">Kunci Jawaban</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {soals.length === 0 && (
          <div className="py-12 text-center text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-200">
            Belum ada butir soal di paket ini. Silakan klik "Tambah Soal".
          </div>
        )}
      </div>
    </div>
  );
}
