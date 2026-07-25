import prisma from '@/lib/prisma';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default async function DataKelasPage() {
  // Ambil data kelas beserta relasi tingkat dan jurusannya
  const kelasi = await prisma.kelas.findMany({
    include: {
      tingkat: true,
      jurusans: true,
      _count: {
        select: { siswas: true }
      }
    },
    orderBy: [
      { tingkat: { level: 'asc' } },
      { nama: 'asc' }
    ]
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <GraduationCap className="w-6 h-6 text-crypto-accent" />
            Data Master Kelas
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Daftar seluruh kelas, tingkat, dan pemetaan jurusan di SMK Banjar Asri.
          </p>
        </div>
        <Link 
          href="/admin/master/kelas/tambah"
          className="px-4 py-2 text-sm font-bold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all hover:neon-accent shadow-lg"
        >
          + Tambah Kelas
        </Link>
      </div>

      <div className="bg-crypto-card rounded-2xl shadow-xl border border-crypto-border overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-black/40 border-b border-crypto-border">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Tingkat</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Nama Kelas</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Program/Jurusan</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center tracking-wider">Jml Siswa</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border/50">
              {kelasi.map((kelas) => (
                <tr key={kelas.id} className="hover:bg-crypto-card-hover transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                    {kelas.tingkat.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-white transition-colors">
                    {kelas.nama}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {kelas.jurusans.map(jurusan => (
                        <span 
                          key={jurusan.id} 
                          className="px-2.5 py-1 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 rounded-md"
                          title={jurusan.nama}
                        >
                          {jurusan.kode}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-md bg-black/40 text-gray-300 border border-crypto-border">
                      {kelas._count.siswas}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link 
                      href={`/admin/master/kelas/${kelas.id}/edit`}
                      className="text-crypto-accent hover:text-white font-semibold text-sm transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
