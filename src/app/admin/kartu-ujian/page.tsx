import prisma from '@/lib/prisma';
import KartuUjianClient from './KartuUjianClient';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export default async function KartuUjianPage() {
  const [pengaturan, kelass, ruangans, siswas] = await Promise.all([
    prisma.pengaturan.findFirst(),
    prisma.kelas.findMany({
      orderBy: { nama: 'asc' },
    }),
    prisma.ruangan.findMany({
      orderBy: { nama: 'asc' },
    }),
    prisma.siswa.findMany({
      include: {
        kelas: true,
        ruangan: true,
      },
      orderBy: [
        { kelas: { nama: 'asc' } },
        { nama: 'asc' },
      ],
    }),
  ]);

  // Generate QR Code SVG vector for each student
  const siswasWithQr = await Promise.all(
    siswas.map(async (s) => {
      let qrSvg = '';
      try {
        qrSvg = await QRCode.toString(s.nis, {
          type: 'svg',
          margin: 1,
          width: 70,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
      } catch {
        qrSvg = '<svg></svg>';
      }

      return {
        id: s.id,
        nis: s.nis,
        nama: s.nama,
        passwordPlain: s.passwordPlain,
        kelas: {
          id: s.kelas.id,
          nama: s.kelas.nama,
        },
        ruangan: s.ruangan
          ? {
              id: s.ruangan.id,
              nama: s.ruangan.nama,
            }
          : null,
        qrSvg,
      };
    })
  );

  return (
    <KartuUjianClient
      siswas={siswasWithQr}
      kelass={kelass}
      ruangans={ruangans}
      pengaturan={{
        namaSekolah: pengaturan?.namaSekolah || 'SMK BANJAR ASRI',
        namaSistem: pengaturan?.namaSistem || 'UPIN',
        logoUrl: pengaturan?.logoUrl || '/uploads/logo-upin.png',
        tahunAjaran: pengaturan?.tahunAjaran || '2024/2025',
        semester: pengaturan?.semester || 'Ganjil',
        alamat: pengaturan?.alamat || null,
      }}
    />
  );
}
