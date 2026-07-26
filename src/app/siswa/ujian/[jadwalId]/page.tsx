import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ExamClient from './ExamClient';

export default async function UjianPage({ params }: { params: Promise<{ jadwalId: string }> }) {
  const resolvedParams = await params;
  const jadwalId = parseInt(resolvedParams.jadwalId);

  const cookieStore = await cookies();
  const siswaIdStr = cookieStore.get('siswaId')?.value;

  if (!siswaIdStr) redirect('/');
  const siswaId = parseInt(siswaIdStr);

  const sesi = await prisma.sesiUjianSiswa.findUnique({
    where: { siswaId_jadwalId: { siswaId, jadwalId } },
    include: {
      jadwal: {
        include: {
          bankSoal: {
            include: { soals: true, mapel: true }
          }
        }
      },
      jawabans: true,
      siswa: true
    }
  });

  if (!sesi) redirect('/siswa');
  
  if (sesi.status === 'FINISHED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-200">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ujian Selesai!</h2>
          <p className="text-gray-600 mb-6">Anda telah menyelesaikan ujian ini. Jawaban Anda telah tersimpan dengan aman di server.</p>
          <a href="/siswa" className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-center">
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Siapkan data untuk dikirim ke Client Component
  const initialAnswers = sesi.jawabans.reduce((acc: Record<number, string>, j: { soalId: number, opsiDipilih: string | null }) => {
    acc[j.soalId] = j.opsiDipilih || '';
    return acc;
  }, {} as Record<number, string>);

  const soals = sesi.jadwal.bankSoal.soals.map((s: { id: number, pertanyaan: string, opsi: string }) => ({
    id: s.id,
    pertanyaan: s.pertanyaan,
    opsi: JSON.parse(s.opsi) as string[]
  }));

  return (
    <ExamClient 
      sesiId={sesi.id}
      jadwal={sesi.jadwal}
      soals={soals}
      initialAnswers={initialAnswers}
      initialPelanggaran={sesi.pelanggaran}
      siswaNama={sesi.siswa.nama}
      acakSoal={sesi.jadwal.acakSoal}
      acakOpsi={sesi.jadwal.acakOpsi}
    />
  );
}
